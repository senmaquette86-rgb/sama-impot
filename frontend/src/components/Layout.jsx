import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Layout() {
  const { utilisateur, deconnexion } = useAuth();
  const navigate = useNavigate();

  const seDeconnecter = () => {
    deconnexion();
    navigate("/connexion");
  };

  const liens = [
    { to: "/tableau-de-bord", label: "Tableau de bord" },
    { to: "/impots", label: "Mes impôts" },
    { to: "/payer", label: "Payer un impôt" },
    { to: "/historique", label: "Historique" },
    { to: "/notifications", label: "Notifications" },
    { to: "/profil", label: "Profil" },
  ];
  if (utilisateur?.is_staff) {
    liens.push({ to: "/administration", label: "Administration" });
  }

  return (
    <div className="app-shell">
      <aside className="barre-laterale">
        <div className="logo">
          <span className="logo-badge">SI</span>
          <span>Sama Impôt</span>
        </div>
        <nav>
          {liens.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => (isActive ? "lien actif" : "lien")}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="barre-laterale-pied">
          <div className="utilisateur-mini">
            <strong>{utilisateur?.nom_complet}</strong>
            <span>{utilisateur?.email}</span>
          </div>
          <button className="btn btn-secondaire" onClick={seDeconnecter}>
            Se déconnecter
          </button>
        </div>
      </aside>
      <main className="contenu">
        <Outlet />
      </main>
    </div>
  );
}
