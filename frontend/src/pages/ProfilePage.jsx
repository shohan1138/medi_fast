import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
          <Link to="/" className="text-sm text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>

        <dl className="space-y-4">
          <div>
            <dt className="text-sm text-slate-500">Full Name</dt>
            <dd className="text-slate-800 font-medium">{user.FullName}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Username</dt>
            <dd className="text-slate-800 font-medium">{user.username}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Email</dt>
            <dd className="text-slate-800 font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Phone</dt>
            <dd className="text-slate-800 font-medium">{user.phone_number}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Status</dt>
            <dd>
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  user.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {user.is_active ? "Active" : "Inactive"}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500 mb-1">Roles</dt>
            <dd className="flex flex-wrap gap-2">
              {user.is_superuser && (
                <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-1 rounded">
                  Superuser
                </span>
              )}
              {(user.roles || []).map((r) => (
                <span
                  key={r.RoleId}
                  className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded"
                >
                  {r.RoleName}
                </span>
              ))}
              {!user.is_superuser &&
                (!user.roles || user.roles.length === 0) && (
                  <span className="text-sm text-slate-400">
                    No roles assigned
                  </span>
                )}
            </dd>
          </div>
        </dl>

        <Link
          to="/change-password"
          className="mt-8 block text-center w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Change Password
        </Link>
      </div>
    </div>
  );
}
