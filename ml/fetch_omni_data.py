"""Enhanced Dataset Builder — Helios Intelligence ML Pipeline

Builds the richest possible supervised training dataset for CME prediction by:

Strategy A — Relaxed CME filter (speed > 400 km/s, not 800) keeps moderate events
Strategy B — Near-misses labeled as geoeffective=0 → enables binary impact classifier
Strategy C — Merges NASA DONKI API data (2010–present) with confirmed storm linkages
Strategy D — Engineers 5 physics-derived features from raw CME parameters + OMNI context

Output: ml/data/training_dataset.csv  (~7,000–12,000 rows vs original 1,897)

Data Sources:
  - OMNI2 Hourly:   https://spdf.gsfc.nasa.gov/pub/data/omni/low_res_omni/omni2_all_years.dat
  - DONKI CME API:  https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/CME
  - DONKI Storm API: https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/GST
  - SILSO Sunspot:  https://www.sidc.be/silso/DATA/SN_m_tot_V2.0.csv
"""

import os
import json
import ssl
import urllib.request
import pandas as pd
import numpy as np
from loguru import logger
from datetime import datetime, timedelta, timezone
from io import StringIO

# Bypass SSL cert verification for government data servers (Windows Python
# does not use the OS certificate store, causing CERTIFICATE_VERIFY_FAILED
# on trusted servers like sidc.be and spdf.gsfc.nasa.gov).
_SSL_CTX = ssl.create_default_context()
_SSL_CTX.check_hostname = False
_SSL_CTX.verify_mode = ssl.CERT_NONE

# ─── File Paths ───────────────────────────────────────────────────────────────
OMNI_HOURLY_URL  = "https://spdf.gsfc.nasa.gov/pub/data/omni/low_res_omni/omni2_all_years.dat"
DONKI_BASE_URL   = "https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get"
SILSO_URL        = "https://www.sidc.be/silso/DATA/SN_m_tot_V2.0.csv"

OMNI_LOCAL_FILE   = "ml/data/omni2_hourly.dat"
DONKI_CME_FILE    = "ml/data/donki_cme.json"      # merged output
DONKI_STORM_FILE  = "ml/data/donki_storms.json"   # merged output
SILSO_FILE        = "ml/data/silso_sunspot.csv"
CME_CATALOG_FILE  = "historical_cme_catalog.csv"
OUTPUT_DATASET    = "ml/data/training_dataset.csv"

# DONKI year range to fetch (quarterly chunks to avoid timeouts on heavy years)
DONKI_START_YEAR    = 2010
DONKI_END_YEAR      = 2026
DONKI_CHUNK_TIMEOUT = 45     # seconds per quarterly request
DONKI_MAX_RETRIES   = 2

# Quarterly windows: (start_month, end_month, end_day, label)
_QUARTERS = [
    ("01", "03", "31", "Q1"),
    ("04", "06", "30", "Q2"),
    ("07", "09", "30", "Q3"),
    ("10", "12", "31", "Q4"),
]

# ─── Strategy A: Relaxed filter thresholds ────────────────────────────────────
CME_SPEED_MIN_KMS      = 400     # was 800 — includes moderate geoeffective events
DST_GEOEFFECTIVE_LIMIT = -20     # was -30 — slightly looser storm detection
TRANSIT_WINDOW_DAYS    = (0.5, 6) # widen from (1,5) to catch fast/slow CMEs

# ─── Download Helpers ─────────────────────────────────────────────────────────

