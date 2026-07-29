import { useEffect, useState } from "react";
import api from "../api/client";
import { formaterMontant, formaterDate, classeStatut } from "../utils/format";

export default function Historique() {
  const [paiements, setPaiements] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    api
      .get("/paiements/")
      .then((res) => setPaiements(res.data.results))
      .finally(() => setChargement(false));
  }, []);

  return (
    <div>
      <div className="entete-page">
        <div>
          <h1>Historique des paiements</h1>
          <p className="sous-titre">Retrouvez toutes vos transactions.</p>
        </div>
      </div>

      {chargement ? (
        <p className="chargement">Chargement…</p>
      ) : paiements.length === 0 ? (
        <div className="vide">Aucun paiement pour le moment.</div>
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
              {paiements.map((p) => (
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
  );
}
