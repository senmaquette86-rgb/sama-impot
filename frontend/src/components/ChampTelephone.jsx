import { nettoyerTelephone } from "../utils/format.js";

/**
 * Champ téléphone sénégalais : préfixe fixe "🇸🇳 +221" suivi de 9 chiffres.
 */
export default function ChampTelephone({
  value,
  onChange,
  placeholder = "771234567",
  required,
}) {
  return (
    <div className="champ-telephone">
      <span className="indicatif-telephone">🇸🇳 +221</span>
      <input
        type="tel"
        value={value}
        onChange={(e) => onChange(nettoyerTelephone(e.target.value))}
        inputMode="numeric"
        maxLength={9}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}
