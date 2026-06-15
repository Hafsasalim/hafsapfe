"""Ventes — GET /api/sales/ avec filtres et pagination"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from database import get_db
from models.models import CoffeeSale, Cafe, PaymentMode, Client
from auth import get_current_user
from models.models import User

router = APIRouter()

@router.get("/")
def get_sales(
    page:       int = Query(1, ge=1),
    limit:      int = Query(10, ge=1, le=100),
    month:      Optional[str] = None,
    coffee_id:  Optional[int] = None,
    payment_id: Optional[int] = None,
    time_of_day:Optional[str] = None,
    db:    Session = Depends(get_db),
    _:     User    = Depends(get_current_user)
):
    """Liste des ventes avec filtres — JOIN cafe + payment_mode"""
    q = (
        db.query(
            CoffeeSale.sale_id,
            CoffeeSale.sale_date,
            CoffeeSale.hour,
            CoffeeSale.amount,
            CoffeeSale.time_of_day,
            CoffeeSale.month_name,
            Cafe.nom_cafe,
            Cafe.categorie,
            PaymentMode.type.label("payment_type")
        )
        .join(Cafe,        CoffeeSale.coffee_id  == Cafe.id_cafe)
        .join(PaymentMode, CoffeeSale.payment_id == PaymentMode.payment_id, isouter=True)
    )
    if month:       q = q.filter(CoffeeSale.month_name == month)
    if coffee_id:   q = q.filter(CoffeeSale.coffee_id  == coffee_id)
    if payment_id:  q = q.filter(CoffeeSale.payment_id == payment_id)
    if time_of_day: q = q.filter(CoffeeSale.time_of_day == time_of_day)

    total   = q.count()
    records = q.order_by(CoffeeSale.sale_date.desc()).offset((page-1)*limit).limit(limit).all()

    return {
        "total": total, "page": page, "pages": (total + limit - 1) // limit,
        "data": [
            {"sale_id": r.sale_id, "date": str(r.sale_date), "hour": r.hour,
             "amount": r.amount, "time_of_day": r.time_of_day, "month": r.month_name,
             "coffee": r.nom_cafe, "category": r.categorie, "payment": r.payment_type}
            for r in records
        ]
    }

@router.get("/summary")
def sales_summary(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Résumé global des ventes"""
    result = db.query(
        func.sum(CoffeeSale.amount).label("total"),
        func.count(CoffeeSale.sale_id).label("count"),
        func.avg(CoffeeSale.amount).label("avg"),
        func.max(CoffeeSale.amount).label("max"),
        func.min(CoffeeSale.amount).label("min"),
    ).first()
    return {
        "total_revenue": round(result.total or 0, 2),
        "total_sales":   result.count or 0,
        "avg_amount":    round(result.avg or 0, 2),
        "max_amount":    round(result.max or 0, 2),
        "min_amount":    round(result.min or 0, 2),
    }
