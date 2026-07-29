import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children, admin = false }) {
  const { utilisateur } = useAuth();

  if (!utilisateur) {
    return <Navigate to="/connexion" replace />;
  }
  if (admin && !utilisateur.is_staff) {
    return <Navigate to="/tableau-de-bord" replace />;
  }
  return children;
}
