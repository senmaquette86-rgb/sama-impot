from django.conf import settings
from django.db import models


class Paiement(models.Model):
    """
    Paiement d'un impôt via un fournisseur mobile (Wave ou Orange Money).
    La transaction est simulée (aucun débit réel).
    """

    class Moyen(models.TextChoices):
        WAVE = "wave", "Wave"
        ORANGE_MONEY = "orange_money", "Orange Money"

    class Statut(models.TextChoices):
        EN_ATTENTE = "en_attente", "En attente"
        REUSSI = "reussi", "Réussi"
        ECHOUE = "echoue", "Échoué"

    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="paiements",
    )
    impot = models.ForeignKey(
        "taxes.Impot",
        on_delete=models.CASCADE,
        related_name="paiements",
    )
    montant = models.DecimalField("montant (FCFA)", max_digits=12, decimal_places=0)
    moyen = models.CharField(max_length=15, choices=Moyen.choices)
    statut = models.CharField(
        max_length=12, choices=Statut.choices, default=Statut.EN_ATTENTE
    )
    numero_telephone = models.CharField("numéro de téléphone", max_length=20)
    reference_transaction = models.CharField(max_length=40, unique=True)
    message = models.CharField(max_length=255, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_confirmation = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "paiement"
        verbose_name_plural = "paiements"
        ordering = ["-date_creation"]

    def __str__(self):
        return f"{self.reference_transaction} - {self.get_moyen_display()} ({self.statut})"
