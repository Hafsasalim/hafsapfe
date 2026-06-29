"""
CoffeeBI - Backend FastAPI
Abdelhadi Sahba — Groupe PT47 — ISMONTIC Tanger 2025
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
from routes import auth, dashboard, sales, predictions, clients, products, reports
from auth import migrate_legacy_passwords

Base.metadata.create_all(bind=engine)

# Migrate any legacy plain-text passwords to bcrypt on startup
with SessionLocal() as db:
    migrated = migrate_legacy_passwords(db)
    if migrated:
        print(f"Migrated {migrated} legacy user password(s) to bcrypt hashes.")

app = FastAPI(
    title="CoffeeBI API",
    description="API REST pour le Dashboard BI - Coffee Shop",
    version="1.0.0"
)

# Liste des serveurs frontend autorisés à interroger l'API
origins = [
    "http://localhost:3000",  # Ancien port React standard
    "http://localhost:5173",  # Nouveau port standard (Vite.js)
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # Utilise notre liste élargie
    allow_credentials=True,
    allow_methods=["*"],          # Autorise explicitement GET, POST, OPTIONS, etc.
    allow_headers=["*"],          # Autorise tous les headers (Content-Type, Authorization...)
)

app.include_router(auth.router,         prefix="/api/auth",        tags=["Authentification"])
app.include_router(dashboard.router,   prefix="/api/dashboard",   tags=["Dashboard KPIs"])
app.include_router(sales.router,       prefix="/api/sales",       tags=["Ventes"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["Prédictions ML"])
app.include_router(clients.router,     prefix="/api/clients",     tags=["Clients"])
app.include_router(products.router,     prefix="/api/products",    tags=["Produits"])
app.include_router(reports.router,     prefix="/api/reports",     tags=["Rapports"])

@app.get("/")
def root():
    return {"message": "CoffeeBI API v1.0 — Dashboard BI Coffee Shop", "docs": "/docs"}