import os
from datetime import date

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from database import Base, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME, engine, SessionLocal
from models.models import CoffeeSale, CoffeeType, Client, MLPrediction, PaymentMode, Report, User
from auth import hash_password

load_dotenv()


def get_server_url() -> str:
    if DB_PASSWORD:
        auth = f"{DB_USER}:{DB_PASSWORD}"
    else:
        auth = DB_USER
    return f"mysql+pymysql://{auth}@{DB_HOST}:{DB_PORT}/"


def create_database_if_missing() -> None:
    server_engine = create_engine(get_server_url(), pool_pre_ping=True)
    try:
        with server_engine.begin() as conn:
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
        print(f"Database '{DB_NAME}' exists or was created.")
    except OperationalError as exc:
        raise RuntimeError(
            "Unable to connect to MySQL server. Verify DB_USER, DB_PASSWORD, DB_HOST, DB_PORT and that MySQL is running."
        ) from exc
    finally:
        server_engine.dispose()


def seed_data(db: Session) -> None:
    print("Clearing user data...")
    # Disable foreign key checks to allow deletion
    db.execute(text("SET FOREIGN_KEY_CHECKS=0"))
    db.query(User).delete()
    # Re-enable foreign key checks
    db.execute(text("SET FOREIGN_KEY_CHECKS=1"))
    db.commit()

    print("Seeding users...")
    users = [
        User(name="Admin", email="admin@coffeeai.com", password=hash_password("admin123")),
        User(name="Manager", email="manager@coffeeai.com", password=hash_password("manager123")),
    ]
    db.add_all(users)
    db.commit()

    print("User seed data inserted successfully.")


def main() -> None:
    print(f"Using database '{DB_NAME}' on host '{DB_HOST}:{DB_PORT}'")
    # Database must already exist - will not create it
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        seed_data(db)

    print("Done.")


if __name__ == "__main__":
    main()
