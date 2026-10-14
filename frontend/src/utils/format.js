export function formaterMontant(valeur) {
  const nombre = Number(valeur || 0);
  return new Intl.NumberFormat("fr-FR").format(nombre) + " FCFA";
}

export function formaterDate(valeur) {
  if (!valeur) return "—";
  return new Date(valeur).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Nettoie une saisie de téléphone : ne garde que les chiffres,
 * limités à 9 (format sénégalais, sans le +221).
 */
export function nettoyerTelephone(valeur) {
  return (valeur || "").replace(/\D/g, "").slice(0, 9);
}

export const classeStatut = {
  paye: "badge badge-vert",
  impaye: "badge badge-orange",
  en_retard: "badge badge-rouge",
  reussi: "badge badge-vert",
  en_attente: "badge badge-orange",
  echoue: "badge badge-rouge",
  enregistree: "badge badge-vert",
};
