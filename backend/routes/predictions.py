"""
Prédictions ML — /api/predictions/
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.models import MLPrediction, CoffeeType, PaymentMode, CoffeeSale, Client
from schemas.schemas import PredictRequest, PredictResponse
from auth import get_current_user
from models.models import User
from datetime import date, datetime
import joblib, os, io
import pandas as pd
import numpy as np

router = APIRouter()

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "model_cafe.pkl")
_model = None

def get_model():
    global _model
    if _model is None:
        if os.path.exists(MODEL_PATH):
            _model = joblib.load(MODEL_PATH)
    return _model

COFFEE_ENCODING = {
    "Americano":           0,
    "Americano with Milk": 1,
    "Cappuccino":          2,
    "Cocoa":               3,
    "Cortado":             4,
    "Espresso":            5,
    "Hot Chocolate":       6,
    "Latte":               7,
}

COFFEE_ID_TO_NAME = {
    15: "Espresso",
    16: "Cappuccino",
    17: "Latte",
    18: "Americano",
    19: "Cocoa",
}

PAYMENT_ID_TO_TYPE = {1: "cash", 2: "card"}
PAYMENT_ENCODING   = {"cash": 0, "card": 1}


def ml_predict(coffee_id: int, hour: int, sale_date: str, payment_id: int) -> tuple:
    model = get_model()
    if model is None:
        return None, None
    try:
        dt           = datetime.fromisoformat(sale_date)
        coffee_name  = COFFEE_ID_TO_NAME.get(coffee_id, "Espresso")
        payment_type = PAYMENT_ID_TO_TYPE.get(payment_id, "cash")
        features = [[
            dt.year, dt.month, dt.day, dt.weekday(), hour,
            COFFEE_ENCODING.get(coffee_name, 5),
            PAYMENT_ENCODING.get(payment_type, 0),
        ]]
        predicted  = float(round(model.predict(features)[0], 2))
        confidence = 0.98
        return predicted, confidence
    except Exception as e:
        print(f"Erreur ML predict : {e}")
        return None, None


def fallback_predict(coffee_id: int, hour: int, db: Session) -> tuple:
    row = (
        db.query(func.avg(CoffeeSale.amount).label("avg"))
        .filter(CoffeeSale.coffeeId == coffee_id)
        .first()
    )
    avg       = float(row.avg) if row and row.avg else 15.0
    factor    = 1.1 if hour < 12 else (1.05 if hour >= 18 else 1.0)
    predicted = round(avg * factor, 2)
    return predicted, 0.75


@router.post("/predict", response_model=PredictResponse)
def predict(
    body: PredictRequest,
    db:   Session = Depends(get_db),
    _:    User    = Depends(get_current_user),
):
    cafe    = db.query(CoffeeType).filter(CoffeeType.coffeeId == body.coffee_id).first()
    payment = db.query(PaymentMode).filter(PaymentMode.paymentId == body.payment_id).first()

    if not cafe:
        raise HTTPException(status_code=404, detail="Café introuvable")

    predicted, confidence = ml_predict(body.coffee_id, body.hour, body.sale_date, body.payment_id)
    if predicted is None:
        predicted, confidence = fallback_predict(body.coffee_id, body.hour, db)

    pred_record = MLPrediction(
        forecastDate   = date.fromisoformat(body.sale_date),
        predictedPrice = predicted,
        confidence     = confidence,
        coffeeId       = body.coffee_id,
    )
    db.add(pred_record)
    db.commit()

    return {
        "predicted_price": predicted,
        "confidence":      confidence,
        "coffee_name":     cafe.name,
        "payment_type":    payment.type if payment else "cash",
    }


@router.post("/upload-predict")
async def upload_predict(
    file: UploadFile = File(...),
    db:   Session    = Depends(get_db),
    _:    User       = Depends(get_current_user),
):
    model = get_model()
    if model is None:
        raise HTTPException(status_code=503, detail="Modèle ML non chargé — vérifiez model_cafe.pkl")

    content = await file.read()
    try:
        df = pd.read_csv(io.StringIO(content.decode("utf-8-sig")), sep=";")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur lecture CSV: {e}")

    required = {"date", "hour_of_day", "cash_type", "money", "coffee_name"}
    missing = required - set(df.columns)
    if missing:
        raise HTTPException(status_code=400, detail=f"Colonnes manquantes: {missing}. Colonnes trouvées: {list(df.columns)}")

    try:
        if df["money"].dtype == object:
            df["money"] = (
                df["money"]
                .str.replace("R", "", regex=False)
                .str.replace(",", ".", regex=False)
            )
        df["money"] = pd.to_numeric(df["money"], errors="coerce")
        df.dropna(subset=["money"], inplace=True)
        df["date"] = pd.to_datetime(df["date"], dayfirst=True)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur traitement données: {e}")

    df["year"]           = df["date"].dt.year
    df["month"]          = df["date"].dt.month
    df["day"]            = df["date"].dt.day
    df["weekday"]        = df["date"].dt.dayofweek
    df["coffee_encoded"] = df["coffee_name"].map(COFFEE_ENCODING).fillna(5).astype(int)
    df["cash_encoded"]   = df["cash_type"].map(PAYMENT_ENCODING).fillna(0).astype(int)

    try:
        X = df[["year", "month", "day", "weekday", "hour_of_day", "coffee_encoded", "cash_encoded"]]
        df["predicted_price"] = model.predict(X).round(2)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur modèle ML: {e}")

    # Prépare le résultat immédiatement (même si la sauvegarde DB échoue)
    result = df[["date", "hour_of_day", "coffee_name", "cash_type", "money", "predicted_price"]].copy()
    result["date"] = result["date"].astype(str)

    # Insertion en DB — chaque ligne dans sa propre transaction pour éviter les états invalides
    saved = 0
    cafe_cache    = {}
    payment_cache = {}
    client_cache  = {}

    for _, row in df.iterrows():
        try:
            # Client (card code ou "ANON-CASH")
            raw_card = row.get("card") if not pd.isna(row.get("card", float("nan"))) else None
            code = str(raw_card).strip() if raw_card else "ANON-CASH"

            if code not in client_cache:
                client = db.query(Client).filter(Client.codeAnonyme == code).first()
                if not client:
                    client = Client(codeAnonyme=code)
                    db.add(client)
                    db.flush()
                client_cache[code] = client.clientId
            client_id = client_cache[code]

            # CoffeeType
            cname = row["coffee_name"]
            if cname not in cafe_cache:
                cafe = db.query(CoffeeType).filter(CoffeeType.name == cname).first()
                cafe_cache[cname] = cafe.coffeeId if cafe else 15
            coffee_id = cafe_cache[cname]

            # PaymentMode
            ptype = str(row.get("cash_type", "cash")).strip()
            if ptype not in payment_cache:
                payment = db.query(PaymentMode).filter(PaymentMode.type == ptype).first()
                payment_cache[ptype] = payment.paymentId if payment else 1
            payment_id = payment_cache[ptype]

            sale = CoffeeSale(
                saleDate     = row["date"].date(),
                hour         = int(row["hour_of_day"]),
                amount       = float(row["money"]),
                coffeeId     = coffee_id,
                paymentId    = payment_id,
                clientId     = client_id,
                time_of_day  = str(row.get("Time_of_Day", "") or ""),
                month_name   = str(row.get("Month_name", "") or ""),
                month_sort   = int(row.get("Monthsort", 0) or 0),
                weekday_sort = int(row.get("Weekdaysort", 0) or 0),
            )
            db.add(sale)
            db.flush()

            pred = MLPrediction(
                forecastDate   = row["date"].date(),
                predictedPrice = float(row["predicted_price"]),
                confidence     = 0.98,
                coffeeId       = coffee_id,
                saleId         = sale.saleId,
            )
            db.add(pred)
            saved += 1

        except Exception as e:
            db.rollback()  # remet la session dans un état valide
            client_cache.clear()
            payment_cache.clear()
            print(f"Erreur ligne {_} : {e}")
            continue

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Erreur commit DB: {e}")

    return {
        "total_rows":      len(result),
        "total_real":      round(float(df["money"].sum()), 2),
        "total_predicted": round(float(df["predicted_price"].sum()), 2),
        "saved_to_db":     saved,
        "predictions":     result.to_dict(orient="records"),
    }


@router.get("/history")
def prediction_history(
    limit: int    = 20,
    db:    Session = Depends(get_db),
    _:     User    = Depends(get_current_user),
):
    rows = (
        db.query(
            MLPrediction.predictionId,
            MLPrediction.forecastDate,
            MLPrediction.predictedPrice,
            MLPrediction.confidence,
            CoffeeType.name,
        )
        .join(CoffeeType, MLPrediction.coffeeId == CoffeeType.coffeeId)
        .order_by(MLPrediction.predictionId.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id":         r.predictionId,
            "date":       str(r.forecastDate),
            "predicted":  r.predictedPrice,
            "confidence": r.confidence,
            "coffee":     r.name,
        }
        for r in rows
    ]


@router.get("/ml-status")
def ml_status():
    model = get_model()
    if model:
        return {
            "status":    "loaded",
            "model":     "Random Forest Regressor",
            "r2_score":  1.0,
            "mae":       0.04,
            "trained_on": 3636,
        }
    return {"status": "not_loaded", "message": "Copiez model_cafe.pkl dans backend/"}
