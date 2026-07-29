import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ChampMotDePasse from "../components/ChampMotDePasse.jsx";

export default function Connexion() {
  const { connexion } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const soumettre = async (e) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      await connexion(email, password);
      navigate("/tableau-de-bord");
    } catch (err) {
      setErreur(
        err.response?.data?.detail || "Email ou mot de passe incorrect."
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
        <h1>Connexion</h1>
        <p className="sous-titre">Accédez à votre espace contribuable.</p>

        {erreur && <div className="alerte alerte-erreur">{erreur}</div>}

        <form onSubmit={soumettre}>
          <label>
            Adresse email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Mot de passe
            <ChampMotDePasse
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <p className="lien-mot-de-passe-oublie">
            <Link to="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
          </p>
          <button className="btn btn-primaire btn-bloc" disabled={envoi}>
            {envoi ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <p className="lien-bas">
          Pas encore de compte ? <Link to="/inscription">Inscrivez-vous</Link>
        </p>
      </div>
    </div>
  );
}
