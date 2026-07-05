from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
import datetime
import pandas as pd
from typing import Optional, List
from backend.database import get_db
from backend.models import SpaceWeatherData, Prediction, User, SystemLog, Alert, Threshold

from backend.routers.auth import check_role
from backend.routers.data import predictor

router = APIRouter(prefix="/predict", tags=["AI Forecasting"])

class ObservationInput(BaseModel):
    electron_flux: float = Field(..., description="PFU")
    proton_flux: float = Field(..., description="PFU")
    solar_wind_speed: float = Field(..., description="km/s")
    imf_bz: float = Field(..., description="nT")
    plasma_density: float = Field(..., alias="density", description="n/cc")
    magnetic_field: float = Field(..., description="nT")
    xray_flux: float = Field(..., description="Watts/m2")
    solar_activity_index: float = Field(..., description="Index")
    timestamp: Optional[str] = None
    prediction_horizon: Optional[str] = "24h" # 30m, 6h, 12h, 24h, 3d, 7d

class SimulatorInput(BaseModel):
    electron_flux: float
    solar_wind_speed: float
    imf_bz: float
    plasma_density: float
    proton_flux: float

@router.post("/run")
def run_prediction_endpoint(
    data: ObservationInput, 
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin", "operator"]))
):
    """
    Operator enters latest data manually -> Predicts space weather events for all horizons.
    Stores records and checks for alerts based on thresholds.
    """
    ts = datetime.datetime.utcnow()
    if data.timestamp:
        try:
            ts = datetime.datetime.fromisoformat(data.timestamp)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid timestamp format. Use ISO-8601.")

    # 1. Store the manual entry in space weather history
    new_entry = SpaceWeatherData(
        timestamp=ts,
        electron_flux=data.electron_flux,
        proton_flux=data.proton_flux,
        solar_wind_speed=data.solar_wind_speed,
        imf_bz=data.imf_bz,
        plasma_density=data.plasma_density,
        magnetic_field=data.magnetic_field,
        xray_flux=data.xray_flux,
        solar_activity_index=data.solar_activity_index,
        source="admin_entry"
    )
    db.add(new_entry)
    
    # 2. Get last 15 steps of history for the sliding window
    history = db.query(SpaceWeatherData).order_by(SpaceWeatherData.timestamp.desc()).limit(15).all()
    history_list = []
    for r in reversed(history):
        history_list.append({
            "timestamp": r.timestamp,
            "electron_flux": r.electron_flux,
            "proton_flux": r.proton_flux,
            "solar_wind_speed": r.solar_wind_speed,
            "imf_bz": r.imf_bz,
            "plasma_density": r.plasma_density,
            "magnetic_field": r.magnetic_field,
            "xray_flux": r.xray_flux,
            "solar_activity_index": r.solar_activity_index
        })
    history_df = pd.DataFrame(history_list) if history_list else pd.DataFrame(columns=['timestamp', 'electron_flux', 'proton_flux', 'solar_wind_speed', 'imf_bz', 'plasma_density', 'magnetic_field', 'xray_flux', 'solar_activity_index'])

    # 3. Trigger predictor
    current_dict = {
        "timestamp": ts,
        "electron_flux": data.electron_flux,
        "proton_flux": data.proton_flux,
        "solar_wind_speed": data.solar_wind_speed,
        "imf_bz": data.imf_bz,
        "plasma_density": data.plasma_density,
        "magnetic_field": data.magnetic_field,
        "xray_flux": data.xray_flux,
        "solar_activity_index": data.solar_activity_index
    }
    
    try:
        predictions = predictor.predict_future(current_dict, history_df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

    # 4. Save predictions in DB and check for Threshold alerts
    saved_preds = []
    thresholds = {t.parameter_name: t for t in db.query(Threshold).all()}
    
    for h, p in predictions.items():
        db_pred = Prediction(
            timestamp=ts,
            prediction_horizon=h,
            storm_probability=p["storm_probability"],
            expected_electron_flux=p["expected_electron_flux"],
            expected_solar_wind_speed=p["expected_solar_wind_speed"],
            expected_imf_bz=p["expected_imf_bz"],
            expected_radiation_category=p["expected_radiation_category"],
            expected_peak_time=datetime.datetime.fromisoformat(p["expected_peak_time"]),
            expected_duration=p["expected_duration"],
            confidence=p["confidence"],
            explanation=p["explanation"],
            recommended_action=p["recommended_action"]
        )
        db.add(db_pred)
        saved_preds.append(p)
        
        # Threshold warning logic (for critical horizons like 30m or 6h)
        if h in ["30m", "6h"] and p["storm_probability"] > 0.6:
            severity = "critical" if p["storm_probability"] > 0.85 else "high"
            alert_msg = f"Upcoming Radiation Storm forecast at {h} horizon. Expected {p['expected_radiation_category']} with {p['storm_probability']*100:.0f}% probability."
            
            # Check duplicates
            exists = db.query(Alert).filter(Alert.message == alert_msg, Alert.acknowledged == False).first()
            if not exists:
                alert = Alert(severity=severity, message=alert_msg, parameter="electron_flux", value=p["expected_electron_flux"])
                db.add(alert)

    db.commit()
    
    log = SystemLog(level="info", message=f"User {current_user.username} executed new space weather forecast.", user=current_user.username)
    db.add(log)
    db.commit()
    
    return {"message": "Forecast run completed.", "predictions": saved_preds}

@router.post("/simulate")
def simulate_scenario(data: SimulatorInput):
    """
    Scenario Simulator: returns instant calculations based on slider parameters.
    Does not save to DB.
    """
    # 1. Build observation input dictionary
    ts = datetime.datetime.utcnow()
    current_dict = {
        "timestamp": ts,
        "electron_flux": data.electron_flux,
        "proton_flux": data.proton_flux,
        "solar_wind_speed": data.solar_wind_speed,
        "imf_bz": data.imf_bz,
        "plasma_density": data.plasma_density,
        "magnetic_field": 5.0, # default constants for simulator
        "xray_flux": 0.1,
        "solar_activity_index": (data.solar_wind_speed / 400.0 + abs(data.imf_bz) / 5.0 + data.electron_flux / 500.0) / 3.0
    }
    
    # Use empty historical dataframe
    history_df = pd.DataFrame(columns=['timestamp', 'electron_flux', 'proton_flux', 'solar_wind_speed', 'imf_bz', 'plasma_density', 'magnetic_field', 'xray_flux', 'solar_activity_index'])
    
    try:
        predictions = predictor.predict_future(current_dict, history_df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")
        
    return {"predictions": list(predictions.values())}

@router.get("/history")
def get_prediction_history(
    limit: int = 50, 
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin", "operator", "researcher"]))
):
    """
    Retrieves history of generated predictions.
    """
    preds = db.query(Prediction).order_by(Prediction.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": p.id,
            "timestamp": p.timestamp.isoformat(),
            "prediction_horizon": p.prediction_horizon,
            "storm_probability": p.storm_probability,
            "expected_electron_flux": p.expected_electron_flux,
            "expected_solar_wind_speed": p.expected_solar_wind_speed,
            "expected_imf_bz": p.expected_imf_bz,
            "expected_radiation_category": p.expected_radiation_category,
            "expected_peak_time": p.expected_peak_time.isoformat() if p.expected_peak_time else None,
            "expected_duration": p.expected_duration,
            "confidence": p.confidence,
            "explanation": p.explanation,
            "recommended_action": p.recommended_action,
            "actual_electron_flux": p.actual_electron_flux,
            "actual_solar_wind_speed": p.actual_solar_wind_speed,
            "actual_imf_bz": p.actual_imf_bz,
            "is_validated": p.is_validated
        }
        for p in preds
    ]
