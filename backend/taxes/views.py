from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import CategorieImpot, Impot, Notification
from .serializers import (
    CategorieImpotSerializer,
    CreationImpotSerializer,
    ImpotSerializer,
    NotificationSerializer,
)


class CategorieImpotViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """Liste des catégories d'impôt disponibles."""

    queryset = CategorieImpot.objects.all()
    serializer_class = CategorieImpotSerializer
    permission_classes = [permissions.IsAuthenticated]


class ImpotViewSet(
    mixins.CreateModelMixin, viewsets.ReadOnlyModelViewSet
):
    """
    Consultation et déclaration des impôts.
    Un contribuable ne voit et ne crée que ses propres impôts ;
    l'administrateur voit tout.
    """

    serializer_class = ImpotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return CreationImpotSerializer
        return ImpotSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        impot = serializer.save()
        return Response(ImpotSerializer(impot).data, status=status.HTTP_201_CREATED)

    def get_queryset(self):
        user = self.request.user
        qs = Impot.objects.select_related("categorie", "utilisateur")
        if not user.is_staff:
            qs = qs.filter(utilisateur=user)
        statut = self.request.query_params.get("statut")
        if statut:
            qs = qs.filter(statut=statut)
        return qs

    @action(detail=False, methods=["get"])
    def resume(self, request):
        """Tableau de bord : montants dus, payés et en retard."""
        impots = self.get_queryset()
        total_du = sum(
            i.montant for i in impots if i.statut != Impot.Statut.PAYE
        )
        total_paye = sum(
            i.montant for i in impots if i.statut == Impot.Statut.PAYE
        )
        nb_en_retard = sum(1 for i in impots if i.est_en_retard)
        return Response(
            {
                "nombre_impots": impots.count(),
                "total_du": total_du,
                "total_paye": total_paye,
                "nombre_impayes": impots.exclude(statut=Impot.Statut.PAYE).count(),
                "nombre_en_retard": nb_en_retard,
            }
        )


class NotificationViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    """Notifications du contribuable connecté."""

    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(utilisateur=self.request.user)

    @action(detail=True, methods=["post"])
    def lire(self, request, pk=None):
        notif = self.get_object()
        notif.lu = True
        notif.save(update_fields=["lu"])
        return Response(self.get_serializer(notif).data)

    @action(detail=False, methods=["post"])
    def tout_lire(self, request):
        self.get_queryset().filter(lu=False).update(lu=True)
        return Response({"message": "Toutes les notifications sont marquées comme lues."}, status=status.HTTP_200_OK)
