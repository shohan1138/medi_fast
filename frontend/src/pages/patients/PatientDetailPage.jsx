import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getPatient, deletePatient, updatePatient } from "../../api/patient";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import Spinner from "../../components/Spinner";

export default function PatientDetailPage() {
  const { patientId } = useParams();
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    age: "",
    blood_type: "",
    gender: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    medical_history: "",
  });
  const [saving, setSaving] = useState(false);

  const canEdit = hasRole("admin", "management", "receptionist", "nurse");

  const load = async () => {
    try {
      const res = await getPatient(patientId);
      setPatient(res.data);
      setForm({
        age: res.data.age,
        blood_type: res.data.blood_type,
        gender: res.data.gender,
        emergency_contact_name: res.data.emergency_contact_name,
        emergency_contact_phone: res.data.emergency_contact_phone,
        medical_history: res.data.medical_history || "",
      });
    } catch {
      setError("Failed to load patient");
    }
  };

  useEffect(() => {
    load();
  }, [patientId]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updatePatient(patientId, {
        ...form,
        age: Number(form.age),
        medical_history: form.medical_history || null,
      });
      showToast("Patient profile updated", "success");
      setEditing(false);
      await load();
    } catch (err) {
      showToast(
        err.response?.data?.detail || "Failed to update patient",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete patient profile?",
      message: `This will permanently delete ${patient.FullName || `patient #${patient.PatientId}`}. This cannot be undone.`,
    });
    if (!ok) return;
    try {
      await deletePatient(patientId);
      showToast("Patient deleted", "success");
      navigate("/patients/list");
    } catch (err) {
      showToast(
        err.response?.data?.detail || "Failed to delete patient",
        "error",
      );
    }
  };

  if (error)
    return (
      <div className="min-h-screen bg-slate-50 p-8 text-red-600">{error}</div>
    );
  if (!patient)
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex justify-center">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          {patient.FullName || `Patient #${patient.PatientId}`}
        </h1>
        <Link
          to="/patients/list"
          className="text-sm text-blue-600 hover:underline"
        >
          Back to List
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow p-6 max-w-lg">
        {!editing ? (
          <>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-slate-500">Patient ID</dt>
                <dd className="font-medium">#{patient.PatientId}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Age</dt>
                <dd className="font-medium">{patient.age}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Blood Type</dt>
                <dd className="font-medium">{patient.blood_type}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Gender</dt>
                <dd className="font-medium">{patient.gender}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Emergency Contact</dt>
                <dd className="font-medium">
                  {patient.emergency_contact_name}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Emergency Phone</dt>
                <dd className="font-medium">
                  {patient.emergency_contact_phone}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-sm text-slate-500">Medical History</dt>
                <dd className="font-medium">
                  {patient.medical_history || "—"}
                </dd>
              </div>
            </dl>
            <div className="flex gap-4 mt-6">
              {canEdit && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-blue-600 text-sm hover:underline"
                >
                  Edit
                </button>
              )}
              {hasRole("admin") && (
                <button
                  onClick={handleDelete}
                  className="text-red-600 text-sm hover:underline"
                >
                  Delete Patient Profile
                </button>
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
                Medical History
              </label>
              <textarea
                name="medical_history"
                rows={3}
                value={form.medical_history}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-sm text-slate-500 hover:underline"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
