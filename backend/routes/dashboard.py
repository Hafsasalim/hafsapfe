"""
Dashboard KPIs — GET /api/dashboard/
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.models import CoffeeSale, CoffeeType, PaymentMode, Client
from auth import get_current_user
from models.models import User

router = APIRouter()

@router.get("/kpis")
def get_kpis(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    totals = db.query(
        func.sum(CoffeeSale.amount).label("revenue"),
        func.count(CoffeeSale.saleId).label("count")
    ).first()

    avg = round((totals.revenue or 0) / max(totals.count or 1, 1), 2)

    best_day_row = (
        db.query(CoffeeSale.weekday_sort, func.sum(CoffeeSale.amount).label("rev"))
        .group_by(CoffeeSale.weekday_sort)
        .order_by(func.sum(CoffeeSale.amount).desc())
        .first()
    )
    days = {1:"Lundi",2:"Mardi",3:"Mercredi",4:"Jeudi",5:"Vendredi",6:"Samedi",7:"Dimanche"}
    best_day = days.get(best_day_row.weekday_sort, "—") if best_day_row else "—"

    best_prod = (
        db.query(CoffeeType.name, func.sum(CoffeeSale.amount).label("rev"))
        .join(CoffeeSale, CoffeeSale.coffeeId == CoffeeType.coffeeId)
        .group_by(CoffeeType.name)
        .order_by(func.sum(CoffeeSale.amount).desc())
        .first()
    )

    best_cat = (
        db.query(CoffeeType.category, func.sum(CoffeeSale.amount).label("rev"))
        .join(CoffeeSale, CoffeeSale.coffeeId == CoffeeType.coffeeId)
        .group_by(CoffeeType.category)
        .order_by(func.sum(CoffeeSale.amount).desc())
        .first()
    )

    return {
        "total_revenue":  round(totals.revenue or 0, 2),
        "total_sales":    totals.count or 0,
        "avg_basket":     avg,
        "best_day":       best_day,
        "best_product":   best_prod.name if best_prod else "—",
        "best_category":  best_cat.category if best_cat else "—",
    }


@router.get("/monthly")
def monthly_sales(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = (
        db.query(
            CoffeeSale.month_name,
            CoffeeSale.month_sort,
            func.sum(CoffeeSale.amount).label("revenue"),
            func.count(CoffeeSale.saleId).label("count")
        )
        .group_by(CoffeeSale.month_name, CoffeeSale.month_sort)
        .order_by(CoffeeSale.month_sort)
        .all()
    )
    return [{"month": r.month_name, "revenue": round(r.revenue, 2), "count": r.count} for r in rows]


@router.get("/by-hour")
def by_hour(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = (
        db.query(
            CoffeeSale.hour,
            func.count(CoffeeSale.saleId).label("count"),
            func.sum(CoffeeSale.amount).label("revenue")
        )
        .group_by(CoffeeSale.hour)
        .order_by(CoffeeSale.hour)
        .all()
    )
    return [{"hour": r.hour, "count": r.count, "revenue": round(r.revenue, 2)} for r in rows]


@router.get("/by-category")
def by_category(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = (
        db.query(
            CoffeeType.category,
            func.sum(CoffeeSale.amount).label("revenue"),
            func.count(CoffeeSale.saleId).label("count")
        )
        .join(CoffeeSale, CoffeeSale.coffeeId == CoffeeType.coffeeId)
        .group_by(CoffeeType.category)
        .order_by(func.sum(CoffeeSale.amount).desc())
        .all()
    )
    total = sum(r.revenue for r in rows) or 1
    colors = {"Classique":"#3b82f6","Lait":"#8b5cf6","Chocolat":"#10b981","Strong":"#f59e0b"}
    return [
        {"name": r.category, "value": round(r.revenue, 2),
         "count": r.count, "pct": round((r.revenue/total)*100, 1),
         "color": colors.get(r.category, "#94a3b8")}
        for r in rows
    ]


@router.get("/by-payment")
def by_payment(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = (
        db.query(
            PaymentMode.type,
            func.count(CoffeeSale.saleId).label("count"),
            func.sum(CoffeeSale.amount).label("revenue")
        )
        .join(CoffeeSale, CoffeeSale.paymentId == PaymentMode.paymentId)
        .group_by(PaymentMode.type)
        .all()
    )
    total = sum(r.count for r in rows) or 1
    return [{"type": r.type, "count": r.count,
             "revenue": round(r.revenue, 2), "pct": round((r.count/total)*100, 1)} for r in rows]


@router.get("/by-time-of-day")
def by_time_of_day(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = (
        db.query(
            CoffeeSale.time_of_day,
            func.count(CoffeeSale.saleId).label("count"),
            func.sum(CoffeeSale.amount).label("revenue")
        )
        .group_by(CoffeeSale.time_of_day)
        .all()
    )
    return [{"period": r.time_of_day, "count": r.count, "revenue": round(r.revenue, 2)} for r in rows]


@router.get("/top-products")
def top_products(limit: int = 5, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = (
        db.query(
            CoffeeType.name,
            CoffeeType.category,
            CoffeeType.basePrice,
            func.sum(CoffeeSale.amount).label("revenue"),
            func.count(CoffeeSale.saleId).label("count")
        )
        .join(CoffeeSale, CoffeeSale.coffeeId == CoffeeType.coffeeId)
        .group_by(CoffeeType.coffeeId, CoffeeType.name, CoffeeType.category, CoffeeType.basePrice)
        .order_by(func.sum(CoffeeSale.amount).desc())
        .limit(limit)
        .all()
    )
    max_rev = rows[0].revenue if rows else 1
    return [
        {"rank": i+1, "name": r.name, "category": r.category,
         "base_price": r.basePrice, "revenue": round(r.revenue, 2),
         "count": r.count, "pct": round((r.revenue/max_rev)*100)}
        for i, r in enumerate(rows)
    ]
