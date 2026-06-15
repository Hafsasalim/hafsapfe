"""
Modèles SQLAlchemy — correspondant exactement à la BDD coffee_bi existante
Tables : users, cafe, client, payment_mode, coffee_sales, ml_predictions, reports
"""
from sqlalchemy import Column, Integer, String, Date, Float, DateTime, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    user_id       = Column(Integer, primary_key=True, index=True)
    name          = Column(String(100), nullable=False)
    email         = Column(String(150), unique=True, nullable=False)
    role          = Column(Enum("admin", "manager"), default="manager")
    password_hash = Column(String(255), nullable=False)

    reports = relationship("Report", back_populates="generator")


class Cafe(Base):
    __tablename__ = "cafe"

    id_cafe    = Column(Integer, primary_key=True, index=True)
    nom_cafe   = Column(String(100), nullable=False)
    categorie  = Column(String(50))
    prix_base  = Column(Float)

    sales       = relationship("CoffeeSale", back_populates="cafe")
    predictions = relationship("MLPrediction", back_populates="cafe")


class Client(Base):
    __tablename__ = "client"

    id_client    = Column(Integer, primary_key=True, index=True)
    code_anonyme = Column(String(100), unique=True)

    sales = relationship("CoffeeSale", back_populates="client")


class PaymentMode(Base):
    __tablename__ = "payment_mode"

    payment_id = Column(Integer, primary_key=True, index=True)
    type       = Column(Enum("card", "cash"), nullable=False)

    sales = relationship("CoffeeSale", back_populates="payment")


class CoffeeSale(Base):
    __tablename__ = "coffee_sales"

    sale_id      = Column(Integer, primary_key=True, index=True)
    sale_date    = Column(Date, nullable=False)
    hour         = Column(Integer, nullable=False)
    amount       = Column(Float, nullable=False)
    coffee_id    = Column(Integer, ForeignKey("cafe.id_cafe"), nullable=False)
    payment_id   = Column(Integer, ForeignKey("payment_mode.payment_id"))
    client_id    = Column(Integer, ForeignKey("client.id_client"))
    time_of_day  = Column(String(20))
    month_name   = Column(String(20))
    month_sort   = Column(Integer)
    weekday_sort = Column(Integer)

    cafe       = relationship("Cafe",        back_populates="sales")
    payment    = relationship("PaymentMode", back_populates="sales")
    client     = relationship("Client",      back_populates="sales")
    prediction = relationship("MLPrediction", back_populates="sale", uselist=False)


class MLPrediction(Base):
    __tablename__ = "ml_predictions"

    prediction_id   = Column(Integer, primary_key=True, index=True)
    forecast_date   = Column(Date, nullable=False)
    predicted_price = Column(Float, nullable=False)
    confidence      = Column(Float)
    coffee_id       = Column(Integer, ForeignKey("cafe.id_cafe"), nullable=False)
    sale_id         = Column(Integer, ForeignKey("coffee_sales.sale_id"))

    cafe = relationship("Cafe",       back_populates="predictions")
    sale = relationship("CoffeeSale", back_populates="prediction")


class Report(Base):
    __tablename__ = "reports"

    report_id    = Column(Integer, primary_key=True, index=True)
    period       = Column(String(50), nullable=False)
    total_sales  = Column(Float, nullable=False)
    generated_by = Column(Integer, ForeignKey("users.user_id"))
    created_at   = Column(DateTime, default=datetime.utcnow)
    notes        = Column(Text)

    generator = relationship("User", back_populates="reports")
