import { useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";
import ChampTelephone from "../components/ChampTelephone.jsx";

export default function Profil() {
  const { utilisateur, majProfil } = useAuth();
  const [form, setForm] = useState({
    first_name: utilisateur.first_name || "",
    last_name: utilisateur.last_name || "",
    telephone: utilisateur.telephone || "",
    adresse: utilisateur.adresse || "",
    ninea: utilisateur.ninea || "",
  });
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const modifier = (champ) => (e) => setForm({ ...form, [champ]: e.target.value });

  const enregistrer = async (e) => {
    e.preventDefault();
    setMessage("");
    setErreur("");
    setEnvoi(true);
    try {
      const { data } = await api.patch("/auth/profil/", form);
      majProfil(data);
      setMessage("Profil mis à jour avec succès.");
    } catch {
      setErreur("La mise à jour a échoué.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div>
      <div className="entete-page">
        <div>
          <h1>Mon profil</h1>
          <p className="sous-titre">Gérez vos informations personnelles.</p>
        </div>
      </div>

      <div className="carte carte-profil">
        {message && <div className="alerte alerte-succes">{message}</div>}
        {erreur && <div className="alerte alerte-erreur">{erreur}</div>}
        <form onSubmit={enregistrer}>
          <label className="lecture-seule">
            Adresse email
            <input value={utilisateur.email} disabled />
          </label>
          <div className="grille-2">
            <label>
              Prénom
              <input value={form.first_name} onChange={modifier("first_name")} required />
            </label>
            <label>
              Nom
              <input value={form.last_name} onChange={modifier("last_name")} required />
            </label>
          </div>
          <div className="grille-2">
            <label>
              Téléphone
              <ChampTelephone
                value={form.telephone}
                onChange={(valeur) => setForm({ ...form, telephone: valeur })}
              />
            </label>
            <label>
              NINEA / identifiant fiscal
              <input value={form.ninea} onChange={modifier("ninea")} />
            </label>
          </div>
          <label>
            Adresse
            <input value={form.adresse} onChange={modifier("adresse")} />
          </label>
          <button className="btn btn-primaire" disabled={envoi}>
            {envoi ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      </div>
    </div>
  );
}
