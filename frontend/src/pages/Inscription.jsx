import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ChampMotDePasse from "../components/ChampMotDePasse.jsx";
import ChampTelephone from "../components/ChampTelephone.jsx";

const TYPES = [
  { value: "particulier", label: "Particulier" },
  { value: "entreprise", label: "Entreprise / PME" },
  { value: "independant", label: "Travailleur indépendant" },
  { value: "commercant", label: "Commerçant" },
];

export default function Inscription() {
  const { inscription } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    telephone: "",
    type_contribuable: "particulier",
    password: "",
    password2: "",
  });
  const [erreurs, setErreurs] = useState({});
  const [envoi, setEnvoi] = useState(false);

  const modifier = (champ) => (e) =>
    setForm({ ...form, [champ]: e.target.value });

  const soumettre = async (e) => {
    e.preventDefault();
    setErreurs({});
    setEnvoi(true);
    try {
      await inscription(form);
      navigate("/verifier-email", { state: { email: form.email } });
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        setErreurs(data);
      } else {
        setErreurs({ global: "Une erreur est survenue. Réessayez." });
      }
    } finally {
      setEnvoi(false);
    }
  };

  const champErreur = (champ) =>
    erreurs[champ] && (
      <span className="erreur-champ">
        {Array.isArray(erreurs[champ]) ? erreurs[champ][0] : erreurs[champ]}
      </span>
    );

  return (
    <div className="page-auth">
      <div className="carte-auth carte-auth-large">
        <Link to="/" className="logo logo-centre">
          <span className="logo-badge">SI</span>
          <span>Sama Impôt</span>
        </Link>
        <h1>Créer un compte</h1>
        <p className="sous-titre">Rejoignez la plateforme en quelques secondes.</p>

        {erreurs.global && (
          <div className="alerte alerte-erreur">{erreurs.global}</div>
        )}

        <form onSubmit={soumettre}>
          <div className="grille-2">
            <label>
              Prénom
              <input value={form.first_name} onChange={modifier("first_name")} required />
              {champErreur("first_name")}
            </label>
            <label>
              Nom
              <input value={form.last_name} onChange={modifier("last_name")} required />
              {champErreur("last_name")}
            </label>
          </div>
          <label>
            Adresse email
            <input type="email" value={form.email} onChange={modifier("email")} required />
            {champErreur("email")}
          </label>
          <div className="grille-2">
            <label>
              Téléphone
              <ChampTelephone
                value={form.telephone}
                onChange={(valeur) => setForm({ ...form, telephone: valeur })}
              />
              {champErreur("telephone")}
            </label>
            <label>
              Type de contribuable
              <select value={form.type_contribuable} onChange={modifier("type_contribuable")}>
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grille-2">
            <label>
              Mot de passe
              <ChampMotDePasse
                value={form.password}
                onChange={modifier("password")}
                required
                autoComplete="new-password"
              />
              {champErreur("password")}
            </label>
            <label>
              Confirmation
              <ChampMotDePasse
                value={form.password2}
                onChange={modifier("password2")}
                required
                autoComplete="new-password"
              />
              {champErreur("password2")}
            </label>
          </div>
          <button className="btn btn-primaire btn-bloc" disabled={envoi}>
            {envoi ? "Création…" : "Créer mon compte"}
          </button>
        </form>

        <p className="lien-bas">
          Déjà inscrit ? <Link to="/connexion">Connectez-vous</Link>
        </p>
      </div>
    </div>
  );
}
