import pytest
import requests

BASE_URL = "http://127.0.0.1:8000/api"

def test_recuperation_liste_produits():
    """Vérifie que la liste des produits s'affiche correctement"""
    reponse = requests.get(f"{BASE_URL}/products")
    
    assert reponse.status_code == 200
    assert isinstance(reponse.json(), list), "La réponse devrait être une liste JSON"

def test_creation_produit_reussie():
    """Vérifie qu'on peut ajouter un nouveau produit avec des données valides"""
    nouveau_produit = {
        "name": "Produit Test",
        "price": 150,
        "description": "Ceci est un produit de test unitaire"
    }
    
    reponse = requests.post(f"{BASE_URL}/products", json=nouveau_produit)
    
    assert reponse.status_code == 201 
    json_data = reponse.json()
    assert json_data["name"] == "Produit Test"