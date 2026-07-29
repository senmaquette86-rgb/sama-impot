import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/client";
import { formaterMontant, formaterDate } from "../utils/format";
import ChampTelephone from "../components/ChampTelephone.jsx";

const MOYENS = [
  { value: "wave", label: "Wave", classe: "moyen-wave" },
  { value: "orange_money", label: "Orange Money", classe: "moyen-om" },
];

export default function Paiement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [impot, setImpot] = useState(null);
  const [moyen, setMoyen] = useState("wave");
  const [telephone, setTelephone] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    api
      .get(`/impots/${id}/`)
      .then((res) => setImpot(res.data))
      .catch(() => setErreur("Impôt introuvable."));
  }, [id]);

  const payer = async (e) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      const { data } = await api.post("/paiements/", {
        impot: Number(id),
        moyen,
        numero_telephone: telephone,
      });
      setResultat({ succes: true, paiement: data });
    } catch (err) {
      if (err.response?.status === 402) {
        setResultat({ succes: false, paiement: err.response.data });
      } else {
        const data = err.response?.data;
        setErreur(
          data?.numero_telephone?.[0] ||
            data?.impot?.[0] ||
            data?.detail ||
            "Le paiement n'a pas pu être traité."
        );
      }
    } finally {
      setEnvoi(false);
    }
  };

  if (erreur && !impot) return <div className="alerte alerte-erreur">{erreur}</div>;
  if (!impot) return <p className="chargement">Chargement…</p>;

  if (resultat) {
    return (
      <div className="page-resultat">
        <div className={`carte-resultat ${resultat.succes ? "succes" : "echec"}`}>
          <div className="icone-resultat">{resultat.succes ? "✓" : "✕"}</div>
          <h1>{resultat.succes ? "Paiement confirmé" : "Paiement échoué"}</h1>
          <p>{resultat.paiement.message}</p>
          <div className="recu">
            <div>
              <span>Référence</span>
              <strong className="mono">{resultat.paiement.reference_transaction}</strong>
            </div>
            <div>
              <span>Impôt</span>
              <strong>{resultat.paiement.impot_libelle}</strong>
            </div>
            <div>
              <span>Montant</span>
              <strong>{formaterMontant(resultat.paiement.montant)}</strong>
            </div>
            <div>
              <span>Moyen</span>
              <strong>{resultat.paiement.moyen_libelle}</strong>
            </div>
          </div>
          <div className="hero-actions">
            {!resultat.succes && (
              <button className="btn btn-primaire" onClick={() => setResultat(null)}>
                Réessayer
              </button>
            )}
            <button className="btn btn-secondaire" onClick={() => navigate("/historique")}>
              Voir l'historique
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="entete-page">
        <div>
          <h1>Paiement d'un impôt</h1>
          <Link to="/impots" className="lien-retour">
            ← Retour à mes impôts
          </Link>
        </div>
      </div>

      <div className="grille-paiement">
        <div className="carte">
          <h2>Détail de l'impôt</h2>
          <div className="detail-ligne">
            <span>Libellé</span>
            <strong>{impot.libelle}</strong>
          </div>
          <div className="detail-ligne">
            <span>Catégorie</span>
            <strong>{impot.categorie_nom}</strong>
          </div>
          <div className="detail-ligne">
            <span>Année fiscale</span>
            <strong>{impot.annee_fiscale}</strong>
          </div>
          <div className="detail-ligne">
            <span>Échéance</span>
            <strong>{formaterDate(impot.date_echeance)}</strong>
          </div>
          <div className="detail-ligne total">
            <span>Montant à payer</span>
            <strong>{formaterMontant(impot.montant)}</strong>
          </div>
        </div>

        <div className="carte">
          <h2>Moyen de paiement</h2>
          {erreur && <div className="alerte alerte-erreur">{erreur}</div>}
          <form onSubmit={payer}>
            <div className="choix-moyens">
              {MOYENS.map((m) => (
                <button
                  type="button"
                  key={m.value}
                  className={`choix-moyen ${m.classe} ${moyen === m.value ? "selectionne" : ""}`}
                  onClick={() => setMoyen(m.value)}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <label>
              Numéro de téléphone
              <ChampTelephone value={telephone} onChange={setTelephone} required />
            </label>
            <p className="note">
              Paiement sécurisé simulé. Aucune somme réelle ne sera débitée.
            </p>
            <button className="btn btn-primaire btn-bloc" disabled={envoi}>
              {envoi ? "Traitement…" : `Payer ${formaterMontant(impot.montant)}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
