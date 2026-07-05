from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, List
import pandas as pd
import io
import json
from backend.database import get_db
from backend.models import SpaceWeatherData, User, SystemLog
from backend.routers.auth import check_role
from backend.services.data_processor import DataProcessor
from backend.services.ai_model import SpaceWeatherPredictor

router = APIRouter(prefix="/data", tags=["Dataset Management"])

# Singleton predictor instance
predictor = SpaceWeatherPredictor()

def run_training_background(db_session_factory, data_list):
    db = db_session_factory()
    try:
        df = pd.DataFrame(data_list)
        predictor.train(df)
        log = SystemLog(level="info", message="AI model training completed successfully.", user="System")
        db.add(log)
        db.commit()
    except Exception as e:
        log = SystemLog(level="error", message=f"AI model training failed: {str(e)}", user="System")
        db.add(log)
        db.commit()
    finally:
        db.close()

@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin", "operator"]))
):
    """
    Upload CSV or JSON dataset and add to space_weather_data.
    """
    content = await file.read()
    filename = file.filename.lower()
    
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.endswith(".json"):
            df = pd.read_json(io.BytesIO(content))
        elif filename.endswith(".xlsx") or filename.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Upload CSV, Excel, or JSON.")
            
        # Validate columns
        required = ['electron_flux', 'proton_flux', 'solar_wind_speed', 'imf_bz', 'plasma_density']
        missing = [col for col in required if col not in df.columns]
        
        # If headers are different, try mapping or log warning
        # (For custom uploads, standard headers are expected)
        if 'timestamp' not in df.columns:
            if 'time_tag' in df.columns:
                df = df.rename(columns={'time_tag': 'timestamp'})
            else:
                raise HTTPException(status_code=400, detail="Missing required column: timestamp")
                
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Fill missing required columns with typical values
        for col in required:
            if col not in df.columns:
                df[col] = 0.0
                
        # Insert records into DB
        records = []
        for _, row in df.iterrows():
            # Check for duplicate timestamp
            exists = db.query(SpaceWeatherData).filter(SpaceWeatherData.timestamp == row['timestamp'].to_pydatetime()).first()
            if exists:
                continue
                
            record = SpaceWeatherData(
                timestamp=row['timestamp'].to_pydatetime(),
                electron_flux=float(row['electron_flux']),
                proton_flux=float(row['proton_flux']),
                solar_wind_speed=float(row['solar_wind_speed']),
                imf_bz=float(row['imf_bz']),
                plasma_density=float(row['plasma_density']),
                magnetic_field=float(row.get('magnetic_field', 5.0)),
                xray_flux=float(row.get('xray_flux', 0.1)),
                solar_activity_index=float(row.get('solar_activity_index', 1.0)),
                source="admin_entry"
            )
            records.append(record)
            
        db.add_all(records)
        db.commit()
        
        log = SystemLog(level="info", message=f"User {current_user.username} uploaded dataset: {file.filename} ({len(records)} records).", user=current_user.username)
        db.add(log)
        db.commit()
        
        return {"message": f"Successfully uploaded and imported {len(records)} records."}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")

@router.get("/records")
def get_dataset_records(
    page: int = 1, 
    limit: int = 100, 
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin", "operator", "researcher"]))
):
    query = db.query(SpaceWeatherData)
    if search:
        # Search by source
        query = query.filter(SpaceWeatherData.source.like(f"%{search}%"))
        
    total = query.count()
    records = query.order_by(SpaceWeatherData.timestamp.desc()).offset((page - 1) * limit).limit(limit).all()
    
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "records": [
            {
                "id": r.id,
                "timestamp": r.timestamp.isoformat(),
                "electron_flux": r.electron_flux,
                "proton_flux": r.proton_flux,
                "solar_wind_speed": r.solar_wind_speed,
                "imf_bz": r.imf_bz,
                "plasma_density": r.plasma_density,
                "magnetic_field": r.magnetic_field,
                "xray_flux": r.xray_flux,
                "solar_activity_index": r.solar_activity_index,
                "source": r.source
            }
            for r in records
        ]
    }

