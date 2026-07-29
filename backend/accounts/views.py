from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Sum
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .emails import envoyer_email_reinitialisation, envoyer_email_verification
from .serializers import (
    ConnexionTokenSerializer,
    InscriptionSerializer,
    MotDePasseOublieSerializer,
    ReinitialiserMotDePasseSerializer,
    RenvoyerCodeSerializer,
    UtilisateurAdminSerializer,
    UtilisateurSerializer,
    VerificationEmailSerializer,
)

Utilisateur = get_user_model()


class InscriptionView(generics.CreateAPIView):
    """Inscription d'un nouveau contribuable. Le compte reste inactif jusqu'à
    la vérification de l'adresse email (code à 6 chiffres envoyé par email)."""

    queryset = Utilisateur.objects.all()
    serializer_class = InscriptionSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "message": (
                    "Compte créé avec succès. Un code de vérification a été "
                    "envoyé à votre adresse email."
                ),
                "email": user.email,
            },
            status=status.HTTP_201_CREATED,
        )


class VerifierEmailView(APIView):
    """Confirme l'adresse email à partir du code à 6 chiffres reçu par email."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerificationEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        utilisateur = serializer.validated_data["utilisateur"]
        utilisateur.valider_email()
        return Response(
            {
                "message": "Adresse email vérifiée avec succès. Vous pouvez maintenant vous connecter.",
            },
            status=status.HTTP_200_OK,
        )


class RenvoyerCodeView(APIView):
    """Renvoie un nouveau code de vérification par email."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RenvoyerCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        utilisateur = serializer.utilisateur
        code = utilisateur.generer_code_verification()
        try:
            envoyer_email_verification(utilisateur, code)
        except Exception:
            return Response(
                {
                    "message": (
                        "Impossible d'envoyer l'email pour le moment. Réessayez "
                        "dans quelques instants."
                    )
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(
            {"message": "Un nouveau code de vérification vous a été envoyé."},
            status=status.HTTP_200_OK,
        )


class MotDePasseOublieView(APIView):
    """Envoie un code de réinitialisation de mot de passe par email."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = MotDePasseOublieSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        # Message générique dans tous les cas, pour ne pas révéler si un
        # compte existe ou non avec cette adresse (bonne pratique de sécurité).
        message_generique = (
            "Si un compte existe avec cette adresse email, un code de "
            "réinitialisation vient de lui être envoyé."
        )

        try:
            utilisateur = Utilisateur.objects.get(email__iexact=email)
        except Utilisateur.DoesNotExist:
            return Response({"message": message_generique}, status=status.HTTP_200_OK)

        code = utilisateur.generer_code_verification()
        try:
            envoyer_email_reinitialisation(utilisateur, code)
        except Exception:
            return Response(
                {"message": "Impossible d'envoyer l'email pour le moment. Réessayez."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response({"message": message_generique}, status=status.HTTP_200_OK)


class ReinitialiserMotDePasseView(APIView):
    """Confirme le code reçu et enregistre le nouveau mot de passe."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ReinitialiserMotDePasseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        utilisateur = serializer.validated_data["utilisateur"]
        utilisateur.set_password(serializer.validated_data["nouveau_mot_de_passe"])
        utilisateur.code_verification = None
        utilisateur.code_expiration = None
        utilisateur.save(update_fields=["password", "code_verification", "code_expiration"])
        return Response(
            {"message": "Mot de passe réinitialisé avec succès. Vous pouvez vous connecter."},
            status=status.HTTP_200_OK,
        )


class ConnexionView(TokenObtainPairView):
    """Connexion : renvoie les tokens JWT et le profil."""

    serializer_class = ConnexionTokenSerializer
    permission_classes = [permissions.AllowAny]


class ProfilView(generics.RetrieveUpdateAPIView):
    """Consultation et mise à jour du profil connecté."""

    serializer_class = UtilisateurSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UtilisateurAdminListView(generics.ListAPIView):
    """
    Liste des contribuables avec leurs statistiques agrégées
    (nombre d'impôts, montant payé, montant dû). Réservé aux administrateurs.
    """

    serializer_class = UtilisateurAdminSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return (
            Utilisateur.objects.filter(is_staff=False)
            .annotate(
                nombre_impots=Count("impots", distinct=True),
                total_paye=Sum("impots__montant", filter=Q(impots__statut="paye")),
                total_du=Sum("impots__montant", filter=~Q(impots__statut="paye")),
            )
            .order_by("-date_inscription")
        )
