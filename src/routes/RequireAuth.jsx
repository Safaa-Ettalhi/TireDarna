import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RequireAuth({ allowedRoles, fallback = null }) {
  const { token, user } = useAuth();
  const location = useLocation();

  if (!token || !user) {
    if (fallback && location.pathname === "/") {
      return fallback;
    }
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}

