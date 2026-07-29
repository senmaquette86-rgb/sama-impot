from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    ConnexionView,
    InscriptionView,
    MotDePasseOublieView,
    ProfilView,
    ReinitialiserMotDePasseView,
    RenvoyerCodeView,
    VerifierEmailView,
)

urlpatterns = [
    path("inscription/", InscriptionView.as_view(), name="inscription"),
    path("verifier-email/", VerifierEmailView.as_view(), name="verifier-email"),
    path("renvoyer-code/", RenvoyerCodeView.as_view(), name="renvoyer-code"),
    path("mot-de-passe-oublie/", MotDePasseOublieView.as_view(), name="mot-de-passe-oublie"),
    path(
        "reinitialiser-mot-de-passe/",
        ReinitialiserMotDePasseView.as_view(),
        name="reinitialiser-mot-de-passe",
    ),
    path("connexion/", ConnexionView.as_view(), name="connexion"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("profil/", ProfilView.as_view(), name="profil"),
]
