import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { formaterDate, classeStatut } from "../utils/format";

const FORM_VIDE = { nom_declarant: "", ninea: "", adresse_entreprise: "" };

export default function DeclarationActivite() {
  const navigate = useNavigate();
  const [form, setForm] = useState(FORM_VIDE);
  const [erreurs, setErreurs] = useState({});
  const [message, setMessage] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [editId, setEditId] = useState(null);

  const [declarations, setDeclarations] = useState([]);
  const [resume, setResume] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [selection, setSelection] = useState(null);
  const [suppression, setSuppression] = useState(null);

  const chargerResume = () => {
    api.get("/declarations/resume/").then((res) => setResume(res.data));
  };

  useEffect(() => {
    Promise.all([api.get("/declarations/resume/"), api.get("/declarations/")])
      .then(([r, d]) => {
        setResume(r.data);
        setDeclarations(d.data.results ?? d.data);
      })
      .finally(() => setChargement(false));
  }, []);

  const modifierChamp = (champ) => (e) => setForm({ ...form, [champ]: e.target.value });

  const champErreur = (champ) =>
    erreurs[champ] && (
      <span className="erreur-champ">
        {Array.isArray(erreurs[champ]) ? erreurs[champ][0] : erreurs[champ]}
      </span>
    );

  const validerFormulaire = () => {
    const erreursLocales = {};
    if (!form.nom_declarant.trim()) {
      erreursLocales.nom_declarant = "Le nom complet du déclarant est obligatoire.";
    }
    if (!form.ninea.trim()) {
      erreursLocales.ninea = "Le NINEA est obligatoire.";
    }
    if (!form.adresse_entreprise.trim()) {
      erreursLocales.adresse_entreprise = "L'adresse de l'entreprise est obligatoire.";
    }
    return erreursLocales;
  };

  const reinitialiser = () => {
    setForm(FORM_VIDE);
    setErreurs({});
    setMessage("");
    setEditId(null);
  };

  const annuler = () => {
    reinitialiser();
    navigate("/tableau-de-bord");
  };

  const consulterDeclaration = (d) => setSelection(d);

  const modifierDeclaration = (d) => {
    setForm({
      nom_declarant: d.nom_declarant,
      ninea: d.ninea,
      adresse_entreprise: d.adresse_entreprise,
    });
    setEditId(d.id);
    setErreurs({});
    setMessage("");
    setSelection(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const supprimerDeclaration = (d) => {
    if (!window.confirm(`Supprimer définitivement la déclaration ${d.reference} ?`)) return;
    setSuppression(d.id);
    api
      .delete(`/declarations/${d.id}/`)
      .then(() => {
        setDeclarations((liste) => liste.filter((x) => x.id !== d.id));
        setSelection((s) => (s?.id === d.id ? null : s));
        chargerResume();
      })
      .finally(() => setSuppression(null));
  };

  const soumettre = async (e) => {
    e.preventDefault();
    setMessage("");
    const erreursLocales = validerFormulaire();
    if (Object.keys(erreursLocales).length > 0) {
      setErreurs(erreursLocales);
      return;
    }
    setErreurs({});
    setEnvoi(true);
    try {
      if (editId) {
        const { data } = await api.patch(`/declarations/${editId}/`, form);
        setDeclarations((liste) => liste.map((d) => (d.id === editId ? data : d)));
        setMessage("Déclaration mise à jour avec succès.");
      } else {
        const { data } = await api.post("/declarations/", form);
        setDeclarations((liste) => [data, ...liste]);
        setMessage("Déclaration enregistrée avec succès.");
      }
      setForm(FORM_VIDE);
      setEditId(null);
      chargerResume();
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        setErreurs(data);
      } else {
        setErreurs({ global: "L'enregistrement de la déclaration a échoué. Réessayez." });
      }
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div>
      <div className="entete-page">
        <div>
          <h1>Déclaration d'activité</h1>
          <p className="sous-titre">
            Enregistrez les informations de votre entreprise pour effectuer votre déclaration
            d'activité.
          </p>
        </div>
      </div>

      <div className="carte">
        <h2>{editId ? "Modifier la déclaration" : "Nouvelle déclaration"}</h2>
        {message && <div className="alerte alerte-succes">{message}</div>}
        {erreurs.global && <div className="alerte alerte-erreur">{erreurs.global}</div>}
        <form onSubmit={soumettre}>
          <label>
            Nom complet du déclarant
            <input value={form.nom_declarant} onChange={modifierChamp("nom_declarant")} required />
            {champErreur("nom_declarant")}
          </label>
          <div className="grille-2">
            <label>
              NINEA
              <input value={form.ninea} onChange={modifierChamp("ninea")} required />
              {champErreur("ninea")}
            </label>
            <label>
              Adresse de l'entreprise
              <input
                value={form.adresse_entreprise}
                onChange={modifierChamp("adresse_entreprise")}
                required
              />
              {champErreur("adresse_entreprise")}
            </label>
          </div>
          <div className="hero-actions">
            <button className="btn btn-primaire" disabled={envoi}>
              {envoi
                ? "Enregistrement…"
                : editId
                ? "Mettre à jour la déclaration"
                : "Enregistrer la déclaration"}
            </button>
            <button type="button" className="btn btn-secondaire" onClick={reinitialiser}>
              Réinitialiser le formulaire
            </button>
            <button type="button" className="btn btn-secondaire" onClick={annuler}>
              Annuler
            </button>
          </div>
        </form>
      </div>

      {resume && (
        <div className="grille-cartes">
          <div className="carte-stat">
            <span className="stat-libelle">Déclarations totales</span>
            <span className="stat-valeur">{resume.nombre_total}</span>
          </div>
          <div className="carte-stat">
            <span className="stat-libelle">Déclarations enregistrées</span>
            <span className="stat-valeur vert">{resume.nombre_enregistrees}</span>
          </div>
          <div className="carte-stat">
            <span className="stat-libelle">Ce mois-ci</span>
            <span className="stat-valeur">{resume.nombre_ce_mois}</span>
          </div>
        </div>
      )}

      {selection && (
        <div className="carte">
          <div className="section-entete">
            <h2>Détails de la déclaration</h2>
          </div>
          <div className="detail-ligne">
            <span>Référence</span>
            <strong className="mono">{selection.reference}</strong>
          </div>
          <div className="detail-ligne">
            <span>Nom du déclarant</span>
            <strong>{selection.nom_declarant}</strong>
          </div>
          <div className="detail-ligne">
            <span>NINEA</span>
            <strong>{selection.ninea}</strong>
          </div>
          <div className="detail-ligne">
            <span>Adresse de l'entreprise</span>
            <strong>{selection.adresse_entreprise}</strong>
          </div>
          <div className="detail-ligne">
            <span>Date de déclaration</span>
            <strong>{formaterDate(selection.date_declaration)}</strong>
          </div>
          <div className="detail-ligne">
            <span>Statut</span>
            <span className={classeStatut[selection.statut]}>{selection.statut_libelle}</span>
          </div>
          <div className="hero-actions" style={{ marginTop: "1rem" }}>
            <button className="btn btn-secondaire" onClick={() => setSelection(null)}>
              Fermer
            </button>
          </div>
        </div>
      )}

      <div className="section">
        <div className="section-entete">
          <h2>Déclarations récentes</h2>
        </div>
        {chargement ? (
          <p className="chargement">Chargement…</p>
        ) : declarations.length === 0 ? (
          <div className="vide">Aucune déclaration enregistrée pour le moment.</div>
        ) : (
          <div className="tableau-conteneur">
            <table className="tableau">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Nom du déclarant</th>
                  <th>NINEA</th>
                  <th>Adresse de l'entreprise</th>
                  <th>Date de déclaration</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {declarations.map((d) => (
                  <tr key={d.id}>
                    <td className="mono">{d.reference}</td>
                    <td>{d.nom_declarant}</td>
                    <td className="mono">{d.ninea}</td>
                    <td>{d.adresse_entreprise}</td>
                    <td>{formaterDate(d.date_declaration)}</td>
                    <td>
                      <span className={classeStatut[d.statut]}>{d.statut_libelle}</span>
                    </td>
                    <td>
                      <div className="actions-tableau">
                        <button
                          type="button"
                          className="btn btn-secondaire btn-sm"
                          onClick={() => consulterDeclaration(d)}
                        >
                          Détails
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondaire btn-sm"
                          onClick={() => modifierDeclaration(d)}
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondaire btn-sm"
                          onClick={() => supprimerDeclaration(d)}
                          disabled={suppression === d.id}
                        >
                          {suppression === d.id ? "Suppression…" : "Supprimer"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
