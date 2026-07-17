"""Historical CME Catalog Downloader

This script downloads and parses the complete 25+ year SOHO LASCO CME Catalog
from the NASA CDAW archive. It contains over 30,000 CME records since 1996.

This dataset is ideal for training Machine Learning models to predict CME
arrival times and geomagnetic storm intensity.

Data source: https://cdaw.gsfc.nasa.gov/CME_list/
"""

import urllib.request
import pandas as pd
import io
import re
from loguru import logger

# The universal text version of the CDAW catalog
CDAW_URL = "https://cdaw.gsfc.nasa.gov/CME_list/UNIVERSAL/text_ver/univ_all.txt"

def download_and_parse_cme_catalog() -> pd.DataFrame:
    logger.info(f"Downloading historical CME catalog from {CDAW_URL} ...")
    
    # Use a standard User-Agent to avoid being blocked by NASA servers
    req = urllib.request.Request(CDAW_URL, headers={'User-Agent': 'Mozilla/5.0'})
    
    with urllib.request.urlopen(req, timeout=30) as response:
        raw_text = response.read().decode('utf-8')
    
    logger.info(f"Downloaded {len(raw_text)} bytes. Parsing lines...")
    
    parsed_rows = []
    
    # Parse the fixed-width text file line by line
    for line in raw_text.splitlines():
        line = line.strip()
        
        # The actual data rows start with a year (199x or 20xx)
        if not (line.startswith("199") or line.startswith("20")):
            continue
            
        # Example line:
        # 1996/01/11 00:14   270    21    116      110     **      ----   ----       270   2.66     ----     ----
        # Split by whitespace, being careful of empty fields marked as "----" or "**"
        parts = re.split(r'\s+', line)
        if len(parts) < 5:
            continue
            
        try:
            date_str = parts[0]
            time_str = parts[1]
            cpa = parts[2]       # Central Position Angle (deg)
            width = parts[3]     # Angular width (deg)
            speed = parts[4]     # Linear speed (km/s)
            
            # Clean up missing value markers
            cpa = None if "Halo" in cpa or "----" in cpa else float(cpa)
            
            # Width can be marked with > (e.g. >200) or 'Halo'
            is_halo = False
            if "Halo" in width or cpa is None:
                width_val = 360.0
                is_halo = True
            elif ">" in width:
                width_val = float(width.replace(">", ""))
            else:
                width_val = float(width)
                
            speed = None if "----" in speed else float(speed)
            
            # Create UTC timestamp
            timestamp = pd.to_datetime(f"{date_str} {time_str}", utc=True)
            
            parsed_rows.append({
                "timestamp": timestamp,
                "cme_cpa_deg": cpa,
                "cme_width_deg": width_val,
                "cme_speed_km_s": speed,
                "is_halo": is_halo
            })
            
        except Exception as e:
            # Skip malformed lines (catalog has some manual entry typos)
            continue
            
    df = pd.DataFrame(parsed_rows)
    df = df.sort_values("timestamp").reset_index(drop=True)
    return df


if __name__ == "__main__":
    logger.info("Starting Historical CME Dataset Extraction")
    
    try:
        df = download_and_parse_cme_catalog()
        
        logger.info(f"Successfully parsed {len(df)} historical CME records.")
        logger.info(f"Date range: {df['timestamp'].min().strftime('%Y-%m-%d')} to {df['timestamp'].max().strftime('%Y-%m-%d')}")
        
        # Display some statistics
        logger.info("\nDataset Summary:")
        logger.info(f"Total CMEs:        {len(df)}")
        logger.info(f"Halo CMEs:         {df['is_halo'].sum()} (Highly Earth-directed)")
        logger.info(f"Fast CMEs (>1000): {len(df[df['cme_speed_km_s'] > 1000])}")
        logger.info(f"Median Speed:      {df['cme_speed_km_s'].median():.0f} km/s")
        
        # Save to CSV
        output_file = "historical_cme_catalog.csv"
        df.to_csv(output_file, index=False)
        logger.info(f"\nDataset saved to: {output_file}")
        
    except Exception as e:
        logger.error(f"Failed to process catalog: {e}")
