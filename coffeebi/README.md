# CoffeeBI — Dashboard BI avec Prédiction des Ventes
## Groupe PT47 — ISMONTIC Tanger — PFE 2025
### Abdelhadi Sahba (Backend FastAPI) · Hafsa Salim (Frontend React)

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18, React Router v6, Chart.js 4, Axios, CSS Variables |
| Backend | **FastAPI** (Python 3), SQLAlchemy ORM, Pydantic v2, JWT (python-jose) |
| Base de données | **MySQL 8** — base `coffee_bi` existante |
| ML | Flask + scikit-learn (Random Forest) — service séparé port 5001 |

---

## Structure du projet

```
coffeebi/
├── backend/                        ← Abdelhadi Sahba
│   ├── main.py                     # Point d'entrée FastAPI
│   ├── database.py                 # Connexion MySQL + get_db()
│   ├── auth.py                     # JWT : create_token, verify_token, get_current_user
│   ├── models/models.py            # SQLAlchemy : User, Cafe, Client, PaymentMode,
│   │                               #   CoffeeSale, MLPrediction, Report
│   ├── schemas/schemas.py          # Pydantic : validation I/O
│   ├── routes/
│   │   ├── auth.py        POST /api/auth/login, GET /api/auth/me
│   │   ├── dashboard.py   GET /api/dashboard/kpis|monthly|by-hour|by-category|by-payment|top-products
│   │   ├── sales.py       GET /api/sales/ (pagination + filtres)
│   │   ├── predictions.py POST /api/predictions/predict, GET /api/predictions/history
│   │   ├── clients.py     GET /api/clients/
│   │   ├── products.py    GET /api/products/
│   │   └── reports.py     GET/POST /api/reports/
│   ├── requirements.txt
│   └── .env
│
└── frontend/                       ← Hafsa Salim
    ├── src/
    │   ├── App.jsx                 # Router + AuthProvider
    │   ├── context/AuthContext.jsx # JWT state management
    │   ├── services/
    │   │   ├── api.js             # Axios instance + interceptors
    │   │   └── coffeeService.js   # Tous les appels API + mock fallback
    │   ├── hooks/useData.js        # Hooks personnalisés (useFetch, useKPIs...)
    │   ├── utils/helpers.js        # fmt, fmtN, CAT_COLORS, chartBase
    │   ├── components/
    │   │   ├── Layout.jsx          # Sidebar + Topbar + Outlet
    │   │   ├── Sidebar.jsx         # Navigation latérale thème café
    │   │   ├── Topbar.jsx          # Barre supérieure
    │   │   └── PrivateRoute.jsx    # Protection routes JWT
    │   └── pages/
    │       ├── Login.jsx           # Connexion (admin@coffeebi.com / admin123)
    │       ├── Dashboard.jsx       # 4 KPIs + 4 graphiques Chart.js
    │       ├── Ventes.jsx          # Table paginée coffee_sales × cafe × payment_mode
    │       ├── Produits.jsx        # Grid café × stats ventes (JOIN)
    │       ├── Clients.jsx         # Table client × coffee_sales (JOIN anonymisé)
    │       ├── Predictions.jsx     # Formulaire ML + historique graphique
    │       └── Rapports.jsx        # Génération rapports par période
    └── .env
```

---

## Installation — Windows PowerShell

### Prérequis
- Python 3.10+
- Node.js 18+
- MySQL 8 avec la base `coffee_bi` importée

### 1. Backend FastAPI (Abdelhadi)

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

✅ API disponible sur : http://localhost:8000  
✅ Documentation Swagger : http://localhost:8000/docs  
✅ Documentation ReDoc : http://localhost:8000/redoc

### 2. Frontend React (Hafsa)

```powershell
cd frontend
npm install
npm start
```

✅ Dashboard disponible sur : http://localhost:3000

---

## Comptes de connexion (depuis coffee_bi.users)

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@coffeebi.com | admin123 | admin |
| manager@coffeebi.com | manager123 | manager |

---

## Endpoints API principaux

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/login` | Connexion → JWT token |
| GET | `/api/auth/me` | Profil utilisateur |
| GET | `/api/dashboard/kpis` | KPIs : CA, ventes, panier moyen, best day/product |
| GET | `/api/dashboard/monthly` | Ventes par mois |
| GET | `/api/dashboard/by-hour` | Ventes par heure |
| GET | `/api/dashboard/by-category` | Répartition catégories café |
| GET | `/api/dashboard/by-payment` | Cash vs Card |
| GET | `/api/dashboard/top-products` | Top 5 cafés |
| GET | `/api/sales/` | Transactions paginées + filtres |
| POST | `/api/predictions/predict` | Prédire prix d'une vente ML |
| GET | `/api/predictions/history` | Historique prédictions |
| GET | `/api/clients/` | Liste clients anonymisés |
| GET | `/api/products/` | Catalogue cafés |
| GET | `/api/reports/` | Rapports BI |
| POST | `/api/reports/generate` | Générer un rapport |

Toutes les routes (sauf `/api/auth/login`) requièrent :  
`Authorization: Bearer <token>`

---

## Jointures SQL utilisées (via SQLAlchemy ORM)

```
coffee_sales ──JOIN──> cafe          (coffee_id → id_cafe)
coffee_sales ──JOIN──> payment_mode  (payment_id → payment_id)
coffee_sales ──JOIN──> client        (client_id → id_client)
ml_predictions ──JOIN──> cafe        (coffee_id → id_cafe)
reports ──JOIN──> users              (generated_by → user_id)
```

---

*Groupe PT47 — Dashboard BI Coffee Shop — ISMONTIC Tanger — PFE 2025*
