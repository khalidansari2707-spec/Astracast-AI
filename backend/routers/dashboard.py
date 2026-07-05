from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import datetime
from backend.database import get_db
from backend.models import SpaceWeatherData, Prediction, Alert, User
from backend.routers.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard Info"])

@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Latest Observation (Current Conditions)
    latest_obs = db.query(SpaceWeatherData).order_by(SpaceWeatherData.timestamp.desc()).first()
    
    current_conditions = None
    if latest_obs:
        current_conditions = {
            "timestamp": latest_obs.timestamp.isoformat(),
            "electron_flux": latest_obs.electron_flux,
            "proton_flux": latest_obs.proton_flux,
            "solar_wind_speed": latest_obs.solar_wind_speed,
            "imf_bz": latest_obs.imf_bz,
            "plasma_density": latest_obs.plasma_density,
            "magnetic_field": latest_obs.magnetic_field,
            "xray_flux": latest_obs.xray_flux,
            "solar_activity_index": latest_obs.solar_activity_index,
            "source": latest_obs.source
        }
    else:
        # Default fallback so dashboard doesn't load empty
        current_conditions = {
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "electron_flux": 120.4,
            "proton_flux": 12.3,
            "solar_wind_speed": 380.5,
            "imf_bz": -1.2,
            "plasma_density": 4.5,
            "magnetic_field": 3.8,
            "xray_flux": 0.05,
            "solar_activity_index": 1.1,
            "source": "simulated"
        }

    # 2. Latest predictions grouped by horizon
    latest_preds = []
    # Find the most recent timestamp in predictions table
    latest_pred_time = db.query(Prediction.timestamp).order_by(Prediction.timestamp.desc()).first()
    
    if latest_pred_time:
        preds = db.query(Prediction).filter(Prediction.timestamp == latest_pred_time[0]).all()
        for p in preds:
            latest_preds.append({
                "horizon": p.prediction_horizon,
                "storm_probability": p.storm_probability,
                "expected_electron_flux": p.expected_electron_flux,
                "expected_solar_wind_speed": p.expected_solar_wind_speed,
                "expected_imf_bz": p.expected_imf_bz,
                "expected_radiation_category": p.expected_radiation_category,
                "expected_peak_time": p.expected_peak_time.isoformat() if p.expected_peak_time else None,
                "expected_duration": p.expected_duration,
                "confidence": p.confidence,
                "explanation": p.explanation,
                "recommended_action": p.recommended_action
            })
    else:
        # Provide sample predicted cards if DB is fresh
        now = datetime.datetime.utcnow()
        samples = [
            {"horizon": "30m", "storm_prob": 0.04, "elec": 120.0, "wind": 382.0, "bz": -1.1, "cat": "S0", "dur": 0.5, "conf": 98.4, "exp": "Stable magnetospheric plasma. Solar wind flow laminarity is high.", "rec": "Routine monitoring."},
            {"horizon": "6h", "storm_prob": 0.08, "elec": 135.0, "wind": 395.0, "bz": -1.5, "cat": "S0", "dur": 1.0, "conf": 89.2, "exp": "Mild coronal hole wind stream onset expected.", "rec": "Watch satellite telemetry."},
            {"horizon": "12h", "storm_prob": 0.12, "elec": 150.0, "wind": 410.0, "bz": -2.0, "cat": "S1", "dur": 2.0, "conf": 82.5, "exp": "Slight southward transition in IMF Bz expected.", "rec": "Prepare operators for minor geomagnetic adjustments."},
            {"horizon": "24h", "storm_prob": 0.18, "elec": 180.0, "wind": 425.0, "bz": -2.5, "cat": "S1", "dur": 4.0, "conf": 76.1, "exp": "Minor solar wind stream elevation.", "rec": "No critical mitigations needed."},
            {"horizon": "3d", "storm_prob": 0.25, "elec": 220.0, "wind": 450.0, "bz": -3.0, "cat": "S1", "dur": 8.0, "conf": 65.4, "exp": "Long range plasma stream compression wave predicted.", "rec": "Check power grid storm safety levels."},
            {"horizon": "7d", "storm_prob": 0.35, "elec": 310.0, "wind": 480.0, "bz": -3.5, "cat": "S1", "dur": 12.0, "conf": 54.2, "exp": "Active sunspot AR3089 rotates into Earth-facing position.", "rec": "Alert research stations for solar flare activity."}
        ]
        for s in samples:
            latest_preds.append({
                "horizon": s["horizon"],
                "storm_probability": s["storm_prob"],
                "expected_electron_flux": s["elec"],
                "expected_solar_wind_speed": s["wind"],
                "expected_imf_bz": s["bz"],
                "expected_radiation_category": s["cat"],
                "expected_peak_time": (now + datetime.timedelta(hours=s["dur"])).isoformat(),
                "expected_duration": s["dur"],
                "confidence": s["conf"],
                "explanation": s["exp"],
                "recommended_action": s["rec"]
            })

    # 3. Active Storm Countdown
    # We find the next prediction showing high storm probability (>0.5)
    countdown = None
    storm_pred = next((p for p in latest_preds if p["storm_probability"] > 0.5), None)
    if storm_pred:
        countdown = {
            "peak_time": storm_pred["expected_peak_time"],
            "probability": storm_pred["storm_probability"],
            "category": storm_pred["expected_radiation_category"]
        }

    # 4. Recent Alerts
    alerts = db.query(Alert).filter(Alert.acknowledged == False).order_by(Alert.timestamp.desc()).limit(5).all()
    recent_alerts = [
        {
            "id": a.id,
            "timestamp": a.timestamp.isoformat(),
            "severity": a.severity,
            "message": a.message,
            "parameter": a.parameter,
            "value": a.value
        }
        for a in alerts
    ]

    # 5. Historical vs Predicted Charts
    # Get last 48 records from historical
    history_records = db.query(SpaceWeatherData).order_by(SpaceWeatherData.timestamp.desc()).limit(48).all()
    history_chart = []
    for r in reversed(history_records):
        history_chart.append({
            "timestamp": r.timestamp.isoformat(),
            "electron_flux": r.electron_flux,
            "solar_wind_speed": r.solar_wind_speed,
            "imf_bz": r.imf_bz,
            "plasma_density": r.plasma_density,
            "type": "actual"
        })
        
    # Append predicted future values
    predicted_chart = []
    for idx, p in enumerate(latest_preds):
        offset_hours = 0.5
        if p["horizon"] == "6h": offset_hours = 6
        elif p["horizon"] == "12h": offset_hours = 12
        elif p["horizon"] == "24h": offset_hours = 24
        elif p["horizon"] == "3d": offset_hours = 72
        elif p["horizon"] == "7d": offset_hours = 168
        
        future_time = now + datetime.timedelta(hours=offset_hours) if not latest_pred_time else latest_pred_time[0] + datetime.timedelta(hours=offset_hours)
        predicted_chart.append({
            "timestamp": future_time.isoformat(),
            "electron_flux": p["expected_electron_flux"],
            "solar_wind_speed": p["expected_solar_wind_speed"],
            "imf_bz": p["expected_imf_bz"],
            "plasma_density": current_conditions["plasma_density"], # carry forward current density
            "type": "predicted"
        })

    # Core stats
    total_alerts = db.query(Alert).count()
    active_alerts = len(recent_alerts)
    avg_confidence = sum([p["confidence"] for p in latest_preds]) / len(latest_preds) if latest_preds else 90.0

    return {
        "current_conditions": current_conditions,
        "predictions": latest_preds,
        "countdown": countdown,
        "recent_alerts": recent_alerts,
        "chart_data": history_chart + predicted_chart,
        "stats": {
            "total_alerts": total_alerts,
            "active_alerts": active_alerts,
            "avg_confidence": avg_confidence,
            "risk_score": max([p["storm_probability"] for p in latest_preds]) * 100 if latest_preds else 10.0
        }
    }
