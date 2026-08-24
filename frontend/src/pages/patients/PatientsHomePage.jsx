import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function PatientsHomePage() {
  const { hasRole } = useAuth();
  const links = [
    hasRole(
      "admin",
      "management",
      "doctor",
      "nurse",
      "lab_technician",
      "receptionist",
    ) && { to: "/patients/list", label: "Search Patients" },
    hasRole("admin", "management", "receptionist") && {
      to: "/patients/new",
      label: "Register New Patient",
    },
    hasRole("patient") && { to: "/patients/me", label: "My Patient Profile" },
  ].filter(Boolean);

  if (links.length === 1) return <Navigate to={links[0].to} replace />;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Patients</h1>
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          Back to Dashboard
        </Link>
      </div>
      {links.length === 0 ? (
        <p className="text-slate-500">
          No patient actions available for your role.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition border border-slate-200"
            >
              <h2 className="font-semibold text-slate-800">{l.label}</h2>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
