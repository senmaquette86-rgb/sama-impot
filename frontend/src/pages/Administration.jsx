import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { formaterMontant, formaterDate, classeStatut } from "../utils/format";

const ONGLETS = [
  { id: "vue", label: "Vue d'ensemble" },
  { id: "contribuables", label: "Contribuables" },
  { id: "impots", label: "Impôts" },
  { id: "paiements", label: "Paiements" },
];

const TYPE_LABELS = {
  particulier: "Particulier",
  entreprise: "Entreprise / PME",
  independant: "Travailleur indépendant",
  commercant: "Commerçant",
};

export default function Administration() {
  const [onglet, setOnglet] = useState("vue");
  const [resume, setResume] = useState(null);
  const [paiements, setPaiements] = useState([]);
  const [impots, setImpots] = useState([]);
  const [contribuables, setContribuables] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [actualisation, setActualisation] = useState(false);
  const [erreur, setErreur] = useState("");
  const [recherche, setRecherche] = useState("");

  const charger = (silencieux = false) => {
    if (silencieux) setActualisation(true);
    else setChargement(true);
    setErreur("");

    Promise.all([
      api.get("/impots/resume/"),
      api.get("/paiements/"),
      api.get("/impots/"),
      api.get("/utilisateurs/"),
    ])
      .then(([r, p, i, u]) => {
        setResume(r.data);
        setPaiements(p.data.results ?? p.data);
        setImpots(i.data.results ?? i.data);
        setContribuables(u.data.results ?? u.data);
      })
      .catch(() =>
        setErreur("Impossible de charger les données d'administration pour le moment.")
      )
      .finally(() => {
        setChargement(false);
        setActualisation(false);
      });
  };

  useEffect(() => {
    charger();
  }, []);

  const tauxRecouvrement = useMemo(() => {
    if (!resume) return 0;
    const paye = Number(resume.total_paye) || 0;
    const du = Number(resume.total_du) || 0;
    const total = paye + du;
    if (!total) return 0;
    return Math.round((paye / total) * 100);
  }, [resume]);

  const correspond = (texte) =>
    (texte ?? "").toString().toLowerCase().includes(recherche.trim().toLowerCase());

  const paiementsFiltres = paiements.filter(
    (p) =>
      correspond(p.reference_transaction) ||
      correspond(p.impot_libelle) ||
      correspond(p.moyen_libelle) ||
      correspond(p.statut_libelle)
  );
  const impotsFiltres = impots.filter(
    (i) =>
      correspond(i.contribuable) ||
      correspond(i.libelle) ||
      correspond(i.reference) ||
      correspond(i.categorie_nom)
  );
  const contribuablesFiltres = contribuables.filter(
    (c) => correspond(c.nom_complet) || correspond(c.email) || correspond(c.ninea)
  );

  if (chargement) return <p className="chargement">Chargement…</p>;

  return (
    <div>
      <div className="entete-page">
        <div>
          <h1>Administration</h1>
          <p className="sous-titre">
            Suivi global des contribuables, des impôts et des paiements.
          </p>
        </div>
        <div className="entete-actions">
          <button
            className="btn btn-secondaire"
            onClick={() => charger(true)}
            disabled={actualisation}
          >
            {actualisation ? "Actualisation…" : "↻ Actualiser"}
          </button>
          <a
            className="btn btn-secondaire"
            href={`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/admin/`}
            target="_blank"
            rel="noreferrer"
          >
            Console Django
          </a>
        </div>
      </div>

      {erreur && <div className="alerte alerte-erreur">{erreur}</div>}

      {resume && (
        <>
          <div className="grille-cartes grille-cartes-5">
            <div className="carte-stat">
              <span className="stat-libelle">Contribuables</span>
              <span className="stat-valeur">{contribuables.length}</span>
            </div>
            <div className="carte-stat">
              <span className="stat-libelle">Impôts enregistrés</span>
              <span className="stat-valeur">{resume.nombre_impots}</span>
            </div>
            <div className="carte-stat">
              <span className="stat-libelle">Montant recouvré</span>
              <span className="stat-valeur vert">{formaterMontant(resume.total_paye)}</span>
            </div>
            <div className="carte-stat">
              <span className="stat-libelle">Reste à recouvrer</span>
              <span className="stat-valeur">{formaterMontant(resume.total_du)}</span>
            </div>
            <div className="carte-stat">
              <span className="stat-libelle">Impôts en retard</span>
              <span className="stat-valeur rouge">{resume.nombre_en_retard}</span>
            </div>
          </div>

          <div className="carte carte-taux">
            <div className="taux-entete">
              <h2>Taux de recouvrement</h2>
              <strong className={tauxRecouvrement >= 60 ? "vert" : "rouge"}>
                {tauxRecouvrement}%
              </strong>
            </div>
            <div className="taux-barre">
              <div
                className="taux-barre-remplie"
                style={{ width: `${tauxRecouvrement}%` }}
              />
            </div>
          </div>
        </>
      )}

      <div className="onglets">
        {ONGLETS.map((o) => (
          <button
            key={o.id}
            className={`onglet ${onglet === o.id ? "actif" : ""}`}
            onClick={() => setOnglet(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>

      {onglet !== "vue" && (
        <div className="barre-recherche">
          <input
            placeholder="Rechercher (nom, email, référence…)"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
      )}

      {onglet === "vue" && (
        <div className="section">
          <div className="section-entete">
            <h2>Derniers paiements</h2>
          </div>
          {paiements.length === 0 ? (
            <div className="vide">Aucun paiement enregistré.</div>
          ) : (
            <div className="tableau-conteneur">
              <table className="tableau">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Référence</th>
                    <th>Impôt</th>
                    <th>Moyen</th>
                    <th>Montant</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {paiements.slice(0, 8).map((p) => (
                    <tr key={p.id}>
                      <td>{formaterDate(p.date_creation)}</td>
                      <td className="mono">{p.reference_transaction}</td>
                      <td>{p.impot_libelle}</td>
                      <td>{p.moyen_libelle}</td>
                      <td>{formaterMontant(p.montant)}</td>
                      <td>
                        <span className={classeStatut[p.statut]}>{p.statut_libelle}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {onglet === "contribuables" && (
        <div className="section">
          <div className="section-entete">
            <h2>
              Contribuables{" "}
              <span className="compteur">({contribuablesFiltres.length})</span>
            </h2>
          </div>
          {contribuablesFiltres.length === 0 ? (
            <div className="vide">Aucun contribuable ne correspond à la recherche.</div>
          ) : (
            <div className="tableau-conteneur">
              <table className="tableau">
                <thead>
                  <tr>
                    <th>Contribuable</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Type</th>
                    <th>Impôts</th>
                    <th>Payé</th>
                    <th>Dû</th>
                    <th>Inscrit le</th>
                  </tr>
                </thead>
                <tbody>
                  {contribuablesFiltres.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.nom_complet}</strong>
                        {c.ninea && <span className="secondaire-inline"> · NINEA {c.ninea}</span>}
                      </td>
                      <td>{c.email}</td>
                      <td className="mono">{c.telephone || "—"}</td>
                      <td>{TYPE_LABELS[c.type_contribuable] || c.type_contribuable}</td>
                      <td>{c.nombre_impots}</td>
                      <td className="vert">{formaterMontant(c.total_paye)}</td>
                      <td>{formaterMontant(c.total_du)}</td>
                      <td>{formaterDate(c.date_inscription)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {onglet === "impots" && (
        <div className="section">
          <div className="section-entete">
            <h2>
              Impôts <span className="compteur">({impotsFiltres.length})</span>
            </h2>
          </div>
          {impotsFiltres.length === 0 ? (
            <div className="vide">Aucun impôt ne correspond à la recherche.</div>
          ) : (
            <div className="tableau-conteneur">
              <table className="tableau">
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Contribuable</th>
                    <th>Libellé</th>
                    <th>Montant</th>
                    <th>Échéance</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {impotsFiltres.slice(0, 50).map((i) => (
                    <tr key={i.id}>
                      <td className="mono">{i.reference}</td>
                      <td>{i.contribuable}</td>
                      <td>{i.libelle}</td>
                      <td>{formaterMontant(i.montant)}</td>
                      <td>{formaterDate(i.date_echeance)}</td>
                      <td>
                        <span className={classeStatut[i.statut_courant]}>
                          {i.statut_libelle}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {impotsFiltres.length > 50 && (
                <p className="note-tableau">
                  Affichage limité aux 50 premiers résultats. Affinez la recherche pour voir
                  des résultats plus précis.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {onglet === "paiements" && (
        <div className="section">
          <div className="section-entete">
            <h2>
              Paiements <span className="compteur">({paiementsFiltres.length})</span>
            </h2>
          </div>
          {paiementsFiltres.length === 0 ? (
            <div className="vide">Aucun paiement ne correspond à la recherche.</div>
          ) : (
            <div className="tableau-conteneur">
              <table className="tableau">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Référence</th>
                    <th>Impôt</th>
                    <th>Téléphone</th>
                    <th>Moyen</th>
                    <th>Montant</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {paiementsFiltres.slice(0, 50).map((p) => (
                    <tr key={p.id}>
                      <td>{formaterDate(p.date_creation)}</td>
                      <td className="mono">{p.reference_transaction}</td>
                      <td>{p.impot_libelle}</td>
                      <td className="mono">{p.numero_telephone}</td>
                      <td>{p.moyen_libelle}</td>
                      <td>{formaterMontant(p.montant)}</td>
                      <td>
                        <span className={classeStatut[p.statut]}>{p.statut_libelle}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {paiementsFiltres.length > 50 && (
                <p className="note-tableau">
                  Affichage limité aux 50 premiers résultats. Affinez la recherche pour voir
                  des résultats plus précis.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
