from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Threshold, SystemLog, User
from backend.routers.auth import check_role, get_current_user
from backend.config import settings

router = APIRouter(prefix="/settings", tags=["System Settings"])

@router.get("/thresholds")
def get_thresholds(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    thresholds = db.query(Threshold).all()
    if not thresholds:
        # Prepopulate with defaults if database is clean
        threshold_list = []
        for name, values in settings.DEFAULT_THRESHOLDS.items():
            db_t = Threshold(
                parameter_name=name,
                low=values["low"],
                medium=values["medium"],
                high=values["high"],
                critical=values["critical"]
            )
            db.add(db_t)
            threshold_list.append(db_t)
        db.commit()
        thresholds = threshold_list

    return {
        t.parameter_name: {
            "low": t.low,
            "medium": t.medium,
            "high": t.high,
            "critical": t.critical
        }
        for t in thresholds
    }

@router.post("/thresholds")
def update_thresholds(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin"]))
):
    """
    Updates warning levels for space weather triggers.
    """
    for param, values in data.items():
        if param not in settings.DEFAULT_THRESHOLDS:
            continue
        
        t = db.query(Threshold).filter(Threshold.parameter_name == param).first()
        if not t:
            t = Threshold(parameter_name=param)
            db.add(t)
            
        t.low = float(values.get("low", t.low))
        t.medium = float(values.get("medium", t.medium))
        t.high = float(values.get("high", t.high))
        t.critical = float(values.get("critical", t.critical))

    db.commit()
    log = SystemLog(level="info", message="System thresholds updated by admin.", user=current_user.username)
    db.add(log)
    db.commit()
    return {"message": "Thresholds updated successfully"}

@router.get("/logs")
def get_system_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin"]))
):
    logs = db.query(SystemLog).order_by(SystemLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "timestamp": l.timestamp.isoformat(),
            "level": l.level,
            "message": l.message,
            "user": l.user
        }
        for l in logs
    ]
