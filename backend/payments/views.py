from rest_framework import mixins, permissions, status, viewsets
from rest_framework.response import Response

from taxes.models import Notification

from .models import Paiement
from .serializers import CreationPaiementSerializer, PaiementSerializer
from .services import generer_reference, traiter_paiement


class PaiementViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    """
    Historique et création des paiements.
    La création déclenche la simulation Wave / Orange Money.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return CreationPaiementSerializer
        return PaiementSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Paiement.objects.select_related("impot", "utilisateur")
        if not user.is_staff:
            qs = qs.filter(utilisateur=user)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        impot = serializer.validated_data["impot"]

        paiement = Paiement.objects.create(
            utilisateur=request.user,
            impot=impot,
            montant=impot.montant,
            moyen=serializer.validated_data["moyen"],
            numero_telephone=serializer.validated_data["numero_telephone"],
            reference_transaction=generer_reference(serializer.validated_data["moyen"]),
        )

        traiter_paiement(paiement)

        if paiement.statut == Paiement.Statut.REUSSI:
            impot.marquer_paye()
            Notification.objects.create(
                utilisateur=request.user,
                titre="Paiement confirmé",
                message=(
                    f"Votre paiement de {impot.montant} FCFA pour « {impot.libelle} » "
                    f"a été confirmé (réf. {paiement.reference_transaction})."
                ),
                type=Notification.Type.CONFIRMATION,
            )

        code = (
            status.HTTP_201_CREATED
            if paiement.statut == Paiement.Statut.REUSSI
            else status.HTTP_402_PAYMENT_REQUIRED
        )
        return Response(PaiementSerializer(paiement).data, status=code)
