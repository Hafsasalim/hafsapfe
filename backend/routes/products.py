"""Produits Café — GET /api/products/"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.models import CoffeeType, CoffeeSale
from auth import get_current_user
from models.models import User

router = APIRouter()

@router.get("/")
def get_products(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = (
        db.query(
            CoffeeType.coffeeId, CoffeeType.name, CoffeeType.category, CoffeeType.basePrice,
            func.count(CoffeeSale.saleId).label("sales_count"),
            func.sum(CoffeeSale.amount).label("total_revenue")
        )
        .join(CoffeeSale, CoffeeSale.coffeeId == CoffeeType.coffeeId, isouter=True)
        .group_by(CoffeeType.coffeeId, CoffeeType.name, CoffeeType.category, CoffeeType.basePrice)
        .order_by(func.sum(CoffeeSale.amount).desc())
        .all()
    )
    return [
        {"id": r.coffeeId, "name": r.name, "category": r.category,
         "base_price": r.basePrice, "sales_count": r.sales_count or 0,
         "total_revenue": round(r.total_revenue or 0, 2)}
        for r in rows
    ]

@router.get("/categories")
def get_categories(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = db.query(CoffeeType.category).distinct().all()
    return [r.category for r in rows if r.category]
