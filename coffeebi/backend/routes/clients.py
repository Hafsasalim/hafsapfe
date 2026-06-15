"""Clients — GET /api/clients/"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.models import Client, CoffeeSale
from auth import get_current_user
from models.models import User

router = APIRouter()

@router.get("/")
def get_clients(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Liste clients anonymisés avec stats de ventes — JOIN client → coffee_sales"""
    rows = (
        db.query(
            Client.id_client,
            Client.code_anonyme,
            func.count(CoffeeSale.sale_id).label("total_orders"),
            func.sum(CoffeeSale.amount).label("total_spent")
        )
        .join(CoffeeSale, CoffeeSale.client_id == Client.id_client, isouter=True)
        .group_by(Client.id_client, Client.code_anonyme)
        .order_by(func.sum(CoffeeSale.amount).desc())
        .limit(50)
        .all()
    )
    return [
        {"id": r.id_client, "code": r.code_anonyme,
         "orders": r.total_orders or 0, "spent": round(r.total_spent or 0, 2)}
        for r in rows
    ]

@router.get("/stats")
def clients_stats(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Statistiques clients globales"""
    total = db.query(func.count(Client.id_client)).scalar()
    active = db.query(func.count(func.distinct(CoffeeSale.client_id))).scalar()
    return {"total_clients": total, "active_clients": active}
