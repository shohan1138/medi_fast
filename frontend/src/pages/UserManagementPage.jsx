import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  listRoles,
  listUsers,
  assignRole,
  removeRole,
  toggleUserStatus,
} from "../api/user";
import SearchInput from "../components/SearchInput";
import Pagination from "../components/Pagination";
import { usePagination } from "../hooks/usePagination";
import Spinner from "../components/Spinner";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";

const RESTRICTED_ROLES = ["admin", "management"];

export default function UserManagementPage() {
  const { hasRole } = useAuth();
  const isFullAdmin = hasRole("admin");

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState({});
  const { showToast } = useToast();
  const confirm = useConfirm();

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
      showToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = users.filter(
    (u) =>
      String(u.UserId).includes(search) ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.FullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  );
  const { page, setPage, totalPages, pageItems } = usePagination(filtered, 8);
  const assignableRoles = roles.filter(
    (r) => isFullAdmin || !RESTRICTED_ROLES.includes(r.RoleName),
  );

  const handleAssign = async (userId) => {
    const roleName = selectedRole[userId];
    if (!roleName) return;
    try {
      await assignRole(userId, roleName);
      showToast(`Role '${roleName}' assigned`, "success");
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to assign role", "error");
    }
  };

  const handleRemove = async (userId, roleName) => {
    const ok = await confirm({
      title: "Remove role?",
      message: `Remove the '${roleName}' role from this user?`,
      confirmLabel: "Remove",
    });
    if (!ok) return;
    try {
      await removeRole(userId, roleName);
      showToast(`Role '${roleName}' removed`, "success");
      await loadData();
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to remove role", "error");
    }
  };

  const handleToggleStatus = async (user) => {
    if (user.is_active) {
      const ok = await confirm({
        title: "Deactivate user?",
        message: `${user.username} will lose access immediately.`,
        confirmLabel: "Deactivate",
      });
      if (!ok) return;
    }
    try {
      await toggleUserStatus(user.UserId);
      showToast(
        `User ${user.is_active ? "deactivated" : "activated"}`,
        "success",
      );
      await loadData();
    } catch (err) {
      showToast(
        err.response?.data?.detail || "Failed to update status",
        "error",
      );
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex justify-center">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by ID, username, name, email..."
        />
      </div>

      {!isFullAdmin && (
        <p className="text-xs text-slate-500 bg-slate-100 border border-slate-200 rounded px-3 py-2 mb-4 max-w-lg">
          As management, you can assign or remove staff/patient roles. Admin and
          management roles, and account status, can only be changed by an admin.
        </p>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3">User ID</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Full Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Roles</th>
              <th className="px-4 py-3">Assign Role</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  No users found
                </td>
              </tr>
            )}
            {pageItems.map((u) => (
              <tr key={u.UserId} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-800">
                  #{u.UserId}
                </td>
                <td className="px-4 py-3">{u.username}</td>
                <td className="px-4 py-3">{u.FullName}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">
                  {isFullAdmin ? (
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={`px-2 py-1 rounded text-xs font-medium ${u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {u.is_active ? "Active" : "Inactive"}
                    </button>
                  ) : (
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(u.roles || []).map((r) => {
                      const canRemove =
                        isFullAdmin || !RESTRICTED_ROLES.includes(r.RoleName);
                      return (
                        <span
                          key={r.RoleId}
                          className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded flex items-center gap-1"
                        >
                          {r.RoleName}
                          {canRemove && (
                            <button
                              onClick={() => handleRemove(u.UserId, r.RoleName)}
                              className="text-blue-500 hover:text-red-600"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      );
                    })}
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
                      {assignableRoles.map((r) => (
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
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
