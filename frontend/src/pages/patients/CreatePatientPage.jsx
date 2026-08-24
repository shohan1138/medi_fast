import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPatientForUser, listPatients } from "../../api/patient";
import { listUsers } from "../../api/user";

export default function CreatePatientPage() {
  const [users, setUsers] = useState([]);
  const [existingPatientUserIds, setExistingPatientUserIds] = useState(
    new Set(),
  );
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [form, setForm] = useState({
    UserId: "",
    age: "",
    blood_type: "",
    gender: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    medical_history: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([listUsers(), listPatients()])
      .then(([usersRes, patientsRes]) => {
        setUsers(usersRes.data);
        setExistingPatientUserIds(
          new Set(patientsRes.data.map((p) => p.UserId)),
        );
      })
      .catch(() => setError("Failed to load users"))
      .finally(() => setLoadingUsers(false));
  }, []);

  const availableUsers = users.filter(
    (u) =>
      !existingPatientUserIds.has(u.UserId) &&
      (u.roles || []).some((r) => r.RoleName === "patient"),
  );

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await createPatientForUser({
        UserId: Number(form.UserId),
        age: Number(form.age),
        blood_type: form.blood_type,
        gender: form.gender,
        emergency_contact_name: form.emergency_contact_name,
        emergency_contact_phone: form.emergency_contact_phone,
        medical_history: form.medical_history || null,
      });
      navigate(`/patients/${res.data.PatientId}`);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to create patient profile",
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Register New Patient
        </h1>
        <Link to="/patients" className="text-sm text-blue-600 hover:underline">
          Back to Patients
        </Link>
      </div>
      <p className="text-sm text-slate-500 mb-4 max-w-lg">
        The patient needs an existing user account with the{" "}
        <strong>patient</strong> role first — have them{" "}
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
            Patient User
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
              No users with the 'patient' role available. Assign the role via
              User Management first, then come back here.
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Age
            </label>
            <input
              name="age"
              type="number"
              required
              value={form.age}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Blood Type
            </label>
            <input
              name="blood_type"
              required
              value={form.blood_type}
              onChange={handleChange}
              placeholder="e.g. O+"
              className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Gender
          </label>
          <select
            name="gender"
            required
            value={form.gender}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Emergency Contact Name
            </label>
            <input
              name="emergency_contact_name"
              required
              value={form.emergency_contact_name}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Emergency Contact Phone
            </label>
            <input
              name="emergency_contact_phone"
              required
              value={form.emergency_contact_phone}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Medical History (optional)
          </label>
          <textarea
            name="medical_history"
            value={form.medical_history}
            onChange={handleChange}
            rows={3}
            className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Create Patient Profile
        </button>
      </form>
    </div>
  );
}
