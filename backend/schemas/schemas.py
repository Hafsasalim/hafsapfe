"""
Schémas Pydantic — Validation des données entrantes/sortantes
Abdelhadi Sahba
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime


# ── Auth ──────────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email:    str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         dict  # {id, name, email}


# ── Cafe (Produit) ────────────────────────────────────────────────────────────
class CafeOut(BaseModel):
    id_cafe:   int
    nom_cafe:  str
    categorie: Optional[str]
    prix_base: Optional[float]

    class Config:
        from_attributes = True


# ── Vente ─────────────────────────────────────────────────────────────────────
class SaleOut(BaseModel):
    sale_id:     int
    sale_date:   date
    hour:        int
    amount:      float
    time_of_day: Optional[str]
    month_name:  Optional[str]
    nom_cafe:    Optional[str]
    categorie:   Optional[str]
    payment_type:Optional[str]

    class Config:
        from_attributes = True


# ── Prédiction ────────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    coffee_id:  int
    hour:       int
    sale_date:  str          # "YYYY-MM-DD"
    payment_id: int

class PredictResponse(BaseModel):
    predicted_price: float
    confidence:      float
    coffee_name:     str
    payment_type:    str

class PredictionOut(BaseModel):
    prediction_id:   int
    forecast_date:   date
    predicted_price: float
    confidence:      Optional[float]
    nom_cafe:        Optional[str]

    class Config:
        from_attributes = True


# ── KPIs Dashboard ────────────────────────────────────────────────────────────
class KPIResponse(BaseModel):
    total_revenue:   float
    total_sales:     int
    avg_basket:      float
    best_day:        str
    best_product:    str
    best_category:   str

class MonthlyData(BaseModel):
    month:  str
    revenue:float
    count:  int

class HourlyData(BaseModel):
    hour:   int
    count:  int
    revenue:float

class CategoryData(BaseModel):
    name:  str
    value: float
    count: int

class PaymentData(BaseModel):
    type:  str
    count: int
    pct:   float


# ── Rapport ───────────────────────────────────────────────────────────────────
class ReportCreate(BaseModel):
    period: str
    notes:  Optional[str] = ""

class ReportOut(BaseModel):
    report_id:   int
    period:      str
    total_sales: float
    created_at:  datetime
    notes:       Optional[str]

    class Config:
        from_attributes = True
