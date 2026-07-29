import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Accueil() {
  const { utilisateur } = useAuth();

  return (
    <div className="accueil">
      <header className="accueil-entete">
        <div className="logo">
          <span className="logo-badge">SI</span>
          <span>Sama Impôt</span>
        </div>
        <nav className="accueil-nav">
          {utilisateur ? (
            <Link className="btn btn-primaire" to="/tableau-de-bord">
              Mon espace
            </Link>
          ) : (
            <>
              <Link className="btn btn-secondaire" to="/connexion">
                Connexion
              </Link>
              <Link className="btn btn-primaire" to="/inscription">
                Créer un compte
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="hero">
        <div className="hero-texte">
          <h1>Payez vos impôts en ligne, simplement.</h1>
          <p>
            Sama Impôt digitalise le paiement des impôts au Sénégal. Consultez
            vos impôts dus, réglez-les via Wave ou Orange Money et suivez votre
            historique, où que vous soyez.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primaire btn-lg" to="/inscription">
              Commencer maintenant
            </Link>
            <Link className="btn btn-secondaire btn-lg" to="/connexion">
              J'ai déjà un compte
            </Link>
          </div>
        </div>
        <div className="hero-carte">
          <div className="carte-impot-demo">
            <span className="badge badge-orange">Impayé</span>
            <h3>Impôt sur le revenu 2025</h3>
            <p className="montant-demo">250 000 FCFA</p>
            <div className="moyens">
              <span className="moyen-pilule moyen-wave">Wave</span>
              <span className="moyen-pilule moyen-om">Orange Money</span>
            </div>
          </div>
        </div>
      </section>

      <section className="fonctionnalites">
        <div className="fonctionnalite">
          <h3>Consultation claire</h3>
          <p>Visualisez vos impôts dus, leurs échéances et leur statut.</p>
        </div>
        <div className="fonctionnalite">
          <h3>Paiement mobile</h3>
          <p>Réglez en quelques secondes via Wave ou Orange Money.</p>
        </div>
        <div className="fonctionnalite">
          <h3>Rappels & suivi</h3>
          <p>Recevez des rappels d'échéance et gardez l'historique complet.</p>
        </div>
        <div className="fonctionnalite">
          <h3>Sécurité</h3>
          <p>Authentification sécurisée et protection de vos données.</p>
        </div>
      </section>

      <footer className="accueil-pied">
        <p>Projet Sama Impôt — ISEP Diamniadio</p>
      </footer>
    </div>
  );
}
