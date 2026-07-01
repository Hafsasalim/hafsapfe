import pytest
from unittest.mock import MagicMock, patch
import sys

# On mocke la base de données pour éviter que le script tente de s'y connecter
sys.modules['database'] = MagicMock()
sys.modules['sqlalchemy'] = MagicMock()

# Mettons que ton script possède une fonction qui nettoie les données d'une ligne CSV
# Si ta fonction s'appelle différemment, tu pourras adapter le nom de l'import
def nettoyer_ligne_csv(ligne):
    """Exemple de logique interne : on nettoie les espaces et on convertit le prix"""
    return {
        "name": ligne[0].strip(),
        "price": float(ligne[1]),
        "quantity": int(ligne[2])
    }

# --- TES FONCTIONS DE TEST ---

def test_nettoyer_ligne_csv_valide():
    """Vérifie que la conversion d'une ligne CSV brute se fait correctement."""
    ligne_brute = ["  Ordinateur Portable  ", "1250.50", "10"]
    
    donnees_nettoyees = nettoyer_ligne_csv(ligne_brute)
    
    # Assertions pour vérifier le nettoyage
    assert donnees_nettoyees["name"] == "Ordinateur Portable"  # Les espaces ont disparu
    assert donnees_nettoyees["price"] == 1250.50             # C'est devenu un float
    assert donnees_nettoyees["quantity"] == 10                # C'est devenu un entier

def test_nettoyer_ligne_csv_erreur_prix():
    """Vérifie que le script lève bien une erreur si le prix n'est pas un nombre."""
    ligne_corrompue = ["Souris", "GRATUIT", "5"]
    
    # On s'attend à ce que la conversion en float de "GRATUIT" lève une ValueError
    with pytest.raises(ValueError):
        nettoyer_ligne_csv(ligne_corrompue)