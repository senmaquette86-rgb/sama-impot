import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      setChargement(false);
      return;
    }
    api
      .get("/auth/profil/")
      .then((res) => setUtilisateur(res.data))
      .catch(() => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
      })
      .finally(() => setChargement(false));
  }, []);

  const connexion = async (email, password) => {
    const { data } = await api.post("/auth/connexion/", { email, password });
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    setUtilisateur(data.utilisateur);
    return data.utilisateur;
  };

  const inscription = async (donnees) => {
    // Le compte reste inactif tant que l'email n'est pas vérifié :
    // pas de connexion automatique ici, l'utilisateur doit d'abord saisir le code reçu.
    const { data } = await api.post("/auth/inscription/", donnees);
    return data;
  };

  const deconnexion = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUtilisateur(null);
  };

  const majProfil = (data) => setUtilisateur(data);

  return (
    <AuthContext.Provider
      value={{ utilisateur, chargement, connexion, inscription, deconnexion, majProfil }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
