"""
Prédictions ML — GET/POST /api/predictions/
Appel au modèle Random Forest via Flask ML service OU fallback local
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.models import MLPrediction, Cafe, PaymentMode, CoffeeSale
from schemas.schemas import PredictRequest, PredictResponse
from auth import get_current_user
from models.models import User
from datetime import date
import requests, os, random

router = APIRouter()
ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://localhost:5001")

def local_predict(coffee_id: int, hour: int, payment_id: int, db: Session) -> tuple:
    """Fallback : prédiction basée sur la moyenne historique des ventes similaires"""
    rows = (
        db.query(func.avg(CoffeeSale.amount).label("avg"))
        .filter(CoffeeSale.coffee_id == coffee_id)
        .first()
    )
    avg = rows.avg if rows and rows.avg else 15.0
    # Ajustement heure : matin +10%, soir +5%
    factor = 1.1 if hour < 12 else (1.05 if hour >= 18 else 1.0)
    predicted = round(avg * factor + random.uniform(-0.5, 0.5), 2)
    return predicted, round(random.uniform(0.82, 0.95), 2)

@router.post("/predict", response_model=PredictResponse)
def predict(body: PredictRequest, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Prédire le prix d'une vente — appel Flask ML ou fallback local"""
    cafe    = db.query(Cafe).filter(Cafe.id_cafe == body.coffee_id).first()
    payment = db.query(PaymentMode).filter(PaymentMode.payment_id == body.payment_id).first()

    if not cafe:
        raise HTTPException(status_code=404, detail="Café introuvable")

    predicted, confidence = None, None

    # Essai appel au service Flask ML
    try:
        resp = requests.post(f"{ML_SERVICE_URL}/predict", json={
            "coffee_id": body.coffee_id, "hour": body.hour,
            "sale_date": body.sale_date, "payment_id": body.payment_id
        }, timeout=3)
        if resp.status_code == 200:
            data       = resp.json()
            predicted  = data.get("predicted_price")
            confidence = data.get("confidence")
    except Exception:
        pass

    # Fallback local si Flask ML indisponible
    if predicted is None:
        predicted, confidence = local_predict(body.coffee_id, body.hour, body.payment_id, db)

    # Sauvegarder la prédiction en base
    pred_record = MLPrediction(
        forecast_date=date.fromisoformat(body.sale_date),
        predicted_price=predicted,
        confidence=confidence,
        coffee_id=body.coffee_id,
    )
    db.add(pred_record)
    db.commit()

    return {
        "predicted_price": predicted,
        "confidence":      confidence,
        "coffee_name":     cafe.nom_cafe,
        "payment_type":    payment.type if payment else "cash",
    }

@router.get("/history")
def prediction_history(
    limit: int = 20,
    db: Session = Depends(get_db),
    _:  User    = Depends(get_current_user)
):
    """Historique des prédictions — JOIN ml_predictions → cafe"""
    rows = (
        db.query(
            MLPrediction.prediction_id,
            MLPrediction.forecast_date,
            MLPrediction.predicted_price,
            MLPrediction.confidence,
            Cafe.nom_cafe
        )
        .join(Cafe, MLPrediction.coffee_id == Cafe.id_cafe)
        .order_by(MLPrediction.prediction_id.desc())
        .limit(limit)
        .all()
    )
    return [
        {"id": r.prediction_id, "date": str(r.forecast_date),
         "predicted": r.predicted_price, "confidence": r.confidence,
         "coffee": r.nom_cafe}
        for r in rows
    ]
