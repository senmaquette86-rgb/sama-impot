"""Envoi des emails liés au compte utilisateur (vérification d'adresse email)."""
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags


def envoyer_email_verification(utilisateur, code):
    """Envoie le code de vérification à 6 chiffres au contribuable."""
    contexte = {
        "prenom": utilisateur.first_name or "cher contribuable",
        "code": code,
    }
    html = render_to_string("accounts/email_verification.html", contexte)
    texte = strip_tags(html)

    send_mail(
        subject="Confirmez votre adresse email — Sama Impôt",
        message=texte,
        html_message=html,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[utilisateur.email],
        fail_silently=False,
    )


def envoyer_email_reinitialisation(utilisateur, code):
    """Envoie le code de réinitialisation de mot de passe au contribuable."""
    contexte = {
        "prenom": utilisateur.first_name or "cher contribuable",
        "code": code,
    }
    html = render_to_string("accounts/email_reinitialisation.html", contexte)
    texte = strip_tags(html)

    send_mail(
        subject="Réinitialisation de votre mot de passe — Sama Impôt",
        message=texte,
        html_message=html,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[utilisateur.email],
        fail_silently=False,
    )
