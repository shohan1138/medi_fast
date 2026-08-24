import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getDoctor,
  deleteDoctor,
  getDoctorSchedule,
  updateDoctor,
} from "../../api/doctor";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import Spinner from "../../components/Spinner";

const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export default function DoctorDetailPage() {
  const { doctorId } = useParams();
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [doctor, setDoctor] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ specialty: "", license_number: "" });
  const [saving, setSaving] = useState(false);

  const canEdit = hasRole("admin", "management");

  const load = async () => {
    try {
      const [docRes, schedRes] = await Promise.all([
        getDoctor(doctorId),
        getDoctorSchedule(doctorId),
      ]);
      setDoctor(docRes.data);
      setSchedule(schedRes.data);
      setForm({
        specialty: docRes.data.specialty,
        license_number: docRes.data.license_number,
      });
    } catch {
      setError("Failed to load doctor");
    }
  };

  useEffect(() => {
    load();
  }, [doctorId]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoctor(doctorId, form);
      showToast("Doctor profile updated", "success");
      setEditing(false);
      await load();
    } catch (err) {
      showToast(
        err.response?.data?.detail || "Failed to update doctor",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete doctor profile?",
      message: `This will permanently delete Dr. ${doctor.FullName || `#${doctor.DoctorId}`}. This cannot be undone.`,
    });
    if (!ok) return;
    try {
      await deleteDoctor(doctorId);
      showToast("Doctor deleted", "success");
      navigate("/doctors/list");
    } catch (err) {
      showToast(
        err.response?.data?.detail || "Failed to delete doctor",
        "error",
      );
    }
  };

  if (error)
    return (
      <div className="min-h-screen bg-slate-50 p-8 text-red-600">{error}</div>
    );
  if (!doctor)
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex justify-center">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Dr. {doctor.FullName || `#${doctor.DoctorId}`}
        </h1>
        <Link
          to="/doctors/list"
          className="text-sm text-blue-600 hover:underline"
        >
          Back to List
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow p-6 max-w-lg mb-6">
        {!editing ? (
          <>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-slate-500">Doctor ID</dt>
                <dd className="font-medium">#{doctor.DoctorId}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Specialty</dt>
                <dd className="font-medium">{doctor.specialty}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-sm text-slate-500">License Number</dt>
                <dd className="font-medium">{doctor.license_number}</dd>
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
                  Delete Doctor Profile
                </button>
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
      <div className="bg-white rounded-lg shadow p-6 max-w-lg">
        <h2 className="font-semibold text-slate-800 mb-3">Weekly Schedule</h2>
        {schedule.length === 0 ? (
          <p className="text-sm text-slate-400">No schedule slots set</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {[...schedule]
              .sort(
                (a, b) =>
                  DAY_ORDER.indexOf(a.day_of_week.toLowerCase()) -
                  DAY_ORDER.indexOf(b.day_of_week.toLowerCase()),
              )
              .map((s) => (
                <li
                  key={s.ScheduleId}
                  className="py-2 flex justify-between text-sm"
                >
                  <span className="capitalize font-medium text-slate-700">
                    {s.day_of_week}
                  </span>
                  <span className="text-slate-500">
                    {s.start_time} – {s.end_time}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
