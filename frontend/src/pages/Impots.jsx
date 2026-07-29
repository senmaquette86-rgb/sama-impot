import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { formaterMontant, formaterDate, classeStatut } from "../utils/format";

const FILTRES = [
  { value: "", label: "Tous" },
  { value: "impaye", label: "Impayés" },
  { value: "paye", label: "Payés" },
];

export default function Impots() {
  const [impots, setImpots] = useState([]);
  const [filtre, setFiltre] = useState("");
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    setChargement(true);
    api
      .get("/impots/", { params: filtre ? { statut: filtre } : {} })
      .then((res) => setImpots(res.data.results))
      .finally(() => setChargement(false));
  }, [filtre]);

  return (
    <div>
      <div className="entete-page">
        <div>
          <h1>Mes impôts</h1>
          <p className="sous-titre">Consultez le détail de vos impôts et réglez-les.</p>
        </div>
        <Link to="/payer" className="btn btn-primaire">
          Payer un impôt
        </Link>
      </div>

      <div className="onglets">
        {FILTRES.map((f) => (
          <button
            key={f.value}
            className={filtre === f.value ? "onglet actif" : "onglet"}
            onClick={() => setFiltre(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {chargement ? (
        <p className="chargement">Chargement…</p>
      ) : impots.length === 0 ? (
        <div className="vide">
          <p>Aucun impôt à afficher pour le moment.</p>
          <Link to="/payer" className="btn btn-primaire" style={{ marginTop: "1rem" }}>
            Payer un impôt
          </Link>
        </div>
      ) : (
        <div className="tableau-conteneur">
          <table className="tableau">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Libellé</th>
                <th>Catégorie</th>
                <th>Année</th>
                <th>Échéance</th>
                <th>Montant</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {impots.map((impot) => (
                <tr key={impot.id}>
                  <td className="mono">{impot.reference}</td>
                  <td>{impot.libelle}</td>
                  <td>{impot.categorie_nom}</td>
                  <td>{impot.annee_fiscale}</td>
                  <td>{formaterDate(impot.date_echeance)}</td>
                  <td>{formaterMontant(impot.montant)}</td>
                  <td>
                    <span className={classeStatut[impot.statut_courant]}>
                      {impot.statut_libelle}
                    </span>
                  </td>
                  <td>
                    {impot.statut_courant !== "paye" && (
                      <Link
                        className="btn btn-primaire btn-sm"
                        to={`/impots/${impot.id}/paiement`}
                      >
                        Payer
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
