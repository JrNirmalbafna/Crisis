"""OMNI Dataset Fetcher & Training Data Generator

This script downloads the NASA OMNI2 hourly dataset (which contains solar wind 
and geomagnetic indices like Kp and Dst at Earth) and merges it with our 
historical CME catalog to create a supervised Machine Learning training dataset.

For each CME (the "cause"), we look 1 to 5 days into the future in the OMNI 
dataset to find the resulting geomagnetic storm (the "effect"). We extract the 
maximum solar wind speed and minimum Dst index to serve as our target variables (Y)
for the XGBoost model.

Data Source: NASA SPDF OMNI2 (Hourly)
"""

import os
import urllib.request
import pandas as pd
import numpy as np
from loguru import logger
from datetime import timedelta

# OMNI2 Hourly ASCII dataset (1963 - Present)
OMNI_HOURLY_URL = "https://spdf.gsfc.nasa.gov/pub/data/omni/low_res_omni/omni2_all_years.dat"
OMNI_LOCAL_FILE = "ml/data/omni2_hourly.dat"

CME_CATALOG_FILE = "historical_cme_catalog.csv"
OUTPUT_DATASET = "ml/data/training_dataset.csv"

def download_omni_data():
    """Download the OMNI2 hourly dataset if it doesn't exist locally."""
    if os.path.exists(OMNI_LOCAL_FILE):
        logger.info(f"OMNI dataset already exists at {OMNI_LOCAL_FILE}. Skipping download.")
        return

    logger.info(f"Downloading OMNI2 hourly dataset from {OMNI_HOURLY_URL} ... (This may take a minute, ~150MB)")
    req = urllib.request.Request(OMNI_HOURLY_URL, headers={'User-Agent': 'Mozilla/5.0'})
    
    with urllib.request.urlopen(req, timeout=60) as response, open(OMNI_LOCAL_FILE, 'wb') as out_file:
        out_file.write(response.read())
        
    logger.info(f"Download complete: {OMNI_LOCAL_FILE}")

def parse_omni_data() -> pd.DataFrame:
    """Parse the OMNI2 fixed-width ASCII file into a Pandas DataFrame."""
    logger.info("Parsing OMNI2 hourly data into memory...")
    
    # OMNI2 format specifies 55 columns. We care about:
    # Year(0), Day(1), Hour(2), Speed(24), Dst(40), Kp(38)
    # Missing data is filled with 999 or 9999.
    
    # Fast load using pandas read_csv with whitespace delimiter
    # Note: For production robustness, specific column widths should be used, 
    # but whitespace works well enough for OMNI2 extraction.
    cols = list(range(55))
    df = pd.read_csv(
        OMNI_LOCAL_FILE, 
        delim_whitespace=True, 
        header=None, 
        names=[str(i) for i in cols],
        usecols=['0', '1', '2', '24', '38', '40'],  # Only load columns we need to save memory
        engine='c'
    )
    
    # Rename columns based on OMNI format spec
    df = df.rename(columns={
        '0': 'year', 
        '1': 'day', 
        '2': 'hour', 
        '24': 'sw_speed', 
        '38': 'kp_index', 
        '40': 'dst_index'
    })
    
    # Convert Year, Day of Year, Hour into a proper UTC datetime
    # pd.to_datetime can parse format "%Y %j %H" (Year, Day-of-year, Hour)
    date_strings = df['year'].astype(str) + ' ' + df['day'].astype(str) + ' ' + df['hour'].astype(str)
    df['timestamp'] = pd.to_datetime(date_strings, format='%Y %j %H', utc=True)
    
    # Clean missing values (OMNI uses 9999 or 999 for missing data)
    df['sw_speed'] = df['sw_speed'].replace([9999, 9999.0], np.nan)
    df['dst_index'] = df['dst_index'].replace([99999, 99999.0], np.nan)
    # Kp in OMNI is multiplied by 10 (e.g. Kp 5.3 is 53). Missing is 99.
    df['kp_index'] = df['kp_index'].replace([99, 99.0], np.nan) / 10.0
    
    # Drop rows without timestamps and sort
    df = df.dropna(subset=['timestamp']).sort_values('timestamp').reset_index(drop=True)
    df = df.set_index('timestamp')
    
    logger.info(f"Successfully loaded {len(df)} hours of OMNI data.")
    return df

def generate_training_dataset(omni_df: pd.DataFrame, cme_df: pd.DataFrame) -> pd.DataFrame:
    """Merge CME catalog with future OMNI data to create training targets."""
    logger.info("Merging CME catalog with OMNI data to generate training targets...")
    
    training_rows = []
    
    # Only keep Halo or fast CMEs for robust training signals
    # Background slow CMEs often fade into the ambient solar wind
    major_cmes = cme_df[(cme_df['is_halo'] == True) | (cme_df['cme_speed_km_s'] > 800)].copy()
    logger.info(f"Filtering down to {len(major_cmes)} major CMEs for high-signal training.")
    
    for idx, cme in major_cmes.iterrows():
        cme_time = cme['timestamp']
        
        # Look 1 to 5 days into the future for the impact at Earth
        window_start = cme_time + timedelta(days=1)
        window_end = cme_time + timedelta(days=5)
        
        # Extract the OMNI data for this future window
        future_omni = omni_df.loc[window_start:window_end]
        
        if future_omni.empty or future_omni['dst_index'].isna().all():
            continue
            
        # Find the minimum Dst index (geomagnetic storm severity)
        min_dst = future_omni['dst_index'].min()
        
        # If there was no actual storm (Dst > -30), it likely missed Earth.
        # We skip these "misses" to train a clean "Transit Time" model, 
        # though predicting misses is important for a full system.
        if min_dst > -30:
            continue
            
        # The arrival time is estimated as the time of the minimum Dst peak
        arrival_time = future_omni['dst_index'].idxmin()
        transit_time_hours = (arrival_time - cme_time).total_seconds() / 3600.0
        
        # Maximum Kp index in that window
        max_kp = future_omni['kp_index'].max()
        
        training_rows.append({
            'cme_time': cme_time,
            'cme_speed_km_s': cme['cme_speed_km_s'],
            'cme_width_deg': cme['cme_width_deg'],
            'cme_cpa_deg': cme['cme_cpa_deg'] if not pd.isna(cme['cme_cpa_deg']) else 180.0,
            'is_halo': 1 if cme['is_halo'] else 0,
            
            # Target Variables (Y)
            'arrival_time': arrival_time,
            'transit_time_hours': transit_time_hours,
            'target_dst': min_dst,
            'target_kp': max_kp
        })
        
    final_df = pd.DataFrame(training_rows)
    logger.info(f"Generated {len(final_df)} highly-correlated training examples.")
    return final_df

if __name__ == "__main__":
    try:
        # 1. Download
        download_omni_data()
        
        # 2. Parse
        omni_df = parse_omni_data()
        
        # 3. Load CME catalog
        if not os.path.exists(CME_CATALOG_FILE):
            logger.error(f"Missing {CME_CATALOG_FILE}. Run scripts/fetch_historical_cme.py first.")
            exit(1)
            
        cme_df = pd.read_csv(CME_CATALOG_FILE, parse_dates=['timestamp'])
        
        # 4. Merge and Generate
        train_df = generate_training_dataset(omni_df, cme_df)
        
        # 5. Save
        train_df.to_csv(OUTPUT_DATASET, index=False)
        logger.info(f"Machine Learning Dataset successfully saved to {OUTPUT_DATASET}")
        
    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
