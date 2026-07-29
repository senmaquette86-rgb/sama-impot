import random

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import RegexValidator
from django.db import models
from django.utils import timezone

# Un numéro sénégalais valide comporte exactement 9 chiffres (sans le +221).
validateur_telephone = RegexValidator(
    regex=r"^\d{9}$",
    message="Le numéro doit contenir exactement 9 chiffres (ex. 771234567).",
)


class UtilisateurManager(BaseUserManager):
    """Gestionnaire d'utilisateurs utilisant l'email comme identifiant."""

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("L'adresse email est obligatoire.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Un super-utilisateur doit avoir is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Un super-utilisateur doit avoir is_superuser=True.")
        return self._create_user(email, password, **extra_fields)


class Utilisateur(AbstractUser):
    """
    Contribuable ou administrateur de la plateforme Sama Impôt.
    L'authentification se fait par email.
    """

    class TypeContribuable(models.TextChoices):
        PARTICULIER = "particulier", "Particulier"
        ENTREPRISE = "entreprise", "Entreprise / PME"
        INDEPENDANT = "independant", "Travailleur indépendant"
        COMMERCANT = "commercant", "Commerçant"

    username = None
    email = models.EmailField("adresse email", unique=True)
    telephone = models.CharField(
        "téléphone", max_length=9, blank=True, validators=[validateur_telephone],
        help_text="9 chiffres, sans le +221 (ex. 771234567).",
    )
    adresse = models.CharField("adresse", max_length=255, blank=True)

    # Vérification de l'adresse email à l'inscription.
    email_verifie = models.BooleanField("email vérifié", default=False)
    code_verification = models.CharField(max_length=6, blank=True, null=True)
    code_expiration = models.DateTimeField(blank=True, null=True)
    ninea = models.CharField(
        "NINEA / identifiant fiscal", max_length=30, blank=True,
        help_text="Numéro d'identification national des entreprises et associations.",
    )
    type_contribuable = models.CharField(
        max_length=20,
        choices=TypeContribuable.choices,
        default=TypeContribuable.PARTICULIER,
    )
    date_inscription = models.DateTimeField("date d'inscription", auto_now_add=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = UtilisateurManager()

    class Meta:
        verbose_name = "utilisateur"
        verbose_name_plural = "utilisateurs"
        ordering = ["-date_inscription"]

    def __str__(self):
        nom_complet = f"{self.first_name} {self.last_name}".strip()
        return nom_complet or self.email

    @property
    def nom_complet(self):
        return f"{self.first_name} {self.last_name}".strip() or self.email

    def generer_code_verification(self):
        """Génère un code à 6 chiffres valable 15 minutes et le sauvegarde."""
        self.code_verification = f"{random.randint(0, 999999):06d}"
        self.code_expiration = timezone.now() + timezone.timedelta(minutes=15)
        self.save(update_fields=["code_verification", "code_expiration"])
        return self.code_verification

    def code_est_valide(self, code):
        """Vérifie que le code fourni correspond et n'est pas expiré."""
        if not self.code_verification or not self.code_expiration:
            return False
        if timezone.now() > self.code_expiration:
            return False
        return code == self.code_verification

    def valider_email(self):
        """Marque l'email comme vérifié et active le compte."""
        self.email_verifie = True
        self.is_active = True
        self.code_verification = None
        self.code_expiration = None
        self.save(update_fields=["email_verifie", "is_active", "code_verification", "code_expiration"])
