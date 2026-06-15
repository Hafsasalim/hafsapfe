"""
Dashboard KPIs — GET /api/dashboard/
Toutes les métriques calculées avec JOINs sur coffee_bi
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from database import get_db
from models.models import CoffeeSale, Cafe, PaymentMode, Client
from auth import get_current_user
from models.models import User

router = APIRouter()

@router.get("/kpis")
def get_kpis(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """KPIs principaux : CA total, nb ventes, panier moyen, meilleur jour, meilleur produit"""

    # CA total + nb ventes
    totals = db.query(
        func.sum(CoffeeSale.amount).label("revenue"),
        func.count(CoffeeSale.sale_id).label("count")
    ).first()

    # Panier moyen
    avg = round((totals.revenue or 0) / max(totals.count or 1, 1), 2)

    # Meilleur jour de la semaine
    best_day_row = (
        db.query(CoffeeSale.weekday_sort, func.sum(CoffeeSale.amount).label("rev"))
        .group_by(CoffeeSale.weekday_sort)
        .order_by(func.sum(CoffeeSale.amount).desc())
        .first()
    )
    days = {1:"Lundi",2:"Mardi",3:"Mercredi",4:"Jeudi",5:"Vendredi",6:"Samedi",7:"Dimanche"}
    best_day = days.get(best_day_row.weekday_sort, "—") if best_day_row else "—"

    # Meilleur produit (JOIN coffee_sales → cafe)
    best_prod = (
        db.query(Cafe.nom_cafe, func.sum(CoffeeSale.amount).label("rev"))
        .join(CoffeeSale, CoffeeSale.coffee_id == Cafe.id_cafe)
        .group_by(Cafe.nom_cafe)
        .order_by(func.sum(CoffeeSale.amount).desc())
        .first()
    )

    # Meilleure catégorie
    best_cat = (
        db.query(Cafe.categorie, func.sum(CoffeeSale.amount).label("rev"))
        .join(CoffeeSale, CoffeeSale.coffee_id == Cafe.id_cafe)
        .group_by(Cafe.categorie)
        .order_by(func.sum(CoffeeSale.amount).desc())
        .first()
    )

    return {
        "total_revenue":  round(totals.revenue or 0, 2),
        "total_sales":    totals.count or 0,
        "avg_basket":     avg,
        "best_day":       best_day,
        "best_product":   best_prod.nom_cafe if best_prod else "—",
        "best_category":  best_cat.categorie if best_cat else "—",
    }


@router.get("/monthly")
def monthly_sales(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Évolution mensuelle des ventes (JOIN coffee_sales)"""
    rows = (
        db.query(
            CoffeeSale.month_name,
            CoffeeSale.month_sort,
            func.sum(CoffeeSale.amount).label("revenue"),
            func.count(CoffeeSale.sale_id).label("count")
        )
        .group_by(CoffeeSale.month_name, CoffeeSale.month_sort)
        .order_by(CoffeeSale.month_sort)
        .all()
    )
    return [{"month": r.month_name, "revenue": round(r.revenue, 2), "count": r.count} for r in rows]


@router.get("/by-hour")
def by_hour(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Ventes par heure"""
    rows = (
        db.query(
            CoffeeSale.hour,
            func.count(CoffeeSale.sale_id).label("count"),
            func.sum(CoffeeSale.amount).label("revenue")
        )
        .group_by(CoffeeSale.hour)
        .order_by(CoffeeSale.hour)
        .all()
    )
    return [{"hour": r.hour, "count": r.count, "revenue": round(r.revenue, 2)} for r in rows]


@router.get("/by-category")
def by_category(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Répartition par catégorie de café (JOIN coffee_sales → cafe)"""
    rows = (
        db.query(
            Cafe.categorie,
            func.sum(CoffeeSale.amount).label("revenue"),
            func.count(CoffeeSale.sale_id).label("count")
        )
        .join(CoffeeSale, CoffeeSale.coffee_id == Cafe.id_cafe)
        .group_by(Cafe.categorie)
        .order_by(func.sum(CoffeeSale.amount).desc())
        .all()
    )
    total = sum(r.revenue for r in rows) or 1
    colors = {"Classique":"#3b82f6","Lait":"#8b5cf6","Chocolat":"#10b981","Strong":"#f59e0b"}
    return [
        {"name": r.categorie, "value": round(r.revenue, 2),
         "count": r.count, "pct": round((r.revenue/total)*100, 1),
         "color": colors.get(r.categorie, "#94a3b8")}
        for r in rows
    ]


@router.get("/by-payment")
def by_payment(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Répartition par mode de paiement (JOIN coffee_sales → payment_mode)"""
    rows = (
        db.query(
            PaymentMode.type,
            func.count(CoffeeSale.sale_id).label("count"),
            func.sum(CoffeeSale.amount).label("revenue")
        )
        .join(CoffeeSale, CoffeeSale.payment_id == PaymentMode.payment_id)
        .group_by(PaymentMode.type)
        .all()
    )
    total = sum(r.count for r in rows) or 1
    return [{"type": r.type, "count": r.count,
             "revenue": round(r.revenue, 2), "pct": round((r.count/total)*100, 1)} for r in rows]


@router.get("/by-time-of-day")
def by_time_of_day(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Ventes par moment de la journée (Morning / Afternoon / Evening)"""
    rows = (
        db.query(
            CoffeeSale.time_of_day,
            func.count(CoffeeSale.sale_id).label("count"),
            func.sum(CoffeeSale.amount).label("revenue")
        )
        .group_by(CoffeeSale.time_of_day)
        .all()
    )
    return [{"period": r.time_of_day, "count": r.count, "revenue": round(r.revenue, 2)} for r in rows]


@router.get("/top-products")
def top_products(limit: int = 5, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Top produits par CA (JOIN coffee_sales → cafe)"""
    rows = (
        db.query(
            Cafe.nom_cafe,
            Cafe.categorie,
            Cafe.prix_base,
            func.sum(CoffeeSale.amount).label("revenue"),
            func.count(CoffeeSale.sale_id).label("count")
        )
        .join(CoffeeSale, CoffeeSale.coffee_id == Cafe.id_cafe)
        .group_by(Cafe.id_cafe, Cafe.nom_cafe, Cafe.categorie, Cafe.prix_base)
        .order_by(func.sum(CoffeeSale.amount).desc())
        .limit(limit)
        .all()
    )
    max_rev = rows[0].revenue if rows else 1
    return [
        {"rank": i+1, "name": r.nom_cafe, "category": r.categorie,
         "base_price": r.prix_base, "revenue": round(r.revenue, 2),
         "count": r.count, "pct": round((r.revenue/max_rev)*100)}
        for i, r in enumerate(rows)
    ]
