from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
import sys
import io
import datetime

# Force UTF-8 output on Windows to avoid encoding errors
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from backend.database import engine, Base, SessionLocal
from backend.models import User, Threshold, SpaceWeatherData
from backend.routers import auth, data, predict, dashboard, analytics, alerts, settings
from backend.routers.auth import get_password_hash
from backend.services.data_processor import DataProcessor
from backend.config import settings as app_settings

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=app_settings.PROJECT_NAME, version="1.0.0")

# CORS Configuration - allow all origins for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=app_settings.API_V1_STR)
app.include_router(data.router, prefix=app_settings.API_V1_STR)
app.include_router(predict.router, prefix=app_settings.API_V1_STR)
app.include_router(dashboard.router, prefix=app_settings.API_V1_STR)
app.include_router(analytics.router, prefix=app_settings.API_V1_STR)
app.include_router(alerts.router, prefix=app_settings.API_V1_STR)
app.include_router(settings.router, prefix=app_settings.API_V1_STR)

@app.on_event("startup")
def startup_populate():
    db = SessionLocal()
    try:
        # 1. Prepopulate default users if table is empty
        if db.query(User).count() == 0:
            default_users = [
                User(username="admin", password_hash=get_password_hash("astracast2026"), role="admin"),
                User(username="operator", password_hash=get_password_hash("astracast2026"), role="operator"),
                User(username="researcher", password_hash=get_password_hash("astracast2026"), role="researcher")
            ]
            db.add_all(default_users)
            db.commit()
            print("[AstraCast] Default users created: admin / operator / researcher (password: astracast2026)")

        # 2. Prepopulate default thresholds if empty
        if db.query(Threshold).count() == 0:
            for name, vals in app_settings.DEFAULT_THRESHOLDS.items():
                t = Threshold(
                    parameter_name=name,
                    low=vals["low"],
                    medium=vals["medium"],
                    high=vals["high"],
                    critical=vals["critical"]
                )
                db.add(t)
            db.commit()
            print("[AstraCast] Default thresholds populated.")

        # 3. Auto-ingest CSV datasets if table is empty
        if db.query(SpaceWeatherData).count() == 0:
            print("[AstraCast] Dataset empty. Auto-ingesting CSV data files from workspace root...")
            
            # Look for CSVs in the parent directory (workspace root)
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            electron_csv = os.path.join(base_dir, "goeselectronflux.csv")
            imf_csv = os.path.join(base_dir, "imfblaze.csv")
            wind_csv = os.path.join(base_dir, "solarwind.csv")
            
            if os.path.exists(electron_csv) and os.path.exists(imf_csv) and os.path.exists(wind_csv):
                dp = DataProcessor(db)
                print("[AstraCast] Merging and cleaning 3 CSV datasets...")
                merged_df = dp.load_and_merge_datasets(electron_csv, imf_csv, wind_csv)
                count = dp.import_to_db(merged_df)
                print(f"[AstraCast] SUCCESS: Auto-ingested {count} historical space weather records.")
            else:
                print(f"[AstraCast] Warning: CSV files not found at {base_dir}. Skipping auto-ingestion.")
                
    except Exception as e:
        print(f"[AstraCast] Error during startup initialization: {str(e)}")
    finally:
        db.close()

@app.get("/")
def read_root():
    return {
        "platform": "AstraCast AI Space Weather Prediction System",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs"
    }
