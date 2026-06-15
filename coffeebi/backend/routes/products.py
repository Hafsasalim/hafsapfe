"""Produits Café — GET /api/products/"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.models import Cafe, CoffeeSale
from auth import get_current_user
from models.models import User

router = APIRouter()

@router.get("/")
def get_products(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Liste des cafés avec statistiques de ventes — JOIN cafe → coffee_sales"""
    rows = (
        db.query(
            Cafe.id_cafe, Cafe.nom_cafe, Cafe.categorie, Cafe.prix_base,
            func.count(CoffeeSale.sale_id).label("sales_count"),
            func.sum(CoffeeSale.amount).label("total_revenue")
        )
        .join(CoffeeSale, CoffeeSale.coffee_id == Cafe.id_cafe, isouter=True)
        .group_by(Cafe.id_cafe, Cafe.nom_cafe, Cafe.categorie, Cafe.prix_base)
        .order_by(func.sum(CoffeeSale.amount).desc())
        .all()
    )
    return [
        {"id": r.id_cafe, "name": r.nom_cafe, "category": r.categorie,
         "base_price": r.prix_base, "sales_count": r.sales_count or 0,
         "total_revenue": round(r.total_revenue or 0, 2)}
        for r in rows
    ]

@router.get("/categories")
def get_categories(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Liste des catégories distinctes"""
    rows = db.query(Cafe.categorie).distinct().all()
    return [r.categorie for r in rows if r.categorie]
