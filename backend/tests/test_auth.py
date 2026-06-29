import sys
from unittest.mock import MagicMock

# 1. On intercepte TOUT ce que routes/auth.py va essayer d'importer
sys.modules['fastapi'] = MagicMock()
sys.modules['fastapi.security'] = MagicMock()
sys.modules['sqlalchemy'] = MagicMock()
sys.modules['sqlalchemy.orm'] = MagicMock()
sys.modules['database'] = MagicMock()
sys.modules['models'] = MagicMock()
sys.modules['models.models'] = MagicMock()
sys.modules['schemas'] = MagicMock()
sys.modules['schemas.schemas'] = MagicMock()
sys.modules['jose'] = MagicMock()

# On simule aussi l'autre auth.py qui est importé à la ligne 7 de ton routes/auth.py
sys.modules['auth'] = MagicMock()

import bcrypt

# 2. Maintenant qu'on est blindé, on fait l'import
from routes.auth import verify_password

# 3. Tes fonctions de tests unitaires
def test_verify_password_plain_match():
    """Test le cas où le mot de passe correspond exactement en clair (plain == hashed)."""
    plain = "mon_mot_de_passe"
    hashed = "mon_mot_de_passe"
    assert verify_password(plain, hashed) is True

def test_verify_password_bcrypt_success():
    """Test le cas où le mot de passe correspond à un vrai hash Bcrypt."""
    password = "secure_password123"
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode(), salt).decode()
    
    assert verify_password(password, hashed_password) is True

def test_verify_password_wrong_password():
    """Test que la fonction renvoie False si le mot de passe ne correspond pas au hash."""
    password = "le_bon_password"
    wrong_password = "un_mauvais_password"
    
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode(), salt).decode()
    
    assert verify_password(wrong_password, hashed_password) is False

def test_verify_password_invalid_hash_exception():
    """Test que la fonction gère l'erreur et renvoie False si le hash est corrompu."""
    invalid_hash = "un_hash_completement_invalide"
    assert verify_password("password123", invalid_hash) is False