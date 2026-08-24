import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function BillingPage() {
  const { hasRole } = useAuth();
  const links = [
    hasRole("admin", "receptionist") && {
      to: "/billing/invoices",
      label: "Invoices",
    },
    hasRole("admin", "receptionist", "doctor", "nurse") && {
      to: "/billing/wards",
      label: "Ward Admission & Discharge",
    },
  ].filter(Boolean);

  if (links.length === 1) return <Navigate to={links[0].to} replace />;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Billing & Invoices
        </h1>
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          Back to Dashboard
        </Link>
      </div>
      {links.length === 0 ? (
        <p className="text-slate-500">
          No billing actions available for your role.
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
