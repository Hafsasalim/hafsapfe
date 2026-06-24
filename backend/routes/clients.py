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
    rows = (
        db.query(
            Client.clientId,
            Client.codeAnonyme,
            func.count(CoffeeSale.saleId).label("total_orders"),
            func.sum(CoffeeSale.amount).label("total_spent")
        )
        .join(CoffeeSale, CoffeeSale.clientId == Client.clientId, isouter=True)
        .group_by(Client.clientId, Client.codeAnonyme)
        .order_by(func.sum(CoffeeSale.amount).desc())
        .limit(50)
        .all()
    )
    return [
        {"id": r.clientId, "code": r.codeAnonyme,
         "orders": r.total_orders or 0, "spent": round(r.total_spent or 0, 2)}
        for r in rows
    ]

@router.get("/stats")
def clients_stats(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    total  = db.query(func.count(Client.clientId)).scalar()
    active = db.query(func.count(func.distinct(CoffeeSale.clientId))).scalar()
    return {"total_clients": total, "active_clients": active}
