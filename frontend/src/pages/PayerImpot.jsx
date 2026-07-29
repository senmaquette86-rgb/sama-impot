import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { formaterMontant } from "../utils/format";
import ChampTelephone from "../components/ChampTelephone.jsx";

const MOYENS = [
  { value: "wave", label: "Wave", classe: "moyen-wave" },
  { value: "orange_money", label: "Orange Money", classe: "moyen-om" },
];

const ANNEE = new Date().getFullYear();

export default function PayerImpot() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    categorie: "",
    libelle: "",
    montant: "",
    annee_fiscale: ANNEE,
  });
  const [moyen, setMoyen] = useState("wave");
  const [telephone, setTelephone] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    api.get("/categories/").then((res) => setCategories(res.data.results ?? res.data));
  }, []);

  const choisirCategorie = (e) => {
    const id = e.target.value;
    const cat = categories.find((c) => String(c.id) === String(id));
    setForm({
      ...form,
      categorie: id,
      libelle: cat ? `${cat.nom} ${ANNEE}` : "",
      montant: cat?.montant_indicatif ?? form.montant,
    });
  };

  const modifier = (champ) => (e) => setForm({ ...form, [champ]: e.target.value });

  const payer = async (e) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      // 1. Déclaration de l'impôt à payer.
      const { data: impot } = await api.post("/impots/", {
        categorie: Number(form.categorie),
        libelle: form.libelle,
        montant: form.montant,
        annee_fiscale: Number(form.annee_fiscale),
      });
      // 2. Paiement via le moyen choisi.
      const { data } = await api.post("/paiements/", {
        impot: impot.id,
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
            data?.montant?.[0] ||
            data?.categorie?.[0] ||
            data?.detail ||
            "Le paiement n'a pas pu être traité."
        );
      }
    } finally {
      setEnvoi(false);
    }
  };

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
            <button className="btn btn-secondaire" onClick={() => navigate("/impots")}>
              Mes impôts
            </button>
          </div>
        </div>
      </div>
    );
  }

  const categorieChoisie = categories.find((c) => String(c.id) === String(form.categorie));

  return (
    <div>
      <div className="entete-page">
        <div>
          <h1>Payer un impôt</h1>
          <p className="sous-titre">
            Choisissez un type d'impôt, indiquez le montant puis payez via Wave ou Orange Money.
          </p>
        </div>
      </div>

      <div className="grille-paiement">
        <div className="carte">
          <h2>1. Impôt à payer</h2>
          {erreur && <div className="alerte alerte-erreur">{erreur}</div>}
          <form onSubmit={payer}>
            <label>
              Type d'impôt
              <select value={form.categorie} onChange={choisirCategorie} required>
                <option value="">— Sélectionnez un impôt —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </label>
            {categorieChoisie?.description && (
              <p className="note">{categorieChoisie.description}</p>
            )}
            <label>
              Libellé
              <input value={form.libelle} onChange={modifier("libelle")} required />
            </label>
            <div className="grille-2">
              <label>
                Montant (FCFA)
                <input
                  type="number"
                  min="1"
                  value={form.montant}
                  onChange={modifier("montant")}
                  required
                />
              </label>
              <label>
                Année fiscale
                <input
                  type="number"
                  value={form.annee_fiscale}
                  onChange={modifier("annee_fiscale")}
                  required
                />
              </label>
            </div>

            <h2 style={{ marginTop: "1rem" }}>2. Moyen de paiement</h2>
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
              {envoi
                ? "Traitement…"
                : `Payer ${form.montant ? formaterMontant(form.montant) : ""}`}
            </button>
          </form>
        </div>

        <div className="carte">
          <h2>Récapitulatif</h2>
          <div className="detail-ligne">
            <span>Type d'impôt</span>
            <strong>{categorieChoisie?.nom || "—"}</strong>
          </div>
          <div className="detail-ligne">
            <span>Année</span>
            <strong>{form.annee_fiscale}</strong>
          </div>
          <div className="detail-ligne">
            <span>Moyen</span>
            <strong>{MOYENS.find((m) => m.value === moyen)?.label}</strong>
          </div>
          <div className="detail-ligne total">
            <span>Montant</span>
            <strong>{form.montant ? formaterMontant(form.montant) : "—"}</strong>
          </div>
          <p className="note" style={{ marginTop: "1rem" }}>
            Astuce : sélectionner un type d'impôt pré-remplit le montant indicatif,
            que vous pouvez ensuite ajuster.
          </p>
        </div>
      </div>
    </div>
  );
}
