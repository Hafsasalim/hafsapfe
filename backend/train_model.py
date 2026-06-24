"""
Script de correction du CSV et réentraînement du modèle Random Forest
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

CSV_PATH   = r"C:\Users\hajou\Downloads\dataprj.csv"
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model_cafe.pkl")
FIXED_CSV  = r"C:\Users\hajou\Downloads\dataprj_fixed.csv"

WEEKDAY_MAP = {
    1: "Lundi",
    2: "Mardi",
    3: "Mercredi",
    4: "Jeudi",
    5: "Vendredi",
    6: "Samedi",
    7: "Dimanche",
}

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

PAYMENT_ENCODING = {"cash": 0, "card": 1}

print("=== Chargement du CSV ===")
df = pd.read_csv(CSV_PATH, sep=";")
print(f"Lignes chargées : {len(df)}")
print(f"Colonnes : {list(df.columns)}")

# ── Correction colonne money ──────────────────────────────────────────────────
print("\n=== Correction colonne money ===")
print(f"Exemples avant : {df['money'].head(3).tolist()}")

df["money"] = (
    df["money"]
    .astype(str)
    .str.replace("R", "", regex=False)
    .str.replace(",", ".", regex=False)
)
df["money"] = pd.to_numeric(df["money"], errors="coerce")
df.dropna(subset=["money"], inplace=True)

print(f"Exemples après : {df['money'].head(3).tolist()}")
print(f"Min: {df['money'].min()}, Max: {df['money'].max()}, Moyenne: {df['money'].mean():.2f}")

# ── Correction colonne Weekday ────────────────────────────────────────────────
print("\n=== Correction colonne Weekday ===")
print(f"Valeurs uniques avant : {df['Weekday'].unique().tolist()}")

df["Weekday"] = df["Weekdaysort"].map(WEEKDAY_MAP)

print(f"Valeurs uniques après : {df['Weekday'].unique().tolist()}")

# ── Sauvegarde CSV corrigé ────────────────────────────────────────────────────
df.to_csv(FIXED_CSV, sep=";", index=False)
print(f"\nCSV corrigé sauvegardé : {FIXED_CSV}")

# ── Feature engineering ───────────────────────────────────────────────────────
print("\n=== Feature engineering ===")
df["date"] = pd.to_datetime(df["date"], dayfirst=True)

df["year"]           = df["date"].dt.year
df["month"]          = df["date"].dt.month
df["day"]            = df["date"].dt.day
df["weekday"]        = df["date"].dt.dayofweek          # 0=Lundi, 6=Dimanche
df["coffee_encoded"] = df["coffee_name"].map(COFFEE_ENCODING).fillna(5).astype(int)
df["cash_encoded"]   = df["cash_type"].map(PAYMENT_ENCODING).fillna(0).astype(int)

features = ["year", "month", "day", "weekday", "hour_of_day", "coffee_encoded", "cash_encoded"]
X = df[features]
y = df["money"]

print(f"Taille dataset : {len(X)} lignes")
print(f"Features : {features}")
print(f"Distribution cible (money) :\n{y.describe()}")

# ── Entraînement ──────────────────────────────────────────────────────────────
print("\n=== Entraînement Random Forest ===")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestRegressor(
    n_estimators=200,
    max_depth=10,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1,
)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
mae    = mean_absolute_error(y_test, y_pred)
r2     = r2_score(y_test, y_pred)

print(f"MAE  : {mae:.4f}")
print(f"R²   : {r2:.4f}")

# ── Sauvegarde modèle ─────────────────────────────────────────────────────────
joblib.dump(model, MODEL_PATH)
print(f"\nModèle sauvegardé : {MODEL_PATH}")
print("=== Terminé ===")
