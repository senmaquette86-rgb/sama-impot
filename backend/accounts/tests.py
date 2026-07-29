from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

Utilisateur = get_user_model()


class InscriptionTests(APITestCase):
    def test_inscription_reussie(self):
        url = reverse("inscription")
        data = {
            "email": "test@example.sn",
            "first_name": "Test",
            "last_name": "Utilisateur",
            "password": "MotDePasse@2025",
            "password2": "MotDePasse@2025",
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Utilisateur.objects.filter(email="test@example.sn").exists())

    def test_inscription_mots_de_passe_differents(self):
        url = reverse("inscription")
        data = {
            "email": "test2@example.sn",
            "first_name": "Test",
            "last_name": "Utilisateur",
            "password": "MotDePasse@2025",
            "password2": "Autre@2025",
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_inscription_email_duplique(self):
        Utilisateur.objects.create_user(
            email="dup@example.sn", password="MotDePasse@2025",
            first_name="A", last_name="B",
        )
        url = reverse("inscription")
        data = {
            "email": "dup@example.sn", "first_name": "C", "last_name": "D",
            "password": "MotDePasse@2025", "password2": "MotDePasse@2025",
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ConnexionTests(APITestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create_user(
            email="connexion@example.sn", password="MotDePasse@2025",
            first_name="Jean", last_name="Dupont",
        )

    def test_connexion_renvoie_token_et_profil(self):
        url = reverse("connexion")
        response = self.client.post(
            url,
            {"email": "connexion@example.sn", "password": "MotDePasse@2025"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertEqual(response.data["utilisateur"]["nom_complet"], "Jean Dupont")

    def test_connexion_mauvais_mot_de_passe(self):
        url = reverse("connexion")
        response = self.client.post(
            url,
            {"email": "connexion@example.sn", "password": "faux"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profil_requiert_authentification(self):
        response = self.client.get(reverse("profil"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
