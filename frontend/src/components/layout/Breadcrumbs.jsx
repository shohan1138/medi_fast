import { Link, useLocation } from "react-router-dom";

const LABELS = {
  patients: "Patients",
  doctors: "Doctors",
  billing: "Billing",
  invoices: "Invoices",
  wards: "Wards",
  new: "New",
  me: "My Profile",
  list: "List",
  admin: "Admin",
  users: "Users",
  profile: "Profile",
  "change-password": "Change Password",
};
const isNumeric = (s) => /^\d+$/.test(s);

export default function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => ({
    path: "/" + segments.slice(0, i + 1).join("/"),
    label: isNumeric(seg) ? `#${seg}` : LABELS[seg] || seg,
  }));

  return (
    <nav className="text-sm text-slate-500 px-6 pt-4 flex items-center gap-1">
      <Link to="/" className="hover:underline">
        Dashboard
      </Link>
      {crumbs.map((c, i) => (
        <span key={c.path} className="flex items-center gap-1">
          <span className="text-slate-300">/</span>
          {i === crumbs.length - 1 ? (
            <span className="text-slate-700 font-medium capitalize">
              {c.label.replace(/-/g, " ")}
            </span>
          ) : (
            <Link to={c.path} className="hover:underline capitalize">
              {c.label.replace(/-/g, " ")}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
