from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
import io
import datetime
from backend.database import get_db
from backend.models import Prediction, User
from backend.routers.auth import get_current_user
from backend.services.report_generator import ReportGenerator
from backend.routers.dashboard import get_dashboard_summary

router = APIRouter(prefix="/reports", tags=["Report Generation"])

@router.get("/download/pdf")
def download_pdf_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    summary = get_dashboard_summary(db, current_user)
    predictions = summary["predictions"]
    stats = summary["stats"]
    
    pdf_buffer = ReportGenerator.generate_pdf_report(predictions, stats)
    
    filename = f"astracast_report_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/download/excel")
def download_excel_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    summary = get_dashboard_summary(db, current_user)
    predictions = summary["predictions"]
    
    excel_buffer = ReportGenerator.generate_excel_report(predictions)
    
    filename = f"astracast_report_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.xlsx"
    
    return StreamingResponse(
        excel_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/download/csv")
def download_csv_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    summary = get_dashboard_summary(db, current_user)
    predictions = summary["predictions"]
    
    csv_string = ReportGenerator.generate_csv_report(predictions)
    
    filename = f"astracast_report_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return Response(
        content=csv_string,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