def _get_json(url: str, timeout: int = 30) -> list:
    """Fetch a URL and return parsed JSON list. Returns [] on any error."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Helios-Intelligence/1.0"})
        with urllib.request.urlopen(req, timeout=timeout, context=_SSL_CTX) as resp:
            raw = resp.read().decode("utf-8")
            data = json.loads(raw)
            return data if isinstance(data, list) else []
    except Exception as e:
        logger.warning(f"  Request failed: {e}")
        return []


def _download(url: str, dest: str, label: str, timeout: int = 120):
    """Download a binary/text file if not already present."""
    if os.path.exists(dest):
        logger.info(f"[SKIP] {label} already downloaded.")
        return True
    logger.info(f"[DL] {label} → {dest} ...")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Helios-Intelligence/1.0"})
        with urllib.request.urlopen(req, timeout=timeout, context=_SSL_CTX) as resp, open(dest, "wb") as out:
            out.write(resp.read())
        logger.info(f"[OK] {label} saved.")
        return True
    except Exception as e:
        logger.warning(f"[FAIL] Could not download {label}: {e}")
        return False


def _download_donki_chunked(endpoint: str, dest_file: str, label: str) -> bool:
    """Download DONKI data in quarterly chunks to avoid server timeouts.

    2022-2025 (solar cycle 25 peak) can have 500-1000+ CMEs per year,
    causing yearly requests to time out. Quarterly requests (~250 max)
    are small enough to complete reliably within 45 seconds.

    Cache: donki_<endpoint>_YYYY_Q1.json ... Q4.json
    Merge: all quarters combined into dest_file on completion.
    """
    if os.path.exists(dest_file):
        logger.info(f"[SKIP] {label} already downloaded.")
        return True

    os.makedirs("ml/data", exist_ok=True)
    all_records: list = []

    for year in range(DONKI_START_YEAR, DONKI_END_YEAR + 1):
        for start_m, end_m, end_d, q_label in _QUARTERS:
            chunk_file = f"ml/data/donki_{endpoint}_{year}_{q_label}.json"

            # Load from cache if already downloaded
            if os.path.exists(chunk_file):
                with open(chunk_file) as f:
                    chunk = json.load(f)
                if chunk:  # only log non-empty cached quarters
                    logger.info(f"  [CACHE] {label} {year} {q_label}: {len(chunk)} records")
                all_records.extend(chunk)
                continue

            url = (
                f"{DONKI_BASE_URL}/{endpoint}"
                f"?startDate={year}-{start_m}-01"
                f"&endDate={year}-{end_m}-{end_d}"
            )
            logger.info(f"  [DL] {label} {year} {q_label} ...")

            chunk = []
            for attempt in range(1, DONKI_MAX_RETRIES + 2):
                chunk = _get_json(url, timeout=DONKI_CHUNK_TIMEOUT)
                if chunk or attempt > DONKI_MAX_RETRIES:
                    break
                logger.warning(f"    Retry {attempt}/{DONKI_MAX_RETRIES} ({year} {q_label}) ...")

            # Cache the quarter (even if empty — avoids re-fetching)
            with open(chunk_file, "w") as f:
                json.dump(chunk, f)

            if chunk:
                logger.info(f"  [OK] {label} {year} {q_label}: {len(chunk)} records")
            else:
                logger.warning(f"  [EMPTY] {label} {year} {q_label}: 0 records (timeout or no data)")

            all_records.extend(chunk)

    # Write merged file
    with open(dest_file, "w") as f:
        json.dump(all_records, f)
    logger.success(f"[DONE] {label}: {len(all_records)} total records → {dest_file}")
    return True


def download_all():
    os.makedirs("ml/data", exist_ok=True)
    # OMNI2 binary file (large, single download is fine — NASA SPDF is reliable)
    _download(OMNI_HOURLY_URL, OMNI_LOCAL_FILE, "OMNI2 Hourly (~175MB)", timeout=300)
    # DONKI chunked by year (avoids server timeout on 16-year range)
    _download_donki_chunked("CME",  DONKI_CME_FILE,   "NASA DONKI CME catalog")
    _download_donki_chunked("GST",  DONKI_STORM_FILE,  "NASA DONKI Geomagnetic Storms")
    # SILSO sunspot number (small CSV)
    _download(SILSO_URL, SILSO_FILE, "SILSO Monthly Sunspot Number")


# ─── OMNI Parser ─────────────────────────────────────────────────────────────

def parse_omni() -> pd.DataFrame:
    logger.info("Parsing OMNI2 hourly data …")
    cols = list(range(55))
    df = pd.read_csv(
        OMNI_LOCAL_FILE,
        sep=r"\s+",
        header=None,
        names=[str(i) for i in cols],
        usecols=["0", "1", "2", "24", "38", "40"],
        engine="c",
    )
    df = df.rename(columns={"0": "year", "1": "day", "2": "hour",
                             "24": "sw_speed", "38": "kp_index", "40": "dst_index"})
    date_str = df["year"].astype(str) + " " + df["day"].astype(str) + " " + df["hour"].astype(str)
    df["timestamp"] = pd.to_datetime(date_str, format="%Y %j %H", utc=True)
    df["sw_speed"]  = df["sw_speed"].replace([9999, 9999.0], np.nan)
    df["dst_index"] = df["dst_index"].replace([99999, 99999.0], np.nan)
    df["kp_index"]  = df["kp_index"].replace([99, 99.0], np.nan) / 10.0
    df = df.dropna(subset=["timestamp"]).sort_values("timestamp").set_index("timestamp")
    logger.info(f"OMNI: {len(df):,} hourly records loaded.")
    return df


# ─── Sunspot Parser (Strategy D feature) ─────────────────────────────────────

def parse_silso() -> pd.DataFrame:
    """Monthly smoothed sunspot number → solar cycle phase feature."""
    if not os.path.exists(SILSO_FILE):
        logger.warning("SILSO sunspot file missing — solar_cycle_phase will be 0.")
        return pd.DataFrame(columns=["year", "month", "sunspot_number"])
    df = pd.read_csv(SILSO_FILE, sep=";", header=None,
                     names=["year", "month", "_frac_year", "sunspot_number", "_std", "_obs", "_flag"])
    df = df[["year", "month", "sunspot_number"]].dropna()
    df["sunspot_number"] = pd.to_numeric(df["sunspot_number"], errors="coerce").fillna(0)
    logger.info(f"SILSO: {len(df):,} monthly sunspot records loaded.")
    return df


def get_sunspot_at(silso_df: pd.DataFrame, dt: pd.Timestamp) -> float:
    if silso_df.empty:
        return 0.0
    match = silso_df[(silso_df["year"] == dt.year) & (silso_df["month"] == dt.month)]
    return float(match["sunspot_number"].iloc[0]) if not match.empty else 0.0


# ─── DONKI Loader (Strategy C) ───────────────────────────────────────────────

def load_donki_cmes() -> pd.DataFrame:
    """Load NASA DONKI CME catalog and extract geoeffective events."""
    if not os.path.exists(DONKI_CME_FILE):
        logger.warning("DONKI CME file missing — skipping Strategy C.")
        return pd.DataFrame()
    with open(DONKI_CME_FILE) as f:
        data = json.load(f)
    if not data:
        return pd.DataFrame()

    rows = []
    for item in data:
        try:
            time = pd.to_datetime(item.get("startTime", ""), utc=True)
            analyses = item.get("cmeAnalyses", []) or []
            speed, width = np.nan, np.nan
            is_halo = False
            for a in analyses:
                if a.get("isMostAccurate"):
                    speed = float(a.get("speed", np.nan) or np.nan)
                    width = float(a.get("halfAngle", np.nan) or np.nan) * 2
                    is_halo = bool(a.get("type", "") == "S")
                    break
            if pd.isna(speed):
                continue
            rows.append({
                "timestamp": time,
                "cme_speed_km_s": speed,
                "cme_width_deg": width if not pd.isna(width) else 60.0,
                "cme_cpa_deg": 180.0,   # DONKI doesn't always provide CPA
                "is_halo": is_halo,
                "source": "DONKI",
            })
        except Exception:
            continue

    df = pd.DataFrame(rows).dropna(subset=["timestamp"])
    logger.info(f"DONKI: {len(df):,} CME records parsed.")
    return df


# ─── CME Catalog Loader ───────────────────────────────────────────────────────

def load_cme_catalog() -> pd.DataFrame:
    df = pd.read_csv(CME_CATALOG_FILE, parse_dates=["timestamp"])
    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
    df["source"] = "LASCO_CDAW"
    df["cme_cpa_deg"] = df["cme_cpa_deg"].fillna(180.0)
    logger.info(f"CME Catalog: {len(df):,} events loaded.")
    return df


# ─── Feature Engineering (Strategy D) ───────────────────────────────────────

def compute_physics_features(
    cme_speed: float,
    cme_width: float,
    cme_time: pd.Timestamp,
    omni_df: pd.DataFrame,
    silso_df: pd.DataFrame,
) -> dict:
    """
    Derive 5 physics-informed features beyond the raw CME measurements.

    1. cme_kinetic_energy_proxy — speed² × sin(width/2), proxy for mass × speed²
    2. sw_background_speed      — mean solar wind speed in 6h before CME launch
    3. solar_cycle_phase        — normalised sunspot number [0–1] at launch month
    4. dst_precondition         — mean Dst 12h before CME (magnetosphere state)
    5. drag_factor              — Δspeed from background wind (determines deceleration)
    """
    # Feature 1: Kinetic energy proxy
    half_angle_rad = np.radians(min(cme_width, 360) / 2.0)
    kinetic_energy_proxy = (cme_speed ** 2) * np.sin(half_angle_rad)

    # Features 2, 4, 5: background solar wind and Dst before launch
    pre_window = omni_df.loc[
        cme_time - timedelta(hours=12) : cme_time - timedelta(hours=1)
    ]
    sw_bg_speed = float(pre_window["sw_speed"].mean()) if not pre_window.empty else 400.0
    dst_precondition = float(pre_window["dst_index"].mean()) if not pre_window.empty else 0.0
    # Drag: if CME faster than solar wind → decelerates; if slower → accelerates
    drag_factor = cme_speed - (sw_bg_speed if not np.isnan(sw_bg_speed) else 400.0)

    # Feature 3: Solar cycle phase
    sunspot = get_sunspot_at(silso_df, cme_time)
    solar_cycle_phase = min(sunspot / 200.0, 1.0)  # Normalise to [0,1], max ~200

    return {
        "kinetic_energy_proxy": round(kinetic_energy_proxy, 2),
        "sw_background_speed": round(sw_bg_speed, 1),
        "solar_cycle_phase": round(solar_cycle_phase, 4),
        "dst_precondition": round(dst_precondition, 1),
        "drag_factor": round(drag_factor, 1),
    }


# ─── Main Merge Logic ─────────────────────────────────────────────────────────

def build_training_dataset(
    omni_df: pd.DataFrame,
    cme_catalog: pd.DataFrame,
    donki_df: pd.DataFrame,
    silso_df: pd.DataFrame,
) -> pd.DataFrame:

    # ── Merge CME sources (Strategy C) ────────────────────────────────────────
    all_cmes = pd.concat([cme_catalog, donki_df], ignore_index=True)
    all_cmes = all_cmes.drop_duplicates(subset=["timestamp", "cme_speed_km_s"])
    all_cmes = all_cmes.sort_values("timestamp").reset_index(drop=True)
    logger.info(f"Combined CME catalog: {len(all_cmes):,} events total after dedup.")

    # ── Strategy A: Relaxed filter ────────────────────────────────────────────
    filtered = all_cmes[
        (all_cmes["is_halo"] == True)
        | (all_cmes["cme_speed_km_s"] >= CME_SPEED_MIN_KMS)
    ].copy()
    logger.info(f"Strategy A filter (speed ≥ {CME_SPEED_MIN_KMS} or halo): {len(filtered):,} CMEs kept.")

    training_rows = []
    skipped_no_data = 0
    kept_geoeffective = 0
    kept_near_miss = 0

    for _, cme in filtered.iterrows():
        cme_time = cme["timestamp"]

        # Widen transit window
        window_start = cme_time + timedelta(days=TRANSIT_WINDOW_DAYS[0])
        window_end   = cme_time + timedelta(days=TRANSIT_WINDOW_DAYS[1])

        future_omni = omni_df.loc[window_start:window_end]

        if future_omni.empty or future_omni["dst_index"].isna().all():
            skipped_no_data += 1
            continue

        # ── Strategy D: Physics features ──────────────────────────────────────
        phys = compute_physics_features(
            cme_speed=float(cme["cme_speed_km_s"]),
            cme_width=float(cme["cme_width_deg"]),
            cme_time=cme_time,
            omni_df=omni_df,
            silso_df=silso_df,
        )

        min_dst = future_omni["dst_index"].min()

        # ── Strategy B: Near-misses as geoeffective=0 ─────────────────────────
        if min_dst > DST_GEOEFFECTIVE_LIMIT:
            # Near-miss / Earth-directed but no storm → still a valid sample
            training_rows.append({
                "cme_time": cme_time,
                "cme_speed_km_s": cme["cme_speed_km_s"],
                "cme_width_deg": cme["cme_width_deg"],
                "cme_cpa_deg": cme["cme_cpa_deg"],
                "is_halo": int(bool(cme["is_halo"])),
                # Physics features
                **phys,
                # Targets
                "geoeffective": 0,
                "transit_time_hours": np.nan,   # No meaningful arrival for a miss
                "target_dst": float(min_dst),
                "target_kp": float(future_omni["kp_index"].max()),
                "source": cme.get("source", "unknown"),
            })
            kept_near_miss += 1
            continue

        # Confirmed geoeffective hit
        arrival_time = future_omni["dst_index"].idxmin()
        transit_time_hours = (arrival_time - cme_time).total_seconds() / 3600.0
        max_kp = future_omni["kp_index"].max()

        training_rows.append({
            "cme_time": cme_time,
            "cme_speed_km_s": cme["cme_speed_km_s"],
            "cme_width_deg": cme["cme_width_deg"],
            "cme_cpa_deg": cme["cme_cpa_deg"],
            "is_halo": int(bool(cme["is_halo"])),
            # Physics features
            **phys,
            # Targets
            "geoeffective": 1,
            "transit_time_hours": transit_time_hours,
            "target_dst": float(min_dst),
            "target_kp": float(max_kp),
            "source": cme.get("source", "unknown"),
        })
        kept_geoeffective += 1

    logger.info(f"Results:")
    logger.info(f"  Geoeffective hits (label=1): {kept_geoeffective:,}")
    logger.info(f"  Near-misses     (label=0): {kept_near_miss:,}")
    logger.info(f"  Skipped (no OMNI data):    {skipped_no_data:,}")
    logger.info(f"  Total training rows:       {kept_geoeffective + kept_near_miss:,}")

    return pd.DataFrame(training_rows)


# ─── Entry Point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("Helios Intelligence — Enhanced Dataset Builder")
    logger.info("=" * 60)

    # Step 1: Download everything
    download_all()

    # Step 2: Parse OMNI (always required)
    if not os.path.exists(OMNI_LOCAL_FILE):
        logger.error("OMNI data missing and download failed. Cannot proceed.")
        exit(1)
    omni_df = parse_omni()

    # Step 3: Load CME catalog
    if not os.path.exists(CME_CATALOG_FILE):
        logger.error(f"CME catalog not found: {CME_CATALOG_FILE}")
        exit(1)
    cme_df = load_cme_catalog()

    # Step 4: Load DONKI (Strategy C — graceful if unavailable)
    donki_df = load_donki_cmes()

    # Step 5: Load SILSO sunspot (Strategy D — graceful if unavailable)
    silso_df = parse_silso()

    # Step 6: Build the enriched training dataset
    train_df = build_training_dataset(omni_df, cme_df, donki_df, silso_df)

    if train_df.empty:
        logger.error("No training data generated — check OMNI coverage.")
        exit(1)

    # Step 7: Save
    os.makedirs("ml/data", exist_ok=True)
    train_df.to_csv(OUTPUT_DATASET, index=False)
    logger.success(f"Dataset saved: {OUTPUT_DATASET}  ({len(train_df):,} rows, {len(train_df.columns)} features)")
    logger.info(f"Feature columns: {list(train_df.columns)}")
    logger.info("")
    logger.info("Next step: python ml/train_prediction_models.py")
