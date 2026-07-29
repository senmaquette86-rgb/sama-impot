import re

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .emails import envoyer_email_verification

Utilisateur = get_user_model()


def _valider_telephone_senegalais(valeur):
    """Un numéro sénégalais valide comporte exactement 9 chiffres (sans le +221)."""
    if not valeur:
        return valeur
    chiffres = re.sub(r"\D", "", valeur)
    if chiffres.startswith("221"):
        chiffres = chiffres[3:]
    if len(chiffres) != 9:
        raise serializers.ValidationError(
            "Le numéro de téléphone doit contenir exactement 9 chiffres (ex. 771234567)."
        )
    return chiffres


class UtilisateurSerializer(serializers.ModelSerializer):
    nom_complet = serializers.CharField(read_only=True)

    class Meta:
        model = Utilisateur
        fields = [
            "id", "email", "first_name", "last_name", "nom_complet",
            "telephone", "adresse", "ninea", "type_contribuable",
            "is_staff", "email_verifie", "date_inscription",
        ]
        read_only_fields = ["id", "is_staff", "email_verifie", "date_inscription"]

    def validate_telephone(self, value):
        return _valider_telephone_senegalais(value)


class UtilisateurAdminSerializer(UtilisateurSerializer):
    """Vue contribuable enrichie de ses statistiques, réservée à l'administration."""

    nombre_impots = serializers.IntegerField(read_only=True, default=0)
    total_paye = serializers.DecimalField(
        max_digits=14, decimal_places=0, read_only=True, allow_null=True
    )
    total_du = serializers.DecimalField(
        max_digits=14, decimal_places=0, read_only=True, allow_null=True
    )

    class Meta(UtilisateurSerializer.Meta):
        fields = UtilisateurSerializer.Meta.fields + [
            "nombre_impots", "total_paye", "total_du",
        ]


class InscriptionSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = Utilisateur
        fields = [
            "email", "first_name", "last_name", "telephone",
            "adresse", "ninea", "type_contribuable", "password", "password2",
        ]

    def validate_email(self, value):
        if Utilisateur.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Un compte existe déjà avec cet email.")
        return value.lower()

    def validate_telephone(self, value):
        return _valider_telephone_senegalais(value)

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password2"):
            raise serializers.ValidationError(
                {"password2": "Les deux mots de passe ne correspondent pas."}
            )
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        # Le compte reste inactif tant que l'adresse email n'est pas vérifiée.
        user = Utilisateur.objects.create_user(password=password, **validated_data)
        user.is_active = False
        user.save(update_fields=["is_active"])
        code = user.generer_code_verification()
        try:
            envoyer_email_verification(user, code)
        except Exception:
            # Si l'envoi échoue (mauvaise config SMTP, etc.), on supprime le
            # compte pour ne pas laisser un utilisateur bloqué "email déjà pris"
            # sans qu'il ait jamais reçu de code.
            user.delete()
            raise serializers.ValidationError(
                {
                    "email": (
                        "Impossible d'envoyer l'email de vérification pour le moment. "
                        "Réessayez dans quelques instants."
                    )
                }
            )
        return user


class VerificationEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6)

    def validate(self, attrs):
        try:
            utilisateur = Utilisateur.objects.get(email__iexact=attrs["email"])
        except Utilisateur.DoesNotExist:
            raise serializers.ValidationError({"email": "Aucun compte ne correspond à cet email."})

        if utilisateur.email_verifie:
            raise serializers.ValidationError({"email": "Cette adresse email est déjà vérifiée."})

        if not utilisateur.code_est_valide(attrs["code"]):
            raise serializers.ValidationError({"code": "Code invalide ou expiré."})

        attrs["utilisateur"] = utilisateur
        return attrs


class RenvoyerCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            utilisateur = Utilisateur.objects.get(email__iexact=value)
        except Utilisateur.DoesNotExist:
            raise serializers.ValidationError("Aucun compte ne correspond à cet email.")
        if utilisateur.email_verifie:
            raise serializers.ValidationError("Cette adresse email est déjà vérifiée.")
        self.utilisateur = utilisateur
        return value


class MotDePasseOublieSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ReinitialiserMotDePasseSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6)
    nouveau_mot_de_passe = serializers.CharField(write_only=True, validators=[validate_password])
    nouveau_mot_de_passe2 = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["nouveau_mot_de_passe"] != attrs.pop("nouveau_mot_de_passe2"):
            raise serializers.ValidationError(
                {"nouveau_mot_de_passe2": "Les deux mots de passe ne correspondent pas."}
            )
        try:
            utilisateur = Utilisateur.objects.get(email__iexact=attrs["email"])
        except Utilisateur.DoesNotExist:
            raise serializers.ValidationError({"email": "Aucun compte ne correspond à cet email."})

        if not utilisateur.code_est_valide(attrs["code"]):
            raise serializers.ValidationError({"code": "Code invalide ou expiré."})

        attrs["utilisateur"] = utilisateur
        return attrs


class ConnexionTokenSerializer(TokenObtainPairSerializer):
    """Ajoute les informations de l'utilisateur au token de connexion."""

    default_error_messages = {
        "no_active_account": (
            "Email ou mot de passe incorrect, ou compte pas encore vérifié. "
            "Consultez votre boîte de réception pour activer votre compte."
        )
    }

    def validate(self, attrs):
        data = super().validate(attrs)
        data["utilisateur"] = UtilisateurSerializer(self.user).data
        return data
