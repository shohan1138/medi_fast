import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center">
      <span className="text-sm font-semibold text-slate-700 sm:hidden">
        MediFast
      </span>
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <Link to="/profile" className="text-sm text-slate-600 hover:underline">
          {user?.username || "Profile"}
        </Link>
        <button
          onClick={logout}
          className="text-sm text-red-600 hover:underline"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
