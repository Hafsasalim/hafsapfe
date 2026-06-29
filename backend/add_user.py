"""
Add users to the database interactively
Usage: python add_user.py
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from database import SessionLocal
    from models.models import User
    from auth import hash_password
except ModuleNotFoundError as e:
    print(f"❌ Missing dependency: {e}")
    print("\n⚠️  This script requires the backend dependencies to be installed.")
    print("   Please run: pip install -r requirements.txt")
    print("   Or use Python 3.11: py -3.11 -m pip install -r requirements.txt")
    sys.exit(1)

def add_user():
    """Add a new user to the database"""
    db = SessionLocal()
    
    try:
        print("=== Add New User ===\n")
        
        # Get user input
        name = input("Enter user name: ").strip()
        if not name:
            print("❌ Name cannot be empty!")
            return
        
        email = input("Enter email: ").strip().lower()
        if not email:
            print("❌ Email cannot be empty!")
            return
        
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"❌ User with email '{email}' already exists!")
            return
        
        password = input("Enter password: ").strip()
        if not password:
            print("❌ Password cannot be empty!")
            return
        
        if len(password) < 6:
            print("❌ Password must be at least 6 characters!")
            return
        
        # Hash the password and create the user
        hashed_password = hash_password(password)
        new_user = User(name=name, email=email, password=hashed_password)
        
        db.add(new_user)
        db.commit()
        
        print(f"\n✅ User '{name}' ({email}) added successfully!")
        print(f"   Password: {password}")
        print(f"   Hashed: {hashed_password[:50]}...")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()

def list_users():
    """List all users in the database"""
    db = SessionLocal()
    
    try:
        users = db.query(User).all()
        
        if not users:
            print("No users found in database.")
            return
        
        print("\n=== Users in Database ===")
        for u in users:
            print(f"ID: {u.userId} | Name: {u.name} | Email: {u.email}")
        
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--list":
        list_users()
    else:
        add_user()
