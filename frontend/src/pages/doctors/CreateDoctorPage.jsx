import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createDoctorForUser, listDoctors } from "../../api/doctor";
import { listUsers } from "../../api/user";

export default function CreateDoctorPage() {
  const [users, setUsers] = useState([]);
  const [existingDoctorUserIds, setExistingDoctorUserIds] = useState(new Set());
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [form, setForm] = useState({
    UserId: "",
    specialty: "",
    license_number: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([listUsers(), listDoctors()])
      .then(([usersRes, doctorsRes]) => {
        setUsers(usersRes.data);
        setExistingDoctorUserIds(new Set(doctorsRes.data.map((d) => d.UserId)));
      })
      .catch(() => setError("Failed to load users"))
      .finally(() => setLoadingUsers(false));
  }, []);

  const availableUsers = users.filter(
    (u) =>
      !existingDoctorUserIds.has(u.UserId) &&
      (u.roles || []).some((r) => r.RoleName === "doctor"),
  );

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await createDoctorForUser({
        UserId: Number(form.UserId),
        specialty: form.specialty,
        license_number: form.license_number,
      });
      navigate(`/doctors/${res.data.DoctorId}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create doctor profile");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Onboard New Doctor
        </h1>
        <Link to="/doctors" className="text-sm text-blue-600 hover:underline">
          Back to Doctors
        </Link>
      </div>
      <p className="text-sm text-slate-500 mb-4 max-w-lg">
        The doctor needs an existing user account with the{" "}
        <strong>doctor</strong> role first — have them{" "}
        <Link to="/register" className="text-blue-600 hover:underline">
          register
        </Link>
        , assign the role via User Management, then select them below.
      </p>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow p-6 max-w-lg space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Doctor User
          </label>
          <select
            name="UserId"
            required
            value={form.UserId}
            onChange={handleChange}
            disabled={loadingUsers}
            className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
          >
            <option value="">
              {loadingUsers ? "Loading users..." : "Select a user"}
            </option>
            {availableUsers.map((u) => (
              <option key={u.UserId} value={u.UserId}>
                {u.FullName} ({u.username}) — User #{u.UserId}
              </option>
            ))}
          </select>
          {!loadingUsers && availableUsers.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">
              No users with the 'doctor' role available. Assign the role via
              User Management first, then come back here.
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Specialty
          </label>
          <input
            name="specialty"
            required
            value={form.specialty}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            License Number
          </label>
          <input
            name="license_number"
            required
            value={form.license_number}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Create Doctor Profile
        </button>
      </form>
    </div>
  );
}
