import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", roles: null },
  {
    to: "/patients",
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
    to: "/doctors",
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
    to: "/appointments",
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
    to: "/billing",
    label: "Billing & Invoices",
    roles: ["admin", "receptionist", "doctor", "nurse"],
  },
  {
    to: "/prescriptions",
    label: "Prescriptions",
    roles: ["admin", "management", "doctor", "patient"],
  },
  // NEW: Reports link for Admin and Management
  {
    to: "/reports",
    label: "Reports",
    roles: ["admin", "management"],
  },
  {
    to: "/admin/users",
    label: "User Management",
    roles: ["admin", "management"],
  },
];

export default function Sidebar() {
  const { hasRole } = useAuth();
  const visible = NAV_ITEMS.filter(
    (item) => !item.roles || hasRole(...item.roles),
  );

  return (
    <aside className="w-56 shrink-0 bg-slate-900 text-slate-200 min-h-screen p-4 hidden sm:block">
      <h1 className="text-lg font-bold text-white mb-6 px-2">MediFast</h1>
      <nav className="space-y-1">
        {visible.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `block px-3 py-2 rounded text-sm transition ${isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
