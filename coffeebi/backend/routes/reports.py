"""Rapports BI — GET/POST /api/reports/"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.models import Report, CoffeeSale
from schemas.schemas import ReportCreate
from auth import get_current_user
from models.models import User
from datetime import datetime

router = APIRouter()

@router.get("/")
def get_reports(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    reports = db.query(Report).order_by(Report.created_at.desc()).limit(20).all()
    return [
        {"id": r.report_id, "period": r.period, "total_sales": r.total_sales,
         "created_at": str(r.created_at), "notes": r.notes}
        for r in reports
    ]

@router.post("/generate")
def generate_report(
    body:    ReportCreate,
    db:      Session = Depends(get_db),
    current: User    = Depends(get_current_user)
):
    """Générer un rapport automatique pour la période spécifiée"""
    total = db.query(func.sum(CoffeeSale.amount)).filter(
        CoffeeSale.month_name == body.period
    ).scalar() or 0

    report = Report(
        period=body.period,
        total_sales=round(total, 2),
        generated_by=current.user_id,
        created_at=datetime.utcnow(),
        notes=body.notes or f"Auto-generated report for {body.period}"
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return {"id": report.report_id, "period": report.period,
            "total_sales": report.total_sales, "created_at": str(report.created_at)}
