import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import ChampMotDePasse from "../components/ChampMotDePasse.jsx";

export default function MotDePasseOublie() {
  const navigate = useNavigate();
  const [etape, setEtape] = useState(1); // 1 = demande du code, 2 = saisie code + nouveau mdp

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [nouveauMotDePasse2, setNouveauMotDePasse2] = useState("");

  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const demanderCode = async (e) => {
    e.preventDefault();
    setErreur("");
    setMessage("");
    setEnvoi(true);
    try {
      const { data } = await api.post("/auth/mot-de-passe-oublie/", { email });
      setMessage(data.message);
      setEtape(2);
    } catch {
      setErreur("Impossible d'envoyer la demande pour le moment. Réessayez.");
    } finally {
      setEnvoi(false);
    }
  };

  const reinitialiser = async (e) => {
    e.preventDefault();
    setErreur("");
    setMessage("");
    setEnvoi(true);
    try {
      await api.post("/auth/reinitialiser-mot-de-passe/", {
        email,
        code,
        nouveau_mot_de_passe: nouveauMotDePasse,
        nouveau_mot_de_passe2: nouveauMotDePasse2,
      });
      setMessage("Mot de passe réinitialisé avec succès. Redirection…");
      setTimeout(() => navigate("/connexion"), 1200);
    } catch (err) {
      const data = err.response?.data;
      setErreur(
        data?.code?.[0] ||
          data?.nouveau_mot_de_passe?.[0] ||
          data?.nouveau_mot_de_passe2?.[0] ||
          data?.email?.[0] ||
          "Une erreur est survenue. Réessayez."
      );
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="page-auth">
      <div className="carte-auth">
        <Link to="/" className="logo logo-centre">
          <span className="logo-badge">SI</span>
          <span>Sama Impôt</span>
        </Link>
        <h1>Mot de passe oublié</h1>
        <p className="sous-titre">
          {etape === 1
            ? "Saisissez votre adresse email pour recevoir un code de réinitialisation."
            : "Saisissez le code reçu par email et choisissez un nouveau mot de passe."}
        </p>

        {message && <div className="alerte alerte-succes">{message}</div>}
        {erreur && <div className="alerte alerte-erreur">{erreur}</div>}

        {etape === 1 ? (
          <form onSubmit={demanderCode}>
            <label>
              Adresse email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <button className="btn btn-primaire btn-bloc" disabled={envoi}>
              {envoi ? "Envoi…" : "Recevoir le code"}
            </button>
          </form>
        ) : (
          <form onSubmit={reinitialiser}>
            <label>
              Code de vérification
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                className="champ-code"
                required
              />
            </label>
            <label>
              Nouveau mot de passe
              <ChampMotDePasse
                value={nouveauMotDePasse}
                onChange={(e) => setNouveauMotDePasse(e.target.value)}
                required
                autoComplete="new-password"
              />
            </label>
            <label>
              Confirmation
              <ChampMotDePasse
                value={nouveauMotDePasse2}
                onChange={(e) => setNouveauMotDePasse2(e.target.value)}
                required
                autoComplete="new-password"
              />
            </label>
            <button className="btn btn-primaire btn-bloc" disabled={envoi}>
              {envoi ? "Réinitialisation…" : "Réinitialiser le mot de passe"}
            </button>
          </form>
        )}

        <p className="lien-bas">
          <Link to="/connexion">Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}
