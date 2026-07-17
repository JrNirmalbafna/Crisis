"""XGBoost Model Training & ONNX Export

This script trains two Machine Learning models on the merged CME-OMNI dataset:
1. cme_arrival_model: Predicts the transit time of the CME (in hours).
2. cme_impact_model: Predicts the maximum Kp index (severity).

We use XGBoost for robust tabular data regression.
After training, the models are exported to ONNX format. This allows the 
FastAPI backend to run the models natively using the ultra-lightweight 
`onnxruntime`, completely decoupling the heavy ML stack from the API server.
"""

import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error
from xgboost import XGBRegressor
import onnxmltools
from onnxmltools.convert.common.data_types import FloatTensorType
import mlflow
import mlflow.xgboost
from loguru import logger

TRAINING_DATA = "ml/data/training_dataset.csv"
MODEL_DIR = "backend/models"

def prepare_data():
    """Load and prepare features and targets."""
    logger.info(f"Loading dataset from {TRAINING_DATA}...")
    df = pd.read_csv(TRAINING_DATA)
    
    # Drop any missing targets
    df = df.dropna(subset=['transit_time_hours', 'target_kp'])
    
    # Input features (X)
    features = ['cme_speed_km_s', 'cme_width_deg', 'cme_cpa_deg', 'is_halo']
    X = df[features].astype(np.float32)
    
    # Target 1: Arrival Time (hours)
    y_time = df['transit_time_hours'].astype(np.float32)
    
    # Target 2: Impact Severity (Kp Index)
    y_kp = df['target_kp'].astype(np.float32)
    
    return train_test_split(X, y_time, y_kp, test_size=0.2, random_state=42)

def train_and_export_model(X_train, y_train, X_test, y_test, model_name, target_name):
    """Train XGBoost model, evaluate, export to ONNX, and track in MLflow."""
    logger.info(f"\n--- Training {model_name} ({target_name}) ---")
    
    mlflow.set_experiment("Helios_CME_Prediction")
    with mlflow.start_run(run_name=model_name):
        # Hyperparameters
        params = {
            "n_estimators": 100,
            "max_depth": 5,
            "learning_rate": 0.1,
            "objective": 'reg:squarederror',
            "random_state": 42
        }
        mlflow.log_params(params)
        
        # Train the XGBoost Regressor
        model = XGBRegressor(**params, n_jobs=-1)
        model.fit(X_train.values, y_train.values)
        
        # Evaluate
        predictions = model.predict(X_test.values)
        mae = mean_absolute_error(y_test, predictions)
        rmse = np.sqrt(mean_squared_error(y_test, predictions))
        
        logger.info(f"Evaluation Metrics:")
        logger.info(f"  MAE:  {mae:.2f}")
        logger.info(f"  RMSE: {rmse:.2f} (We will use this for Uncertainty Quantification)")
        
        mlflow.log_metric("mae", mae)
        mlflow.log_metric("rmse", rmse)
        
        # Log the native XGBoost model to MLflow
        mlflow.xgboost.log_model(model, artifact_path="xgboost_model")
        
        # Export to ONNX
        os.makedirs(MODEL_DIR, exist_ok=True)
        onnx_path = os.path.join(MODEL_DIR, f"{model_name}.onnx")
        
        logger.info("Converting XGBoost model to ONNX format...")
        initial_type = [('float_input', FloatTensorType([None, 4]))]
        onnx_model = onnxmltools.convert_xgboost(model, initial_types=initial_type)
        
        with open(onnx_path, "wb") as f:
            f.write(onnx_model.SerializeToString())
            
        logger.info(f"Model saved to {onnx_path}")
        
        # Log the ONNX artifact to MLflow
        mlflow.log_artifact(onnx_path)
        
    return rmse


if __name__ == "__main__":
    if not os.path.exists(TRAINING_DATA):
        logger.error(f"Training dataset not found: {TRAINING_DATA}")
        logger.error("Run `python ml/fetch_omni_data.py` first.")
        exit(1)
        
    X_train, X_test, y_time_train, y_time_test, y_kp_train, y_kp_test = prepare_data()
    
    logger.info(f"Training on {len(X_train)} samples. Testing on {len(X_test)} samples.")
    
    # Train Model 1: Arrival Time
    time_rmse = train_and_export_model(
        X_train, y_time_train, X_test, y_time_test, 
        model_name="cme_arrival_model", 
        target_name="Transit Time in Hours"
    )
    
    # Train Model 2: Impact Severity (Kp)
    kp_rmse = train_and_export_model(
        X_train, y_kp_train, X_test, y_kp_test, 
        model_name="cme_impact_model", 
        target_name="Kp Index"
    )
    
    logger.info("\n✅ Training and ONNX Export Complete!")
    logger.info("The FastAPI backend can now load these .onnx files for real-time predictions.")
