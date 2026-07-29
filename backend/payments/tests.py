import datetime

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from taxes.models import CategorieImpot, Impot, Notification

from .models import Paiement
from .services import numero_valide, traiter_paiement

Utilisateur = get_user_model()


def _creer_impot(user, montant=100000, statut=Impot.Statut.IMPAYE, ref="IMP-TEST01"):
    categorie = CategorieImpot.objects.create(nom="Impôt test " + ref)
    return Impot.objects.create(
        utilisateur=user, categorie=categorie, libelle="Impôt test",
        montant=montant, annee_fiscale=2025,
        date_echeance=datetime.date(2025, 12, 31), reference=ref,
        statut=statut,
    )


class ServicePaiementTests(TestCase):
    def test_numero_valide_orange_money(self):
        self.assertTrue(numero_valide("770123456", Paiement.Moyen.ORANGE_MONEY))
        self.assertTrue(numero_valide("+221 78 012 34 56", Paiement.Moyen.ORANGE_MONEY))
        self.assertFalse(numero_valide("700123456", Paiement.Moyen.ORANGE_MONEY))

    def test_numero_valide_wave_accepte_plus_de_prefixes(self):
        self.assertTrue(numero_valide("700123456", Paiement.Moyen.WAVE))
        self.assertFalse(numero_valide("123", Paiement.Moyen.WAVE))

    def test_traiter_paiement_succes_force(self):
        user = Utilisateur.objects.create_user(
            email="s@example.sn", password="MotDePasse@2025", first_name="S", last_name="S"
        )
        impot = _creer_impot(user)
        paiement = Paiement.objects.create(
            utilisateur=user, impot=impot, montant=impot.montant,
            moyen=Paiement.Moyen.WAVE, numero_telephone="770123456",
            reference_transaction="WAV-TEST0001",
        )
        traiter_paiement(paiement, forcer_succes=True)
        self.assertEqual(paiement.statut, Paiement.Statut.REUSSI)
        self.assertIsNotNone(paiement.date_confirmation)

    def test_traiter_paiement_numero_invalide_echoue(self):
        user = Utilisateur.objects.create_user(
            email="e@example.sn", password="MotDePasse@2025", first_name="E", last_name="E"
        )
        impot = _creer_impot(user, ref="IMP-TEST02")
        paiement = Paiement.objects.create(
            utilisateur=user, impot=impot, montant=impot.montant,
            moyen=Paiement.Moyen.ORANGE_MONEY, numero_telephone="700000000",
            reference_transaction="OM-TEST0001",
        )
        traiter_paiement(paiement, forcer_succes=True)
        self.assertEqual(paiement.statut, Paiement.Statut.ECHOUE)


class PaiementAPITests(APITestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create_user(
            email="payeur@example.sn", password="MotDePasse@2025",
            first_name="Pa", last_name="Yeur",
        )
        self.client.force_authenticate(self.user)
        self.impot = _creer_impot(self.user, ref="IMP-API001")

    def test_paiement_reussi_marque_impot_paye_et_notifie(self):
        response = self.client.post(
            "/api/paiements/",
            {"impot": self.impot.id, "moyen": "wave", "numero_telephone": "770123456"},
            format="json",
        )
        # La simulation est aléatoire ; on vérifie la cohérence du résultat.
        self.impot.refresh_from_db()
        if response.status_code == status.HTTP_201_CREATED:
            self.assertEqual(self.impot.statut, Impot.Statut.PAYE)
            self.assertTrue(
                Notification.objects.filter(
                    utilisateur=self.user, type=Notification.Type.CONFIRMATION
                ).exists()
            )
        else:
            self.assertEqual(response.status_code, status.HTTP_402_PAYMENT_REQUIRED)

    def test_paiement_impot_deja_paye_refuse(self):
        self.impot.marquer_paye()
        response = self.client.post(
            "/api/paiements/",
            {"impot": self.impot.id, "moyen": "wave", "numero_telephone": "770123456"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_utilisateur_ne_voit_que_ses_paiements(self):
        autre = Utilisateur.objects.create_user(
            email="autre@example.sn", password="MotDePasse@2025",
            first_name="Au", last_name="Tre",
        )
        impot_autre = _creer_impot(autre, ref="IMP-API002")
        Paiement.objects.create(
            utilisateur=autre, impot=impot_autre, montant=impot_autre.montant,
            moyen=Paiement.Moyen.WAVE, numero_telephone="770123456",
            reference_transaction="WAV-OTHER01",
        )
        response = self.client.get("/api/paiements/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)
