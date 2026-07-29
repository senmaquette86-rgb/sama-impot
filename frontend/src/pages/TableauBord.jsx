import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";
import { formaterMontant, formaterDate, classeStatut } from "../utils/format";

export default function TableauBord() {
  const { utilisateur } = useAuth();
  const [resume, setResume] = useState(null);
  const [impots, setImpots] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/impots/resume/"), api.get("/impots/")])
      .then(([r, i]) => {
        setResume(r.data);
        setImpots(i.data.results);
      })
      .finally(() => setChargement(false));
  }, []);

  if (chargement) return <p className="chargement">Chargement…</p>;

  const aRegler = impots.filter((i) => i.statut !== "paye").slice(0, 4);

  return (
    <div>
      <div className="entete-page">
        <div>
          <h1>Bonjour, {utilisateur?.first_name} </h1>
          <p className="sous-titre">Voici un aperçu de votre situation fiscale.</p>
        </div>
        <div className="hero-actions">
          <Link to="/payer" className="btn btn-primaire">
            Payer un impôt
          </Link>
          <Link to="/impots" className="btn btn-secondaire">
            Voir tous mes impôts
          </Link>
        </div>
      </div>

      <div className="grille-cartes">
        <div className="carte-stat">
          <span className="stat-libelle">Total à régler</span>
          <span className="stat-valeur">{formaterMontant(resume.total_du)}</span>
        </div>
        <div className="carte-stat">
          <span className="stat-libelle">Total payé</span>
          <span className="stat-valeur vert">{formaterMontant(resume.total_paye)}</span>
        </div>
        <div className="carte-stat">
          <span className="stat-libelle">Impôts impayés</span>
          <span className="stat-valeur">{resume.nombre_impayes}</span>
        </div>
        <div className="carte-stat">
          <span className="stat-libelle">En retard</span>
          <span className="stat-valeur rouge">{resume.nombre_en_retard}</span>
        </div>
      </div>

      <div className="section">
        <div className="section-entete">
          <h2>À régler prochainement</h2>
        </div>
        {aRegler.length === 0 ? (
          <div className="vide">Aucun impôt en attente. Tout est à jour ! </div>
        ) : (
          <div className="liste-impots">
            {aRegler.map((impot) => (
              <div className="ligne-impot" key={impot.id}>
                <div>
                  <strong>{impot.libelle}</strong>
                  <span className="secondaire">
                    {impot.categorie_nom} · échéance {formaterDate(impot.date_echeance)}
                  </span>
                </div>
                <div className="ligne-impot-droite">
                  <span className={classeStatut[impot.statut_courant]}>
                    {impot.statut_libelle}
                  </span>
                  <strong>{formaterMontant(impot.montant)}</strong>
                  <Link className="btn btn-primaire btn-sm" to={`/impots/${impot.id}/paiement`}>
                    Payer
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
