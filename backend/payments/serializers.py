import re

from rest_framework import serializers

from taxes.models import Impot

from .models import Paiement


class PaiementSerializer(serializers.ModelSerializer):
    moyen_libelle = serializers.CharField(source="get_moyen_display", read_only=True)
    statut_libelle = serializers.CharField(source="get_statut_display", read_only=True)
    impot_libelle = serializers.CharField(source="impot.libelle", read_only=True)
    impot_reference = serializers.CharField(source="impot.reference", read_only=True)

    class Meta:
        model = Paiement
        fields = [
            "id", "impot", "impot_libelle", "impot_reference", "montant",
            "moyen", "moyen_libelle", "statut", "statut_libelle",
            "numero_telephone", "reference_transaction", "message",
            "date_creation", "date_confirmation",
        ]
        read_only_fields = [
            "montant", "statut", "reference_transaction",
            "message", "date_creation", "date_confirmation",
        ]


class CreationPaiementSerializer(serializers.Serializer):
    """Données d'entrée pour initier un paiement."""

    impot = serializers.PrimaryKeyRelatedField(queryset=Impot.objects.all())
    moyen = serializers.ChoiceField(choices=Paiement.Moyen.choices)
    numero_telephone = serializers.CharField(max_length=20)

    def validate_impot(self, impot):
        user = self.context["request"].user
        if not user.is_staff and impot.utilisateur_id != user.id:
            raise serializers.ValidationError("Cet impôt ne vous appartient pas.")
        if impot.statut == Impot.Statut.PAYE:
            raise serializers.ValidationError("Cet impôt est déjà payé.")
        return impot

    def validate_numero_telephone(self, value):
        chiffres = re.sub(r"\D", "", value or "")
        if chiffres.startswith("221"):
            chiffres = chiffres[3:]
        if len(chiffres) != 9:
            raise serializers.ValidationError(
                "Le numéro de téléphone doit contenir exactement 9 chiffres (ex. 771234567)."
            )
        return chiffres
