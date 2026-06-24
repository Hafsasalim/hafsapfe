"""
Modèles SQLAlchemy — alignés avec le diagramme de classes UML
Tables : user, coffeetype, client, paymentmode, coffeesale, mlprediction, report
"""
from sqlalchemy import Column, Integer, String, Date, Float, DateTime, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class User(Base):
    __tablename__ = "user"

    userId   = Column(Integer, primary_key=True, index=True)
    name     = Column(String(100), nullable=False)
    email    = Column(String(150), unique=True, nullable=False)
    password = Column(String(255), nullable=False)

    reports = relationship("Report", back_populates="generator")


class CoffeeType(Base):
    __tablename__ = "coffeetype"

    coffeeId  = Column(Integer, primary_key=True, index=True)
    name      = Column(String(100), nullable=False)
    category  = Column(String(50))
    basePrice = Column(Float)

    sales       = relationship("CoffeeSale", back_populates="coffeetype")
    predictions = relationship("MLPrediction", back_populates="coffeetype")


class Client(Base):
    __tablename__ = "client"

    clientId    = Column(Integer, primary_key=True, index=True)
    codeAnonyme = Column(String(100), unique=True)

    sales = relationship("CoffeeSale", back_populates="client")


class PaymentMode(Base):
    __tablename__ = "paymentmode"

    paymentId = Column(Integer, primary_key=True, index=True)
    type      = Column(Enum("card", "cash"), nullable=False)

    sales = relationship("CoffeeSale", back_populates="payment")


class CoffeeSale(Base):
    __tablename__ = "coffeesale"

    saleId       = Column(Integer, primary_key=True, index=True)
    saleDate     = Column(Date, nullable=False)
    hour         = Column(Integer, nullable=False)
    amount       = Column(Float, nullable=False)
    coffeeId     = Column(Integer, ForeignKey("coffeetype.coffeeId"), nullable=False)
    paymentId    = Column(Integer, ForeignKey("paymentmode.paymentId"))
    clientId     = Column(Integer, ForeignKey("client.clientId"))
    time_of_day  = Column(String(20))
    month_name   = Column(String(20))
    month_sort   = Column(Integer)
    weekday_sort = Column(Integer)

    coffeetype = relationship("CoffeeType", back_populates="sales")
    payment    = relationship("PaymentMode", back_populates="sales")
    client     = relationship("Client",      back_populates="sales")
    prediction = relationship("MLPrediction", back_populates="sale", uselist=False)


class MLPrediction(Base):
    __tablename__ = "mlprediction"

    predictionId   = Column(Integer, primary_key=True, index=True)
    forecastDate   = Column(Date, nullable=False)
    predictedPrice = Column(Float, nullable=False)
    confidence     = Column(Float)
    coffeeId       = Column(Integer, ForeignKey("coffeetype.coffeeId"), nullable=False)
    saleId         = Column(Integer, ForeignKey("coffeesale.saleId"))

    coffeetype = relationship("CoffeeType", back_populates="predictions")
    sale       = relationship("CoffeeSale", back_populates="prediction")


class Report(Base):
    __tablename__ = "report"

    reportId    = Column(Integer, primary_key=True, index=True)
    period      = Column(String(50), nullable=False)
    totalSales  = Column(Float, nullable=False)
    generatedBy = Column(Integer, ForeignKey("user.userId"))
    created_at  = Column(DateTime, default=datetime.utcnow)
    notes       = Column(Text)

    generator = relationship("User", back_populates="reports")
