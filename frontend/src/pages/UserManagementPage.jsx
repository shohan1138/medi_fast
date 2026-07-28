import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  listRoles,
  listUsers,
  assignRole,
  removeRole,
  toggleUserStatus,
} from "../api/user";

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState({});

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        listUsers(),
        listRoles(),
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssign = async (userId) => {
    const roleName = selectedRole[userId];
    if (!roleName) return;
    try {
      await assignRole(userId, roleName);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to assign role");
    }
  };

  const handleRemove = async (userId, roleName) => {
    try {
      await removeRole(userId, roleName);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to remove role");
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await toggleUserStatus(userId);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update status");
    }
  };

  if (loading)
    return <div className="p-8 text-slate-500">Loading users...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          Back to Dashboard
        </Link>
      </div>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Full Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Roles</th>
              <th className="px-4 py-3">Assign Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.UserId} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {u.username}
                </td>
                <td className="px-4 py-3">{u.FullName}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleStatus(u.UserId)}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      u.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {u.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(u.roles || []).map((r) => (
                      <span
                        key={r.RoleId}
                        className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded flex items-center gap-1"
                      >
                        {r.RoleName}
                        <button
                          onClick={() => handleRemove(u.UserId, r.RoleName)}
                          className="text-blue-500 hover:text-red-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {(!u.roles || u.roles.length === 0) && (
                      <span className="text-slate-400 text-xs">None</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <select
                      value={selectedRole[u.UserId] || ""}
                      onChange={(e) =>
                        setSelectedRole({
                          ...selectedRole,
                          [u.UserId]: e.target.value,
                        })
                      }
                      className="border border-slate-300 rounded px-2 py-1 text-xs"
                    >
                      <option value="">Select role</option>
                      {roles.map((r) => (
                        <option key={r.RoleId} value={r.RoleName}>
                          {r.RoleName}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAssign(u.UserId)}
                      className="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Assign
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
