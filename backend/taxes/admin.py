from django.contrib import admin

from .models import CategorieImpot, Impot, Notification


@admin.register(CategorieImpot)
class CategorieImpotAdmin(admin.ModelAdmin):
    list_display = ["nom", "montant_indicatif", "description"]
    search_fields = ["nom"]


@admin.register(Impot)
class ImpotAdmin(admin.ModelAdmin):
    list_display = [
        "reference", "libelle", "utilisateur", "categorie",
        "montant", "annee_fiscale", "date_echeance", "statut",
    ]
    list_filter = ["statut", "annee_fiscale", "categorie"]
    search_fields = ["reference", "libelle", "utilisateur__email"]
    autocomplete_fields = ["utilisateur", "categorie"]
    date_hierarchy = "date_echeance"


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["titre", "utilisateur", "type", "lu", "date_creation"]
    list_filter = ["type", "lu"]
    search_fields = ["titre", "utilisateur__email"]
