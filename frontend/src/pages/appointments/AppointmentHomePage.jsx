import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AppointmentsHomePage() {
  const { hasRole } = useAuth();
  if (hasRole("admin", "management", "receptionist", "lab_technician")) {
    return <Navigate to="/appointments/list" replace />;
  }
  if (hasRole("patient", "doctor")) {
    return <Navigate to="/appointments/me" replace />;
  }
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <p className="text-slate-500">
        No appointment actions available for your role.
      </p>
    </div>
  );
}
