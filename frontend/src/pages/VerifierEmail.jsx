import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";

export default function VerifierEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { connexion } = useAuth();

  const [email, setEmail] = useState(location.state?.email || "");
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [renvoiEnCours, setRenvoiEnCours] = useState(false);

  const verifier = async (e) => {
    e.preventDefault();
    setErreur("");
    setMessage("");
    setEnvoi(true);
    try {
      await api.post("/auth/verifier-email/", { email, code });
      setMessage("Email vérifié avec succès ! Connexion en cours…");
      // Redirige vers la connexion ; le mot de passe n'est pas conservé côté
      // client, l'utilisateur le saisit une dernière fois pour se connecter.
      setTimeout(() => navigate("/connexion"), 1200);
    } catch (err) {
      const data = err.response?.data;
      setErreur(
        data?.code?.[0] || data?.email?.[0] || data?.detail ||
          "Code invalide ou expiré. Réessayez ou demandez un nouveau code."
      );
    } finally {
      setEnvoi(false);
    }
  };

  const renvoyer = async () => {
    setErreur("");
    setMessage("");
    setRenvoiEnCours(true);
    try {
      await api.post("/auth/renvoyer-code/", { email });
      setMessage("Un nouveau code vous a été envoyé par email.");
    } catch (err) {
      setErreur(
        err.response?.data?.email?.[0] || "Impossible de renvoyer un code pour le moment."
      );
    } finally {
      setRenvoiEnCours(false);
    }
  };

  return (
    <div className="page-auth">
      <div className="carte-auth">
        <Link to="/" className="logo logo-centre">
          <span className="logo-badge">SI</span>
          <span>Sama Impôt</span>
        </Link>
        <h1>Vérifiez votre email</h1>
        <p className="sous-titre">
          Nous avons envoyé un code à 6 chiffres à votre adresse email.
          Saisissez-le ci-dessous pour activer votre compte.
        </p>

        {message && <div className="alerte alerte-succes">{message}</div>}
        {erreur && <div className="alerte alerte-erreur">{erreur}</div>}

        <form onSubmit={verifier}>
          <label>
            Adresse email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
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
          <button className="btn btn-primaire btn-bloc" disabled={envoi}>
            {envoi ? "Vérification…" : "Vérifier mon compte"}
          </button>
        </form>

        <p className="lien-bas">
          Vous n'avez rien reçu ?{" "}
          <button
            type="button"
            className="lien-bouton"
            onClick={renvoyer}
            disabled={renvoiEnCours || !email}
          >
            {renvoiEnCours ? "Envoi…" : "Renvoyer le code"}
          </button>
        </p>
        <p className="lien-bas">
          <Link to="/connexion">Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}
