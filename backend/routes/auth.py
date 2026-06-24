"""Route authentification — POST /api/auth/login"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.models import User
from schemas.schemas import LoginRequest, TokenResponse
from auth import create_access_token, get_current_user
import bcrypt

router = APIRouter()

def verify_password(plain: str, hashed: str) -> bool:
    if plain == hashed:
        return True
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False

@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower().strip()).first()
    if not user or not verify_password(body.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Identifiants incorrects")

    token = create_access_token({"sub": str(user.userId)})
    return {
        "access_token": token,
        "token_type":   "bearer",
        "user": {"id": user.userId, "name": user.name, "email": user.email}
    }

@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.userId, "name": current_user.name, "email": current_user.email}
