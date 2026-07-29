from django.conf import settings
from django.db import models
from django.utils import timezone


class CategorieImpot(models.Model):
    """Catégorie d'impôt (ex : impôt foncier, patente, TVA...)."""

    nom = models.CharField("nom", max_length=120, unique=True)
    description = models.TextField("description", blank=True)
    montant_indicatif = models.DecimalField(
        "montant indicatif (FCFA)", max_digits=12, decimal_places=0,
        null=True, blank=True,
        help_text="Montant proposé par défaut lors d'un nouveau paiement (facultatif).",
    )

    class Meta:
        verbose_name = "catégorie d'impôt"
        verbose_name_plural = "catégories d'impôt"
        ordering = ["nom"]

    def __str__(self):
        return self.nom


class Impot(models.Model):
    """Impôt dû par un contribuable pour une année fiscale donnée."""

    class Statut(models.TextChoices):
        IMPAYE = "impaye", "Impayé"
        PAYE = "paye", "Payé"
        EN_RETARD = "en_retard", "En retard"

    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="impots",
        verbose_name="contribuable",
    )
    categorie = models.ForeignKey(
        CategorieImpot,
        on_delete=models.PROTECT,
        related_name="impots",
        verbose_name="catégorie",
    )
    libelle = models.CharField("libellé", max_length=150)
    montant = models.DecimalField("montant (FCFA)", max_digits=12, decimal_places=0)
    annee_fiscale = models.PositiveIntegerField("année fiscale")
    date_echeance = models.DateField("date d'échéance")
    statut = models.CharField(
        max_length=15, choices=Statut.choices, default=Statut.IMPAYE
    )
    reference = models.CharField("référence", max_length=30, unique=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "impôt"
        verbose_name_plural = "impôts"
        ordering = ["-annee_fiscale", "date_echeance"]

    def __str__(self):
        return f"{self.libelle} - {self.utilisateur} ({self.annee_fiscale})"

    @property
    def est_en_retard(self):
        return self.statut != self.Statut.PAYE and self.date_echeance < timezone.localdate()

    def statut_courant(self):
        """Statut effectif en tenant compte de la date d'échéance."""
        if self.statut == self.Statut.PAYE:
            return self.Statut.PAYE
        if self.est_en_retard:
            return self.Statut.EN_RETARD
        return self.Statut.IMPAYE

    def marquer_paye(self):
        self.statut = self.Statut.PAYE
        self.save(update_fields=["statut"])


class Notification(models.Model):
    """Rappel d'échéance ou confirmation envoyée au contribuable."""

    class Type(models.TextChoices):
        RAPPEL = "rappel", "Rappel d'échéance"
        CONFIRMATION = "confirmation", "Confirmation de paiement"
        INFO = "info", "Information"

    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    titre = models.CharField(max_length=150)
    message = models.TextField()
    type = models.CharField(max_length=15, choices=Type.choices, default=Type.INFO)
    lu = models.BooleanField("lu", default=False)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "notification"
        verbose_name_plural = "notifications"
        ordering = ["-date_creation"]

    def __str__(self):
        return f"{self.titre} → {self.utilisateur}"
