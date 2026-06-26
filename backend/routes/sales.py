"""Ventes — GET /api/sales/ avec filtres, tri et pagination"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, asc, desc
from typing import Optional
from database import get_db
from models.models import CoffeeSale, CoffeeType, PaymentMode
from auth import get_current_user
from models.models import User

router = APIRouter()

SORT_MAP = {
    'id':       CoffeeSale.saleId,
    'date':     CoffeeSale.saleDate,
    'hour':     CoffeeSale.hour,
    'coffee':   CoffeeType.name,
    'category': CoffeeType.category,
    'payment':  PaymentMode.type,
    'amount':   CoffeeSale.amount,
    'moment':   CoffeeSale.time_of_day,
}

@router.get("/")
def get_sales(
    page:        int            = Query(1, ge=1),
    limit:       int            = Query(10, ge=1, le=100),
    # Filtres par colonne
    sale_id:     Optional[int]   = None,
    date_from:   Optional[str]   = None,
    date_to:     Optional[str]   = None,
    hour_from:   Optional[int]   = None,
    hour_to:     Optional[int]   = None,
    coffee_name: Optional[str]   = None,
    category:    Optional[str]   = None,
    payment:     Optional[str]   = None,
    amount_min:  Optional[float] = None,
    amount_max:  Optional[float] = None,
    time_of_day: Optional[str]   = None,
    # Tri
    sort_by:     Optional[str]   = Query("date"),
    sort_dir:    Optional[str]   = Query("desc"),
    # Anciens params (compat)
    month:       Optional[str]   = None,
    coffee_id:   Optional[int]   = None,
    payment_id:  Optional[int]   = None,
    db:    Session = Depends(get_db),
    _:     User    = Depends(get_current_user)
):
    q = (
        db.query(
            CoffeeSale.saleId,
            CoffeeSale.saleDate,
            CoffeeSale.hour,
            CoffeeSale.amount,
            CoffeeSale.time_of_day,
            CoffeeSale.month_name,
            CoffeeType.name.label("nom_cafe"),
            CoffeeType.category.label("categorie"),
            PaymentMode.type.label("payment_type")
        )
        .join(CoffeeType,  CoffeeSale.coffeeId  == CoffeeType.coffeeId)
        .join(PaymentMode, CoffeeSale.paymentId == PaymentMode.paymentId, isouter=True)
    )

    # ── Filtres ────────────────────────────────────────────────────
    if sale_id     is not None: q = q.filter(CoffeeSale.saleId == sale_id)
    if date_from:               q = q.filter(CoffeeSale.saleDate >= date_from)
    if date_to:                 q = q.filter(CoffeeSale.saleDate <= date_to)
    if hour_from   is not None: q = q.filter(CoffeeSale.hour >= hour_from)
    if hour_to     is not None: q = q.filter(CoffeeSale.hour <= hour_to)
    if coffee_name:             q = q.filter(CoffeeType.name.ilike(f'%{coffee_name}%'))
    if category:                q = q.filter(CoffeeType.category == category)
    if payment:                 q = q.filter(PaymentMode.type == payment)
    if amount_min  is not None: q = q.filter(CoffeeSale.amount >= amount_min)
    if amount_max  is not None: q = q.filter(CoffeeSale.amount <= amount_max)
    if time_of_day:             q = q.filter(CoffeeSale.time_of_day == time_of_day)
    # compat
    if month:      q = q.filter(CoffeeSale.month_name == month)
    if coffee_id:  q = q.filter(CoffeeSale.coffeeId   == coffee_id)
    if payment_id: q = q.filter(CoffeeSale.paymentId  == payment_id)

    # ── Tri ───────────────────────────────────────────────────────
    sort_col = SORT_MAP.get(sort_by, CoffeeSale.saleDate)
    order    = asc(sort_col) if sort_dir == 'asc' else desc(sort_col)

    total   = q.count()
    records = q.order_by(order).offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total, "page": page, "pages": (total + limit - 1) // limit,
        "data": [
            {"sale_id": r.saleId, "date": str(r.saleDate), "hour": r.hour,
             "amount": r.amount, "time_of_day": r.time_of_day, "month": r.month_name,
             "coffee": r.nom_cafe, "category": r.categorie, "payment": r.payment_type}
            for r in records
        ]
    }


@router.get("/summary")
def sales_summary(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    result = db.query(
        func.sum(CoffeeSale.amount).label("total"),
        func.count(CoffeeSale.saleId).label("count"),
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
