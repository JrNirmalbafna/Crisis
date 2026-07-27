"""XGBoost Model Training & ONNX Export — Enhanced Pipeline

Trains THREE models on the enriched 9-feature dataset:

  Model 1 — cme_impact_classifier  (XGBClassifier)
    Predicts: geoeffective  [0 = near-miss, 1 = storm hit]
    Used as: first-stage gate before arrival time / severity predictions

  Model 2 — cme_arrival_model  (XGBRegressor)
    Predicts: transit_time_hours
    Trained only on geoeffective=1 rows (confirmed hits)

  Model 3 — cme_impact_model  (XGBRegressor)
    Predicts: target_kp (maximum Kp index / storm severity)
    Trained only on geoeffective=1 rows

All three are exported to ONNX for zero-dependency inference in the FastAPI backend.

Feature set (9 features vs original 4):
  Original:  cme_speed_km_s, cme_width_deg, cme_cpa_deg, is_halo
  New (D):   kinetic_energy_proxy, sw_background_speed,
             solar_cycle_phase, dst_precondition, drag_factor
"""

import os
import numpy as np
import pandas as pd
from loguru import logger
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    mean_absolute_error, mean_squared_error,
    roc_auc_score, f1_score, classification_report,
)
from xgboost import XGBRegressor, XGBClassifier
import onnxmltools
from onnxmltools.convert.common.data_types import FloatTensorType
import mlflow
import mlflow.xgboost

TRAINING_DATA = "ml/data/training_dataset.csv"
MODEL_DIR     = "backend/models"

# ─── Feature Sets ─────────────────────────────────────────────────────────────
BASE_FEATURES = [
    "cme_speed_km_s",
    "cme_width_deg",
    "cme_cpa_deg",
    "is_halo",
]
PHYSICS_FEATURES = [
    "kinetic_energy_proxy",
    "sw_background_speed",
    "solar_cycle_phase",
    "dst_precondition",
    "drag_factor",
]
ALL_FEATURES = BASE_FEATURES + PHYSICS_FEATURES
N_FEATURES = len(ALL_FEATURES)


# ─── Data Loading ─────────────────────────────────────────────────────────────

def load_data() -> pd.DataFrame:
    logger.info(f"Loading dataset: {TRAINING_DATA}")
    df = pd.read_csv(TRAINING_DATA)
    logger.info(f"Loaded {len(df):,} rows, {len(df.columns)} columns.")

    # Detect whether the enriched dataset has the new columns
    missing_physics = [f for f in PHYSICS_FEATURES if f not in df.columns]
    if missing_physics:
        logger.warning(
            f"Physics features missing from dataset: {missing_physics}. "
            "Filling with zeros — re-run fetch_omni_data.py for full features."
        )
        for col in missing_physics:
            df[col] = 0.0

    if "geoeffective" not in df.columns:
        logger.warning("'geoeffective' column missing — assuming all rows are hits (legacy dataset).")
        df["geoeffective"] = 1

    df[ALL_FEATURES] = df[ALL_FEATURES].astype(np.float32)
    return df


# ─── ONNX Export ──────────────────────────────────────────────────────────────

def export_onnx(model, model_name: str, n_features: int, classifier: bool = False):
    os.makedirs(MODEL_DIR, exist_ok=True)
    path = os.path.join(MODEL_DIR, f"{model_name}.onnx")
    initial_type = [("float_input", FloatTensorType([None, n_features]))]
    try:
        if classifier:
            onnx_model = onnxmltools.convert_xgboost(model, initial_types=initial_type)
        else:
            onnx_model = onnxmltools.convert_xgboost(model, initial_types=initial_type)
        with open(path, "wb") as f:
            f.write(onnx_model.SerializeToString())
        logger.success(f"ONNX saved → {path}")
        return path
    except Exception as e:
        logger.error(f"ONNX export failed for {model_name}: {e}")
        return None


# ─── Model 1: Impact Classifier ───────────────────────────────────────────────

