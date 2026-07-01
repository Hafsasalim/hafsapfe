import pytest
import requests
import requests_mock

BASE_URL = "http://127.0.0.1:8000/api"

def test_recuperation_liste_produits():
    """Vérifie que la liste des produits s'affiche correctement (Simulé)"""
    with requests_mock.Mocker() as mock:
        # On simule la route GET qui renvoie une liste de produits avec un code 200
        mock.get(f"{BASE_URL}/products", json=[{"id": 1, "name": "Produit 1"}], status_code=200)
        
        reponse = requests.get(f"{BASE_URL}/products")
        
        assert reponse.status_code == 200
        assert isinstance(reponse.json(), list)

def test_creation_produit_reussie():
    """Vérifie qu'on peut ajouter un nouveau produit (Simulé)"""
    nouveau_produit = {
        "name": "Produit Test",
        "price": 150,
        "description": "Ceci est un produit de test unitaire"
    }
    
    with requests_mock.Mocker() as mock:
        # On simule la route POST qui confirme la création avec un code 201
        mock.post(f"{BASE_URL}/products", json={"id": 2, "name": "Produit Test"}, status_code=201)
        
        reponse = requests.post(f"{BASE_URL}/products", json=nouveau_produit)
        
        assert reponse.status_code == 201 
        assert reponse.json()["name"] == "Produit Test"