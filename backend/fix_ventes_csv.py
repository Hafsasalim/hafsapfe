import pandas as pd
from database import SessionLocal
from sqlalchemy import text

CSV_PATH = r"C:\Users\hajou\Downloads\dataprj.csv"

df = pd.read_csv(CSV_PATH, sep=";")
print(f"Lignes CSV : {len(df)}")
print(f"money exemple : {df['money'].head(3).tolist()}")
print(f"Weekday exemple : {df['Weekday'].head(3).tolist()}")

db = SessionLocal()

db.execute(text("TRUNCATE TABLE ventes_csv"))
db.commit()
print("Table ventes_csv videe")

inserted = 0
for _, row in df.iterrows():
    db.execute(text("""
        INSERT INTO ventes_csv
        (date, datetime, hour_of_day, cash_type, card, money, coffee_name, Time_of_Day, Weekday, Month_name, Weekdaysort, Monthsort)
        VALUES (:date, :datetime, :hour_of_day, :cash_type, :card, :money, :coffee_name, :Time_of_Day, :Weekday, :Month_name, :Weekdaysort, :Monthsort)
    """), {
        "date":        str(row["date"]),
        "datetime":    str(row["datetime"]),
        "hour_of_day": int(row["hour_of_day"]),
        "cash_type":   str(row["cash_type"]),
        "card":        str(row.get("card", "")),
        "money":       float(row["money"]),
        "coffee_name": str(row["coffee_name"]),
        "Time_of_Day": str(row.get("Time_of_Day", "")),
        "Weekday":     str(row["Weekday"]),
        "Month_name":  str(row.get("Month_name", "")),
        "Weekdaysort": int(row["Weekdaysort"]),
        "Monthsort":   int(row["Monthsort"]),
    })
    inserted += 1
    if inserted % 500 == 0:
        db.commit()
        print(f"  {inserted} lignes inserees...")

db.commit()

result = db.execute(text("SELECT COUNT(*), MIN(money), MAX(money), AVG(money) FROM ventes_csv"))
row = result.fetchone()
print(f"Total : {row[0]}, min={row[1]}, max={row[2]}, avg={round(float(row[3]),2)}")

result2 = db.execute(text("SELECT DISTINCT Weekday FROM ventes_csv"))
print(f"Weekday distincts : {[r[0] for r in result2]}")

db.close()
print("Termine!")
