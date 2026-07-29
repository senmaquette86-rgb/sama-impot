import datetime
import uuid

from rest_framework import serializers

from .models import CategorieImpot, Impot, Notification


class CategorieImpotSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategorieImpot
        fields = ["id", "nom", "description", "montant_indicatif"]


class ImpotSerializer(serializers.ModelSerializer):
    categorie_nom = serializers.CharField(source="categorie.nom", read_only=True)
    statut_courant = serializers.SerializerMethodField()
    statut_libelle = serializers.SerializerMethodField()
    contribuable = serializers.CharField(source="utilisateur.nom_complet", read_only=True)

    class Meta:
        model = Impot
        fields = [
            "id", "reference", "libelle", "categorie", "categorie_nom",
            "montant", "annee_fiscale", "date_echeance", "statut",
            "statut_courant", "statut_libelle", "contribuable", "date_creation",
        ]
        read_only_fields = ["reference", "statut", "date_creation"]

    def get_statut_courant(self, obj):
        return obj.statut_courant()

    def get_statut_libelle(self, obj):
        return Impot.Statut(obj.statut_courant()).label


class CreationImpotSerializer(serializers.ModelSerializer):
    """Déclaration d'un impôt à payer par le contribuable lui-même."""

    class Meta:
        model = Impot
        fields = ["id", "categorie", "libelle", "montant", "annee_fiscale", "date_echeance", "reference"]
        read_only_fields = ["id", "reference"]
        extra_kwargs = {
            "annee_fiscale": {"required": False},
            "date_echeance": {"required": False},
        }

    def validate_montant(self, valeur):
        if valeur <= 0:
            raise serializers.ValidationError("Le montant doit être supérieur à zéro.")
        return valeur

    def create(self, validated_data):
        validated_data["utilisateur"] = self.context["request"].user
        validated_data.setdefault("annee_fiscale", datetime.date.today().year)
        validated_data.setdefault(
            "date_echeance", datetime.date.today() + datetime.timedelta(days=30)
        )
        validated_data["reference"] = f"IMP-{uuid.uuid4().hex[:8].upper()}"
        return super().create(validated_data)


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "titre", "message", "type", "lu", "date_creation"]
        read_only_fields = ["date_creation"]
