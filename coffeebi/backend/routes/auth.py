"""Route authentification — POST /api/auth/login"""
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from database import get_db
from models.models import User
from schemas.schemas import LoginRequest, TokenResponse
from auth import create_access_token, get_current_user
import bcrypt

router = APIRouter()

def verify_password(plain: str, hashed: str) -> bool:
    # Supporte mot de passe en clair ET hashé avec bcrypt
    if plain == hashed:
        return True
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False

@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower().strip()).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Identifiants incorrects")

    token = create_access_token({"sub": str(user.user_id), "role": user.role})
    return {
        "access_token": token,
        "token_type":   "bearer",
        "user": {"id": user.user_id, "name": user.name, "email": user.email, "role": user.role}
    }


@router.options("/login")
def login_options():
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Authorization,Content-Type",
        "Access-Control-Max-Age": "600",
    }
    return Response(status_code=200, headers=headers)

@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.user_id, "name": current_user.name,
            "email": current_user.email, "role": current_user.role}
