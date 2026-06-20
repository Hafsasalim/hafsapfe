from database import SessionLocal
from models.models import User
import bcrypt

email='admin@coffeebi.com'
name='Administrator'
password='admin123'

db=SessionLocal()
try:
    existing=db.query(User).filter(User.email==email).first()
    if existing:
        print('User already exists:', existing.email)
    else:
        hashed=bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        u=User(name=name,email=email,role='admin',password_hash=hashed)
        db.add(u)
        db.commit()
        print('Created user', email)
finally:
    db.close()
