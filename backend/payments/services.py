"""
Simulation des passerelles de paiement mobile Wave et Orange Money.

Aucune transaction réelle n'est effectuée : la passerelle valide le format du
numéro de téléphone puis renvoie un résultat déterministe. Le point d'entrée
`traiter_paiement` peut être remplacé par un véritable appel API sans changer
le reste de l'application.
"""
import random
import re
import uuid

from .models import Paiement

# Préfixes opérateurs sénégalais (indicatif +221 optionnel).
_PREFIXES = {
    Paiement.Moyen.ORANGE_MONEY: ("77", "78"),
    Paiement.Moyen.WAVE: ("70", "75", "76", "77", "78"),
}


def numero_valide(numero, moyen):
    """Vérifie qu'un numéro sénégalais est plausible pour l'opérateur choisi."""
    chiffres = re.sub(r"\D", "", numero or "")
    if chiffres.startswith("221"):
        chiffres = chiffres[3:]
    if len(chiffres) != 9:
        return False
    return chiffres.startswith(_PREFIXES.get(moyen, ()))


def generer_reference(moyen):
    prefixe = "WAV" if moyen == Paiement.Moyen.WAVE else "OM"
    return f"{prefixe}-{uuid.uuid4().hex[:12].upper()}"


def traiter_paiement(paiement, forcer_succes=None):
    """
    Traite un paiement simulé et met à jour son statut.

    `forcer_succes` permet de rendre le résultat déterministe (utile pour les
    tests et les démonstrations). Sinon la simulation réussit dans 90 % des cas.
    """
    from django.utils import timezone

    if not numero_valide(paiement.numero_telephone, paiement.moyen):
        paiement.statut = Paiement.Statut.ECHOUE
        paiement.message = "Numéro de téléphone invalide pour cet opérateur."
        paiement.save(update_fields=["statut", "message"])
        return paiement

    if forcer_succes is None:
        succes = random.random() < 0.9
    else:
        succes = bool(forcer_succes)

    if succes:
        paiement.statut = Paiement.Statut.REUSSI
        paiement.message = f"Paiement confirmé via {paiement.get_moyen_display()}."
        paiement.date_confirmation = timezone.now()
    else:
        paiement.statut = Paiement.Statut.ECHOUE
        paiement.message = "Paiement refusé par l'opérateur. Veuillez réessayer."

    paiement.save(update_fields=["statut", "message", "date_confirmation"])
    return paiement
