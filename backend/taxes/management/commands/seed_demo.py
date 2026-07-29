"""Crée un jeu de données de démonstration pour Sama Impôt."""
import datetime
import uuid

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from taxes.models import CategorieImpot, Impot, Notification

Utilisateur = get_user_model()

# Catalogue des principaux impôts et taxes au Sénégal.
# (nom, description, montant indicatif en FCFA)
CATEGORIES = [
    ("Impôt sur le Revenu (IR)", "Impôt sur les revenus des personnes physiques.", 150000),
    ("Impôt sur les Sociétés (IS)", "Impôt sur les bénéfices des sociétés.", 500000),
    ("TVA", "Taxe sur la valeur ajoutée (18 %).", 100000),
    ("Contribution Économique Locale (CEL)", "Ex-patente : contribution des entreprises et commerçants.", 120000),
    ("Impôt foncier sur les propriétés bâties", "Taxe annuelle sur les immeubles bâtis.", 90000),
    ("Impôt foncier sur les propriétés non bâties", "Taxe annuelle sur les terrains non bâtis.", 60000),
    ("Taxe sur la plus-value immobilière", "Taxe sur la cession d'un bien immobilier.", 200000),
    ("Droits d'enregistrement", "Droits sur les actes et mutations.", 50000),
    ("Vignette (taxe sur les véhicules)", "Taxe annuelle sur les véhicules à moteur.", 45000),
    ("Contribution Forfaitaire (CFCE)", "Contribution forfaitaire à la charge des employeurs.", 80000),
]

CONTRIBUABLES = [
    {
        "email": "awa.ndiaye@example.sn", "first_name": "Awa", "last_name": "Ndiaye",
        "telephone": "770000001", "type_contribuable": "particulier",
    },
    {
        "email": "moussa.fall@example.sn", "first_name": "Moussa", "last_name": "Fall",
        "telephone": "780000002", "type_contribuable": "commercant", "ninea": "SN-2024-0455",
    },
    {
        "email": "fatou.sarr@example.sn", "first_name": "Fatou", "last_name": "Sarr",
        "telephone": "760000003", "type_contribuable": "independant",
    },
]


class Command(BaseCommand):
    help = "Charge des catégories, contribuables, impôts et notifications de démonstration."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset", action="store_true",
            help="Supprime les impôts, paiements et notifications existants avant le chargement.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["reset"]:
            Notification.objects.all().delete()
            Impot.objects.all().delete()
            self.stdout.write(self.style.WARNING("Données existantes supprimées."))

        categories = {}
        for nom, desc, montant_indicatif in CATEGORIES:
            cat, _ = CategorieImpot.objects.get_or_create(
                nom=nom,
                defaults={"description": desc, "montant_indicatif": montant_indicatif},
            )
            categories[nom] = cat

        # Administrateur
        admin, cree = Utilisateur.objects.get_or_create(
            email="admin@samaimpot.sn",
            defaults={
                "first_name": "Admin", "last_name": "Sama Impôt",
                "is_staff": True, "is_superuser": True,
            },
        )
        if cree:
            admin.set_password("Admin@2025")
            admin.save()
            self.stdout.write(self.style.SUCCESS("Administrateur créé : admin@samaimpot.sn / Admin@2025"))

        annee = datetime.date.today().year
        for info in CONTRIBUABLES:
            user, cree = Utilisateur.objects.get_or_create(
                email=info["email"], defaults=info
            )
            if cree:
                user.set_password("Passer@2025")
                user.save()

            exemples = [
                (categories["Impôt sur le Revenu (IR)"], "IR " + str(annee), 250000, annee, 30, Impot.Statut.IMPAYE),
                (categories["Impôt foncier sur les propriétés bâties"], "Taxe foncière " + str(annee), 120000, annee, -10, Impot.Statut.IMPAYE),
                (categories["TVA"], "TVA T4 " + str(annee - 1), 90000, annee - 1, -120, Impot.Statut.PAYE),
            ]
            for cat, libelle, montant, an, delta, statut in exemples:
                ref = f"IMP-{uuid.uuid4().hex[:8].upper()}"
                Impot.objects.get_or_create(
                    utilisateur=user, categorie=cat, libelle=libelle, annee_fiscale=an,
                    defaults={
                        "montant": montant,
                        "date_echeance": datetime.date.today() + datetime.timedelta(days=delta),
                        "statut": statut,
                        "reference": ref,
                    },
                )

            Notification.objects.get_or_create(
                utilisateur=user,
                titre="Rappel d'échéance",
                defaults={
                    "message": "Vous avez des impôts à régler avant la date d'échéance. Payez en ligne via Wave ou Orange Money.",
                    "type": Notification.Type.RAPPEL,
                },
            )

        self.stdout.write(self.style.SUCCESS(
            "Données de démonstration chargées. Contribuables : "
            "awa.ndiaye@example.sn / moussa.fall@example.sn / fatou.sarr@example.sn (mot de passe : Passer@2025)"
        ))
