"""Route authentification — POST /api/auth/login"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.models import User
from schemas.schemas import LoginRequest, TokenResponse
from auth import create_access_token, get_current_user, verify_password, hash_password

router = APIRouter()

@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower().strip()).first()
    if not user or not verify_password(body.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Identifiants incorrects")
    # If the stored password was plain-text (legacy), hash it now
    if not user.password.startswith("$2b$"):
        user.password = hash_password(body.password)
        db.add(user)
        db.commit()

    token = create_access_token({"sub": str(user.userId)})
    return {
        "access_token": token,
        "token_type":   "bearer",
        "user": {"id": user.userId, "name": user.name, "email": user.email}
    }

@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.userId, "name": current_user.name, "email": current_user.email}
