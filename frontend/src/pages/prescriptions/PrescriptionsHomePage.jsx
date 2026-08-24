import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function PrescriptionsHomePage() {
  const { hasRole } = useAuth();
  const links = [
    hasRole("doctor", "patient") && {
      to: "/prescriptions/me",
      label: "My Prescriptions",
    },
    hasRole("admin", "management") && {
      to: "/prescriptions/list",
      label: "All Prescriptions",
    },
  ].filter(Boolean);

  if (links.length === 1) return <Navigate to={links[0].to} replace />;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Prescriptions</h1>
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          Back to Dashboard
        </Link>
      </div>
      {links.length === 0 ? (
        <p className="text-slate-500">
          Prescriptions are managed from the relevant appointment page.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
