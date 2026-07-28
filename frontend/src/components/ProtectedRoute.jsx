import { Navigate, Route } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PtotectedRoute({ children, allowedRoles }) {
  const { loading, hasRole } = useAuth();
  const token = localStorage.getItem("access_token");

  if (!token) return <Navigate to="/login" replace />;
  if (loading) return <div className="p-8 text-slate-500">Loading...</div>;
  if (allowedRoles && !hasRole(...allowedRoles))
    return <Navigate to="/" replace />;

  return children;
}

// <Route
//   path="/billing"
//   element={
//     <protectedRoutes allowedRoles={["admin", "receptionist"]}>
//       <BillingPage />
//     </protectedRoutes>
//   }
// />;
