import datetime

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import CategorieImpot, Impot, Notification

Utilisateur = get_user_model()


class ImpotModelTests(TestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create_user(
            email="u@example.sn", password="MotDePasse@2025", first_name="U", last_name="U"
        )
        self.categorie = CategorieImpot.objects.create(nom="Impôt foncier")

    def _impot(self, delta_jours, statut=Impot.Statut.IMPAYE, ref="IMP-M01"):
        return Impot.objects.create(
            utilisateur=self.user, categorie=self.categorie, libelle="Test",
            montant=50000, annee_fiscale=2025,
            date_echeance=timezone.localdate() + datetime.timedelta(days=delta_jours),
            reference=ref, statut=statut,
        )

    def test_statut_courant_en_retard(self):
        impot = self._impot(-5)
        self.assertEqual(impot.statut_courant(), Impot.Statut.EN_RETARD)
        self.assertTrue(impot.est_en_retard)

    def test_statut_courant_impaye_dans_les_delais(self):
        impot = self._impot(10, ref="IMP-M02")
        self.assertEqual(impot.statut_courant(), Impot.Statut.IMPAYE)
        self.assertFalse(impot.est_en_retard)

    def test_marquer_paye(self):
        impot = self._impot(-5, ref="IMP-M03")
        impot.marquer_paye()
        self.assertEqual(impot.statut, Impot.Statut.PAYE)
        self.assertFalse(impot.est_en_retard)


class ImpotAPITests(APITestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create_user(
            email="api@example.sn", password="MotDePasse@2025", first_name="A", last_name="P"
        )
        self.categorie = CategorieImpot.objects.create(nom="TVA")
        self.client.force_authenticate(self.user)
        Impot.objects.create(
            utilisateur=self.user, categorie=self.categorie, libelle="Impayé",
            montant=100000, annee_fiscale=2025,
            date_echeance=datetime.date(2025, 12, 31), reference="IMP-A01",
        )
        Impot.objects.create(
            utilisateur=self.user, categorie=self.categorie, libelle="Payé",
            montant=40000, annee_fiscale=2024,
            date_echeance=datetime.date(2024, 12, 31), reference="IMP-A02",
            statut=Impot.Statut.PAYE,
        )

    def test_resume_calcule_les_totaux(self):
        response = self.client.get("/api/impots/resume/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["nombre_impots"], 2)
        self.assertEqual(response.data["total_du"], 100000)
        self.assertEqual(response.data["total_paye"], 40000)

    def test_liste_ne_montre_que_ses_impots(self):
        autre = Utilisateur.objects.create_user(
            email="autre@example.sn", password="MotDePasse@2025", first_name="X", last_name="Y"
        )
        Impot.objects.create(
            utilisateur=autre, categorie=self.categorie, libelle="Autre",
            montant=1, annee_fiscale=2025,
            date_echeance=datetime.date(2025, 12, 31), reference="IMP-A03",
        )
        response = self.client.get("/api/impots/")
        self.assertEqual(response.data["count"], 2)

    def test_filtre_par_statut(self):
        response = self.client.get("/api/impots/?statut=paye")
        self.assertEqual(response.data["count"], 1)

    def test_creation_impot_par_contribuable(self):
        response = self.client.post(
            "/api/impots/",
            {"categorie": self.categorie.id, "libelle": "TVA 2025", "montant": 75000},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["statut"], "impaye")
        self.assertTrue(response.data["reference"].startswith("IMP-"))
        impot = Impot.objects.get(id=response.data["id"])
        self.assertEqual(impot.utilisateur, self.user)

    def test_creation_impot_montant_invalide(self):
        response = self.client.post(
            "/api/impots/",
            {"categorie": self.categorie.id, "libelle": "TVA", "montant": 0},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class NotificationAPITests(APITestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create_user(
            email="notif@example.sn", password="MotDePasse@2025", first_name="N", last_name="O"
        )
        self.client.force_authenticate(self.user)
        self.notif = Notification.objects.create(
            utilisateur=self.user, titre="Rappel", message="Payez vos impôts.",
            type=Notification.Type.RAPPEL,
        )

    def test_marquer_lu(self):
        response = self.client.post(f"/api/notifications/{self.notif.id}/lire/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notif.refresh_from_db()
        self.assertTrue(self.notif.lu)

    def test_tout_lire(self):
        response = self.client.post("/api/notifications/tout_lire/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Notification.objects.filter(utilisateur=self.user, lu=False).exists())
