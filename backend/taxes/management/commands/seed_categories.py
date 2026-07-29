"""
Charge le catalogue officiel des principaux impôts et taxes au Sénégal.

Contrairement à `seed_demo`, cette commande ne crée AUCUN utilisateur ni
AUCUN impôt fictif : uniquement les catégories, qui sont des données de
référence réutilisables en production. Sûre à exécuter sur un vrai serveur.

Usage :
    python manage.py seed_categories
"""
from django.core.management.base import BaseCommand

from taxes.models import CategorieImpot

# Catalogue des principaux impôts et taxes au Sénégal.
# (nom, description, montant indicatif en FCFA — proposé par défaut,
#  modifiable/laissable vide selon vos besoins réels)
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


class Command(BaseCommand):
    help = "Charge les vraies catégories d'impôts sénégalais (sans aucune donnée de test)."

    def handle(self, *args, **options):
        crees = 0
        for nom, description, montant_indicatif in CATEGORIES:
            _, cree = CategorieImpot.objects.get_or_create(
                nom=nom,
                defaults={
                    "description": description,
                    "montant_indicatif": montant_indicatif,
                },
            )
            if cree:
                crees += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"{crees} nouvelle(s) catégorie(s) créée(s) "
                f"({len(CATEGORIES) - crees} existaient déjà)."
            )
        )
