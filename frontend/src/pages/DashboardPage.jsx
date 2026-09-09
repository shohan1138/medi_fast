import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

const MODULES = [
  {
    path: "/billing",
    label: "Billing & Invoices",
    roles: ["admin", "receptionist", "doctor", "nurse"],
  },
  {
    path: "/patients",
    label: "Patients",
    roles: [
      "admin",
      "management",
      "doctor",
      "nurse",
      "receptionist",
      "patient",
    ],
  },
  {
    path: "/doctors",
    label: "Doctors",
    roles: [
      "admin",
      "management",
      "doctor",
      "nurse",
      "receptionist",
      "patient",
    ],
  },
  {
    path: "/appointments",
    label: "Appointments",
    roles: [
      "admin",
      "management",
      "doctor",
      "receptionist",
      "patient",
      "lab_technician",
    ],
  },
  {
    path: "/prescriptions",
    label: "Prescriptions",
    roles: ["admin", "management", "doctor", "patient"],
  },
  // NEW: Reports module for Admin and Management
  {
    path: "/reports",
    label: "Reports",
    roles: ["admin", "management"],
  },
  {
    path: "/admin/users",
    label: "User Management",
    roles: ["admin", "management"],
  },
];

export default function DashboardPage() {
  const { user, logout, hasRole } = useAuth();

  const noRoles =
    !user?.is_superuser && (!user?.roles || user.roles.length === 0);
  const visibleModules = MODULES.filter((m) => hasRole(...m.roles));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-8">
        MediFast Dashboard
      </h1>

      {noRoles ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-6 max-w-lg">
          <p className="font-medium mb-1">No Role Assigned Yet</p>
          <p className="text-sm">
            Your account, {user?.username}, doesn't have a role assigned. An
            administrator needs to grant you access before any features become
            available.
          </p>
        </div>
      ) : visibleModules.length === 0 ? (
        <p className="text-slate-600">
          No modules available for your current role.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visibleModules.map((m) => (
            <Link
              key={m.path}
              to={m.path}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition border border-slate-200"
            >
              <h2 className="font-semibold text-slate-800">{m.label}</h2>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
