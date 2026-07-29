from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from accounts.views import UtilisateurAdminListView
from payments.views import PaiementViewSet
from taxes.views import CategorieImpotViewSet, ImpotViewSet, NotificationViewSet


def api_root(request):
    return JsonResponse(
        {
            "application": "Sama Impôt API",
            "description": "API de paiement des impôts au Sénégal",
            "version": "1.0",
            "endpoints": {
                "inscription": "/api/auth/inscription/",
                "connexion": "/api/auth/connexion/",
                "profil": "/api/auth/profil/",
                "impots": "/api/impots/",
                "categories": "/api/categories/",
                "paiements": "/api/paiements/",
                "notifications": "/api/notifications/",
                "utilisateurs": "/api/utilisateurs/ (admin)",
                "administration": "/admin/",
            },
        }
    )


router = DefaultRouter()
router.register("impots", ImpotViewSet, basename="impot")
router.register("categories", CategorieImpotViewSet, basename="categorie")
router.register("paiements", PaiementViewSet, basename="paiement")
router.register("notifications", NotificationViewSet, basename="notification")

urlpatterns = [
    path("", api_root, name="api-root"),
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/utilisateurs/", UtilisateurAdminListView.as_view(), name="utilisateurs-admin"),
    path("api/", include(router.urls)),
]
