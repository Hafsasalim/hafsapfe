"""
Import des données du CSV corrigé dans la base de données
"""
import pandas as pd
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal
from models.models import CoffeeType, PaymentMode, Client, CoffeeSale, MLPrediction

CSV_PATH = r"C:\Users\hajou\Downloads\dataprj_fixed.csv"

# Prix de base par type de café (médiane des ventes)
COFFEE_INFO = {
    "Americano":           {"category": "Classique",  "basePrice": 28.90},
    "Americano with Milk": {"category": "Classique",  "basePrice": 33.80},
    "Cappuccino":          {"category": "Lait",        "basePrice": 35.76},
    "Cocoa":               {"category": "Chocolat",    "basePrice": 38.70},
    "Cortado":             {"category": "Classique",   "basePrice": 27.92},
    "Espresso":            {"category": "Classique",   "basePrice": 18.12},
    "Hot Chocolate":       {"category": "Chocolat",    "basePrice": 38.70},
    "Latte":               {"category": "Lait",        "basePrice": 38.70},
}

db = SessionLocal()

try:
    # ── 1. Vider les tables (ordre FK) ────────────────────────────────────────
    print("=== Vidage des tables ===")
    deleted_pred = db.query(MLPrediction).delete()
    deleted_sale = db.query(CoffeeSale).delete()
    deleted_cli  = db.query(Client).delete()
    db.commit()
    print(f"  MLPrediction supprimées : {deleted_pred}")
    print(f"  CoffeeSale supprimées   : {deleted_sale}")
    print(f"  Clients supprimés       : {deleted_cli}")

    # ── 2. Synchroniser les types de café ─────────────────────────────────────
    print("\n=== Synchronisation des types de café ===")
    # Supprimer les anciens cafés qui ne sont pas dans le CSV
    existing = db.query(CoffeeType).all()
    for c in existing:
        if c.name not in COFFEE_INFO:
            db.delete(c)
            print(f"  Supprimé : {c.name}")
    db.commit()

    # Ajouter/mettre à jour les cafés du CSV
    coffee_id_map = {}
    for name, info in COFFEE_INFO.items():
        cafe = db.query(CoffeeType).filter(CoffeeType.name == name).first()
        if not cafe:
            cafe = CoffeeType(name=name, category=info["category"], basePrice=info["basePrice"])
            db.add(cafe)
            db.flush()
            print(f"  Ajouté   : {name} (id={cafe.coffeeId})")
        else:
            cafe.category  = info["category"]
            cafe.basePrice = info["basePrice"]
            print(f"  Existant : {name} (id={cafe.coffeeId})")
        coffee_id_map[name] = cafe.coffeeId
    db.commit()

    # ── 3. S'assurer que les modes de paiement existent ───────────────────────
    for ptype in ["cash", "card"]:
        p = db.query(PaymentMode).filter(PaymentMode.type == ptype).first()
        if not p:
            db.add(PaymentMode(type=ptype))
    db.commit()

    payment_map = {p.type: p.paymentId for p in db.query(PaymentMode).all()}
    print(f"\n=== Modes de paiement : {payment_map} ===")

    # ── 4. Charger le CSV corrigé ─────────────────────────────────────────────
    print("\n=== Chargement du CSV ===")
    df = pd.read_csv(CSV_PATH, sep=";")
    df["date"] = pd.to_datetime(df["date"], dayfirst=True)
    print(f"  Lignes : {len(df)}")

    # ── 5. Importer chaque ligne ──────────────────────────────────────────────
    print("\n=== Import des ventes ===")
    saved   = 0
    errors  = 0
    client_cache = {}

    for idx, row in df.iterrows():
        try:
            # Client
            code = str(row.get("card", "ANON-IMPORT"))
            if code not in client_cache:
                client = Client(codeAnonyme=code)
                db.add(client)
                db.flush()
                client_cache[code] = client.clientId
            client_id = client_cache[code]

            # IDs
            coffee_id  = coffee_id_map.get(row["coffee_name"], list(coffee_id_map.values())[0])
            payment_id = payment_map.get(str(row.get("cash_type", "cash")), 1)

            sale = CoffeeSale(
                saleDate     = row["date"].date(),
                hour         = int(row["hour_of_day"]),
                amount       = float(row["money"]),
                coffeeId     = coffee_id,
                paymentId    = payment_id,
                clientId     = client_id,
                time_of_day  = str(row.get("Time_of_Day", "")),
                month_name   = str(row.get("Month_name", "")),
                month_sort   = int(row.get("Monthsort", 0)),
                weekday_sort = int(row.get("Weekdaysort", 0)),
            )
            db.add(sale)
            saved += 1

            if saved % 500 == 0:
                db.flush()
                print(f"  {saved} lignes importées...")

        except Exception as e:
            errors += 1
            print(f"  Erreur ligne {idx}: {e}")
            continue

    db.commit()
    print(f"\n=== Import terminé ===")
    print(f"  Ventes importées : {saved}")
    print(f"  Erreurs          : {errors}")

    # ── 6. Vérification finale ────────────────────────────────────────────────
    from sqlalchemy import func
    total  = db.query(func.count(CoffeeSale.saleId)).scalar()
    avg    = db.query(func.avg(CoffeeSale.amount)).scalar()
    mn     = db.query(func.min(CoffeeSale.amount)).scalar()
    mx     = db.query(func.max(CoffeeSale.amount)).scalar()
    print(f"\n=== Vérification DB ===")
    print(f"  Total ventes : {total}")
    print(f"  Montant min  : {mn}")
    print(f"  Montant max  : {mx}")
    print(f"  Montant moy  : {round(avg, 2) if avg else None}")

except Exception as e:
    db.rollback()
    print(f"ERREUR FATALE : {e}")
    raise
finally:
    db.close()