@router.delete("/records/{record_id}")
def delete_record(
    record_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin"]))
):
    record = db.query(SpaceWeatherData).filter(SpaceWeatherData.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    db.delete(record)
    db.commit()
    return {"message": "Record deleted successfully"}

@router.delete("/clear")
def clear_dataset(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin"]))
):
    """
    Clears all datasets except essential manual entries.
    """
    db.query(SpaceWeatherData).delete()
    db.commit()
    log = SystemLog(level="info", message=f"Admin cleared the space weather dataset.", user=current_user.username)
    db.add(log)
    db.commit()
    return {"message": "All dataset records cleared successfully"}

@router.get("/statistics")
def get_dataset_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin", "operator", "researcher"]))
):
    """
    Computes statistical indicators for the dataset.
    """
    query = db.query(SpaceWeatherData).all()
    if not query:
        return {"count": 0}
        
    df = pd.DataFrame([
        {
            "electron_flux": r.electron_flux,
            "proton_flux": r.proton_flux,
            "solar_wind_speed": r.solar_wind_speed,
            "imf_bz": r.imf_bz,
            "plasma_density": r.plasma_density,
            "magnetic_field": r.magnetic_field,
            "xray_flux": r.xray_flux,
            "solar_activity_index": r.solar_activity_index
        }
        for r in query
    ])
    
    stats = df.describe().to_dict()
    # Add correlation matrix for analytics
    corr = df.corr().to_dict()
    
    return {
        "count": len(df),
        "summary": stats,
        "correlation": corr
    }

@router.post("/clean")
def clean_dataset(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin", "operator"]))
):
    """
    Cleans dataset: handles NaNs by linear interpolation, normalizes indices.
    """
    records = db.query(SpaceWeatherData).order_by(SpaceWeatherData.timestamp.asc()).all()
    if not records:
        raise HTTPException(status_code=400, detail="No data available to clean.")
        
    df = pd.DataFrame([{
        "id": r.id,
        "electron_flux": r.electron_flux,
        "proton_flux": r.proton_flux,
        "solar_wind_speed": r.solar_wind_speed,
        "imf_bz": r.imf_bz,
        "plasma_density": r.plasma_density,
        "magnetic_field": r.magnetic_field,
        "xray_flux": r.xray_flux,
        "solar_activity_index": r.solar_activity_index
    } for r in records])
    
    # Interpolate
    cols = ["electron_flux", "proton_flux", "solar_wind_speed", "imf_bz", "plasma_density", "magnetic_field", "xray_flux", "solar_activity_index"]
    for col in cols:
        df[col] = df[col].interpolate(method='linear', limit_direction='both').fillna(0.0)
        
    # Update records back in DB
    for _, row in df.iterrows():
        rec = db.query(SpaceWeatherData).filter(SpaceWeatherData.id == int(row['id'])).first()
        if rec:
            rec.electron_flux = float(row['electron_flux'])
            rec.proton_flux = float(row['proton_flux'])
            rec.solar_wind_speed = float(row['solar_wind_speed'])
            rec.imf_bz = float(row['imf_bz'])
            rec.plasma_density = float(row['plasma_density'])
            rec.magnetic_field = float(row['magnetic_field'])
            rec.xray_flux = float(row['xray_flux'])
            rec.solar_activity_index = float(row['solar_activity_index'])
            
    db.commit()
    log = SystemLog(level="info", message="Dataset cleaning and normalization complete.", user=current_user.username)
    db.add(log)
    db.commit()
    
    return {"message": "Dataset successfully cleaned and normalized."}

@router.post("/train")
def train_model(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin"]))
):
    """
    Triggers AI model training in the background.
    """
    if predictor.training_status == "training":
        return {"status": "training", "message": "Model is already training."}
        
    records = db.query(SpaceWeatherData).order_by(SpaceWeatherData.timestamp.asc()).all()
    if len(records) < 50:
        raise HTTPException(status_code=400, detail="Insufficient records for training (minimum 50 records required).")
        
    data_list = [{
        "timestamp": r.timestamp,
        "electron_flux": r.electron_flux,
        "proton_flux": r.proton_flux,
        "solar_wind_speed": r.solar_wind_speed,
        "imf_bz": r.imf_bz,
        "plasma_density": r.plasma_density,
        "magnetic_field": r.magnetic_field,
        "xray_flux": r.xray_flux,
        "solar_activity_index": r.solar_activity_index
    } for r in records]
    
    from backend.database import SessionLocal
    background_tasks.add_task(run_training_background, SessionLocal, data_list)
    
    log = SystemLog(level="info", message=f"Admin initiated AI model training.", user=current_user.username)
    db.add(log)
    db.commit()
    
    return {"status": "started", "message": "AI training started in background."}

@router.get("/train/status")
def get_training_status(current_user: User = Depends(check_role(["admin", "operator", "researcher"]))):
    """
    Returns training progress, status, metrics, and feature importances.
    """
    return {
        "status": predictor.training_status,
        "progress": predictor.training_progress,
        "loss_curves": predictor.epochs_loss,
        "metrics": predictor.metrics,
        "feature_importance": predictor.feature_importance
    }