def train_classifier(df: pd.DataFrame):
    """Binary classifier: will this CME cause a geomagnetic storm?"""
    logger.info("\n" + "=" * 60)
    logger.info("Model 1 — cme_impact_classifier (geoeffective: 0/1)")
    logger.info("=" * 60)

    X = df[ALL_FEATURES].astype(np.float32)
    y = df["geoeffective"].astype(int)

    n_pos = int(y.sum())
    n_neg = int((y == 0).sum())
    pos_rate = n_pos / max(len(y), 1)
    logger.info(f"Class balance: {n_pos:,} hits, {n_neg:,} near-misses ({pos_rate:.1%} positive)")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # When positive class (hits) is the majority, use sample_weight to boost
    # the minority (near-miss) class rather than scale_pos_weight.
    # scale_pos_weight is for when *positive* is minority.
    neg_weight = n_pos / max(n_neg, 1)   # e.g. 21434/3179 ≈ 6.7
    sample_weight_train = np.where(y_train == 0, neg_weight, 1.0).astype(np.float32)

    mlflow.set_experiment("Helios_CME_Prediction")
    with mlflow.start_run(run_name="cme_impact_classifier"):
        params = {
            "n_estimators": 300,
            "max_depth": 5,
            "learning_rate": 0.05,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
            "objective": "binary:logistic",
            "eval_metric": "logloss",
            "random_state": 42,
            "n_jobs": -1,
        }
        mlflow.log_params(params)

        model = XGBClassifier(**params)
        model.fit(
            X_train.values, y_train.values,
            sample_weight=sample_weight_train,
            eval_set=[(X_test.values, y_test.values)],
            verbose=False,
        )

        probs = model.predict_proba(X_test.values)[:, 1]
        preds = (probs >= 0.5).astype(int)
        auc = roc_auc_score(y_test, probs)
        f1  = f1_score(y_test, preds, zero_division=0)

        logger.info(f"AUC-ROC: {auc:.4f}   F1: {f1:.4f}")
        logger.info(
            classification_report(
                y_test, preds,
                target_names=["Near-Miss", "Hit"],
                zero_division=0,
            )
        )

        mlflow.log_metric("auc_roc", auc)
        mlflow.log_metric("f1_score", f1)
        mlflow.xgboost.log_model(model, artifact_path="xgboost_model")

        onnx_path = export_onnx(model, "cme_impact_classifier", N_FEATURES, classifier=True)
        if onnx_path:
            mlflow.log_artifact(onnx_path)

    return model


# ─── Model 2: Arrival Time Regressor ─────────────────────────────────────────

def train_arrival_model(df: pd.DataFrame):
    """Transit time regressor — trained only on confirmed hits."""
    logger.info("\n" + "=" * 60)
    logger.info("Model 2 — cme_arrival_model (transit time, hours)")
    logger.info("=" * 60)

    hits = df[df["geoeffective"] == 1].dropna(subset=["transit_time_hours"])
    logger.info(f"Training on {len(hits):,} confirmed geoeffective events.")

    X = hits[ALL_FEATURES].astype(np.float32)
    y = hits["transit_time_hours"].astype(np.float32)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    mlflow.set_experiment("Helios_CME_Prediction")
    with mlflow.start_run(run_name="cme_arrival_model"):
        params = {
            "n_estimators": 400,
            "max_depth": 6,
            "learning_rate": 0.05,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
            "objective": "reg:squarederror",
            "random_state": 42,
            "n_jobs": -1,
        }
        mlflow.log_params(params)

        model = XGBRegressor(**params)
        model.fit(X_train.values, y_train.values,
                  eval_set=[(X_test.values, y_test.values)], verbose=False)

        preds = model.predict(X_test.values)
        mae  = mean_absolute_error(y_test, preds)
        rmse = np.sqrt(mean_squared_error(y_test, preds))

        logger.info(f"MAE:  {mae:.2f} hours  (uncertainty window)")
        logger.info(f"RMSE: {rmse:.2f} hours  (used for UQ error bounds)")

        mlflow.log_metric("mae_hours", mae)
        mlflow.log_metric("rmse_hours", rmse)
        mlflow.xgboost.log_model(model, artifact_path="xgboost_model")

        onnx_path = export_onnx(model, "cme_arrival_model", N_FEATURES)
        if onnx_path:
            mlflow.log_artifact(onnx_path)

    return model, rmse


