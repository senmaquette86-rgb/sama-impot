import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

const api = axios.create({
  baseURL: `${baseURL}/api`,
});

// Ajoute le token JWT à chaque requête si l'utilisateur est connecté.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tente un rafraîchissement du token en cas d'expiration (401).
let rafraichissementEnCours = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requete = error.config;
    const refresh = localStorage.getItem("refresh");
    if (
      error.response?.status === 401 &&
      refresh &&
      !requete._retry &&
      !requete.url.includes("/auth/")
    ) {
      requete._retry = true;
      try {
        if (!rafraichissementEnCours) {
          rafraichissementEnCours = axios.post(`${baseURL}/api/auth/token/refresh/`, {
            refresh,
          });
        }
        const { data } = await rafraichissementEnCours;
        rafraichissementEnCours = null;
        localStorage.setItem("access", data.access);
        requete.headers.Authorization = `Bearer ${data.access}`;
        return api(requete);
      } catch (e) {
        rafraichissementEnCours = null;
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/connexion";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
