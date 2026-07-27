import os
import sys
import pandas as pd
from datetime import datetime, timezone
from loguru import logger

# Add root to python path so we can import backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.core.database import SessionLocal, init_db
from backend.core.models import Event

def seed():
    # Make sure tables exist
    init_db()

    csv_path = "historical_cme_catalog.csv"
    if not os.path.exists(csv_path):
        logger.warning(f"Seed file {csv_path} not found. Skipping seeding.")
        return

    db = SessionLocal()
    try:
        # Check if events already exist
        existing_count = db.query(Event).count()
        if existing_count > 0:
            logger.info(f"Database already contains {existing_count} events. Skipping seeding.")
            return

        logger.info(f"Seeding database from {csv_path}...")
        df = pd.read_csv(csv_path)

        events_to_add = []
        # 'timestamp', 'cme_cpa_deg', 'cme_width_deg', 'cme_speed_km_s', 'is_halo'
        for _, row in df.iterrows():
            try:
                # Assuming timestamp is parseable ISO string
                ts = pd.to_datetime(row['timestamp']).to_pydatetime()
                if ts.tzinfo is None:
                    ts = ts.replace(tzinfo=timezone.utc)
            except Exception:
                continue

            metadata = {
                "cme_cpa_deg": float(row['cme_cpa_deg']) if pd.notna(row['cme_cpa_deg']) else None,
                "cme_width_deg": float(row['cme_width_deg']) if pd.notna(row['cme_width_deg']) else None,
                "cme_speed_km_s": float(row['cme_speed_km_s']) if pd.notna(row['cme_speed_km_s']) else None,
                "is_halo": bool(row['is_halo']) if pd.notna(row['is_halo']) else False
            }

            event = Event(
                event_type="CME",
                detection_source="DONKI_HISTORICAL",
                start_time=ts,
                status="verified",  # historical catalog is verified
                metadata_json=metadata
            )
            events_to_add.append(event)
            
            if len(events_to_add) >= 1000:
                db.bulk_save_objects(events_to_add)
                events_to_add = []
                
        if events_to_add:
            db.bulk_save_objects(events_to_add)
            
        db.commit()
        logger.info("Successfully seeded historical CME catalog.")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    logger.info("Starting database seeding process...")
    seed()