# ─── Model 3: Kp Severity Regressor ──────────────────────────────────────────

def train_kp_model(df: pd.DataFrame):
    """Geomagnetic storm severity (max Kp) regressor."""
    logger.info("\n" + "=" * 60)
    logger.info("Model 3 — cme_impact_model (max Kp index)")
    logger.info("=" * 60)

    hits = df[df["geoeffective"] == 1].dropna(subset=["target_kp"])
    logger.info(f"Training on {len(hits):,} confirmed geoeffective events.")

    X = hits[ALL_FEATURES].astype(np.float32)
    y = hits["target_kp"].astype(np.float32)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    mlflow.set_experiment("Helios_CME_Prediction")
    with mlflow.start_run(run_name="cme_impact_model"):
        params = {
            "n_estimators": 400,
            "max_depth": 6,
            "learning_rate": 0.05,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
            "objective": "reg:squarederror",
            "random_state": 42,
            "n_jobs": -1,
        }
        mlflow.log_params(params)

        model = XGBRegressor(**params)
        model.fit(X_train.values, y_train.values,
                  eval_set=[(X_test.values, y_test.values)], verbose=False)

        preds = model.predict(X_test.values)
        mae  = mean_absolute_error(y_test, preds)
        rmse = np.sqrt(mean_squared_error(y_test, preds))

        logger.info(f"MAE:  {mae:.2f} Kp units")
        logger.info(f"RMSE: {rmse:.2f} Kp units")

        mlflow.log_metric("mae_kp", mae)
        mlflow.log_metric("rmse_kp", rmse)
        mlflow.xgboost.log_model(model, artifact_path="xgboost_model")

        onnx_path = export_onnx(model, "cme_impact_model", N_FEATURES)
        if onnx_path:
            mlflow.log_artifact(onnx_path)

    return model, rmse


# ─── Feature Importance Report ────────────────────────────────────────────────

def log_feature_importance(model, name: str):
    importances = model.feature_importances_
    ranked = sorted(zip(ALL_FEATURES, importances), key=lambda x: -x[1])
    logger.info(f"\nFeature importance — {name}:")
    for feat, score in ranked:
        bar = "█" * int(score * 40)
        logger.info(f"  {feat:<30} {bar}  {score:.4f}")


# ─── Main ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if not os.path.exists(TRAINING_DATA):
        logger.error(f"Dataset not found: {TRAINING_DATA}")
        logger.error("Run:  python ml/fetch_omni_data.py")
        exit(1)

    df = load_data()

    logger.info(f"\nDataset summary:")
    logger.info(f"  Total rows:       {len(df):,}")
    logger.info(f"  Geoeffective=1:   {(df['geoeffective']==1).sum():,}")
    logger.info(f"  Near-miss (0):    {(df['geoeffective']==0).sum():,}")
    logger.info(f"  Feature count:    {N_FEATURES}")
    logger.info(f"  Features:         {ALL_FEATURES}")

    # Train all three models
    clf          = train_classifier(df)
    arr_model, arr_rmse = train_arrival_model(df)
    kp_model,  kp_rmse  = train_kp_model(df)

    # Feature importance
    log_feature_importance(clf,       "cme_impact_classifier")
    log_feature_importance(arr_model, "cme_arrival_model")
    log_feature_importance(kp_model,  "cme_impact_model")

    logger.info("\n" + "=" * 60)
    logger.info("✅ Training Complete — 3 models exported to ONNX")
    logger.info(f"   Arrival RMSE: ±{arr_rmse:.1f} hours  (UQ bounds)")
    logger.info(f"   Kp RMSE:      ±{kp_rmse:.1f} Kp units")
    logger.info("   Models ready for FastAPI inference via onnxruntime")
    logger.info("=" * 60)
