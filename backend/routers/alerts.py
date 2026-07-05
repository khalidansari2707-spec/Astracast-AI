from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Alert, User, SystemLog
from backend.routers.auth import get_current_user, check_role

router = APIRouter(prefix="/alerts", tags=["System Warnings"])

@router.get("")
def get_system_alerts(
    unacknowledged_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Alert)
    if unacknowledged_only:
        query = query.filter(Alert.acknowledged == False)
        
    alerts = query.order_by(Alert.timestamp.desc()).all()
    
    return [
        {
            "id": a.id,
            "timestamp": a.timestamp.isoformat(),
            "severity": a.severity,
            "message": a.message,
            "parameter": a.parameter,
            "value": a.value,
            "acknowledged": a.acknowledged
        }
        for a in alerts
    ]

@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    alert.acknowledged = True
    db.commit()
    return {"message": "Alert acknowledged successfully"}

@router.post("/acknowledge-all")
def acknowledge_all_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    unack = db.query(Alert).filter(Alert.acknowledged == False).all()
    for a in unack:
        a.acknowledged = True
    db.commit()
    return {"message": f"Acknowledged {len(unack)} alerts"}
