"""
Utilitaires JWT — Abdelhadi Sahba
"""
from datetime import datetime, timedelta
from typing import Optional
import os
import calendar

try:
    from jose import JWTError, jwt
except ImportError:
    raise RuntimeError("python-jose not installed. Required for JWT authentication.")

try:
    import bcrypt
except ImportError:
    raise RuntimeError("bcrypt not installed. Required for password hashing.")

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from models.models import User
from database import SessionLocal

SECRET_KEY  = os.getenv("SECRET_KEY", "coffeebi-secret-2025-ismontic")
ALGORITHM   = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

security = HTTPBearer()


def hash_password(password: str) -> str:
    if not password:
        raise ValueError("Password cannot be empty")
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, stored_password: str) -> bool:
    """Verify a plain password against a stored value.

    If `stored_password` looks like a bcrypt hash (starts with $2b$), use bcrypt.checkpw.
    Otherwise, fall back to plain equality to support legacy data.
    """
    if not plain_password or not stored_password:
        return False
    try:
        if stored_password.startswith("$2b$"):
            return bcrypt.checkpw(plain_password.encode("utf-8"), stored_password.encode("utf-8"))
        return plain_password == stored_password
    except Exception:
        return False


def migrate_legacy_passwords(db: Session) -> int:
    """Migrate any plain-text passwords to bcrypt hashes.

    Returns the number of migrated users.
    """
    migrated = 0
    users = db.query(User).all()
    for u in users:
        if not u.password:
            continue
        if u.password.startswith("$2b$"):
            continue
        u.password = hash_password(u.password)
        migrated += 1
    if migrated:
        db.commit()
    return migrated

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire    = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    # Convert UTC datetime to Unix timestamp using calendar.timegm
    to_encode.update({"exp": calendar.timegm(expire.utctimetuple())})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token   = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide ou expiré")
    user = db.query(User).filter(User.userId == int(payload.get("sub", 0))).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilisateur introuvable")
    return user
