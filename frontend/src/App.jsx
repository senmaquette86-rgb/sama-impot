import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import Accueil from "./pages/Accueil.jsx";
import Connexion from "./pages/Connexion.jsx";
import Inscription from "./pages/Inscription.jsx";
import VerifierEmail from "./pages/VerifierEmail.jsx";
import MotDePasseOublie from "./pages/MotDePasseOublie.jsx";
import TableauBord from "./pages/TableauBord.jsx";
import Impots from "./pages/Impots.jsx";
import Paiement from "./pages/Paiement.jsx";
import PayerImpot from "./pages/PayerImpot.jsx";
import Historique from "./pages/Historique.jsx";
import Notifications from "./pages/Notifications.jsx";
import Profil from "./pages/Profil.jsx";
import Administration from "./pages/Administration.jsx";

export default function App() {
  const { chargement } = useAuth();

  if (chargement) {
    return <div className="chargement-plein">Chargement…</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<Accueil />} />
      <Route path="/connexion" element={<Connexion />} />
      <Route path="/inscription" element={<Inscription />} />
      <Route path="/verifier-email" element={<VerifierEmail />} />
      <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/tableau-de-bord" element={<TableauBord />} />
        <Route path="/impots" element={<Impots />} />
        <Route path="/payer" element={<PayerImpot />} />
        <Route path="/impots/:id/paiement" element={<Paiement />} />
        <Route path="/historique" element={<Historique />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profil" element={<Profil />} />
        <Route
          path="/administration"
          element={
            <ProtectedRoute admin>
              <Administration />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
