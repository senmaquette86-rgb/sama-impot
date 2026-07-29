from django.contrib import admin

from .models import Paiement


@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display = [
        "reference_transaction", "utilisateur", "impot",
        "montant", "moyen", "statut", "date_creation",
    ]
    list_filter = ["moyen", "statut", "date_creation"]
    search_fields = ["reference_transaction", "utilisateur__email", "numero_telephone"]
    readonly_fields = ["date_creation", "date_confirmation"]
