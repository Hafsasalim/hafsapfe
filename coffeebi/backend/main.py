"""
CoffeeBI - Backend FastAPI
Abdelhadi Sahba — Groupe PT47 — ISMONTIC Tanger 2025
"""
from fastapi import FastAPI
import logging

# Configure logging to avoid noisy default root logger messages
logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(name)s: %(message)s'
)
# Reduce verbosity of some noisy libraries if needed
logging.getLogger('charset_normalizer').setLevel(logging.WARNING)
logging.getLogger('uvicorn.access').setLevel(logging.INFO)
logging.getLogger('uvicorn.error').setLevel(logging.INFO)
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routes import auth, dashboard, sales, predictions, clients, products, reports

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CoffeeBI API",
    description="API REST pour le Dashboard BI - Coffee Shop",
    version="1.0.0"
)

# Liste des serveurs frontend autorisés à interroger l'API
origins = [
    "http://localhost:3000",  # Ancien port React standard
    "http://localhost:5173",  # Nouveau port standard (Vite.js)
    "http://localhost:3001",  # Frontend auto-chosen port (dev)
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # Dev: allow all origins to avoid CORS issues
    allow_credentials=False,
    allow_methods=["*"],          # Autorise explicitement GET, POST, OPTIONS, etc.
    allow_headers=["*"],          # Autorise tous les headers (Content-Type, Authorization...)
)

# Dev fallback: ensure CORS headers are always present for requests with Origin
from fastapi import Request
from starlette.responses import Response


@app.middleware("http")
async def dev_cors_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        headers = {
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
            "Access-Control-Allow-Headers": "Authorization,Content-Type",
            "Access-Control-Max-Age": "600",
        }
        return Response(status_code=200, headers=headers)

    response = await call_next(request)
    origin = request.headers.get("origin")
    if origin:
        response.headers.setdefault("Access-Control-Allow-Origin", origin)
    return response

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