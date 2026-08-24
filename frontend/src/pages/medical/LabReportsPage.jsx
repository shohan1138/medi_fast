import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAppointment } from "../../api/appointment";
import { getPatient } from "../../api/patient";
import { getDoctor } from "../../api/doctor";
import {
  getLabReportsByAppointment,
  createLabReport,
  updateLabReport,
  deleteLabReport,
} from "../../api/medical";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import Spinner from "../../components/Spinner";

const emptyForm = {
  test_name: "",
  result: "",
  normal_range: "",
  is_abnormal: false,
};

export default function LabReportsPage() {
  const { appointmentId } = useParams();
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const canCreate = hasRole("admin", "lab_technician");
  const canDelete = hasRole("admin");

  const [appointment, setAppointment] = useState(null);
  const [patient, setPatient] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const apptRes = await getAppointment(appointmentId);
      setAppointment(apptRes.data);
      getPatient(apptRes.data.PatientId)
        .then((r) => setPatient(r.data))
        .catch(() => {});
      getDoctor(apptRes.data.DoctorId)
        .then((r) => setDoctor(r.data))
        .catch(() => {});
      const repRes = await getLabReportsByAppointment(appointmentId);
      setReports(repRes.data);
    } catch (err) {
      showToast(
        err.response?.data?.detail || "Failed to load lab reports",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [appointmentId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const startCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };
  const startEdit = (r) => {
    setForm({
      test_name: r.test_name,
      result: r.result,
      normal_range: r.normal_range || "",
      is_abnormal: r.is_abnormal,
    });
    setEditingId(r.LabReportId);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateLabReport(editingId, {
          result: form.result,
          normal_range: form.normal_range || null,
          is_abnormal: form.is_abnormal,
        });
        showToast("Lab report updated", "success");
      } else {
        await createLabReport({
          AppointmentId: Number(appointmentId),
          test_name: form.test_name,
          result: form.result,
          normal_range: form.normal_range || null,
          is_abnormal: form.is_abnormal,
        });
        showToast("Lab report created", "success");
      }
      setShowForm(false);
      await load();
    } catch (err) {
      showToast(
        err.response?.data?.detail || "Failed to save lab report",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reportId) => {
    const ok = await confirm({
      title: "Delete lab report?",
      message: "This cannot be undone.",
    });
    if (!ok) return;
    try {
      await deleteLabReport(reportId);
      showToast("Lab report deleted", "success");
      await load();
    } catch (err) {
      showToast(
        err.response?.data?.detail || "Failed to delete lab report",
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Lab Reports</h1>
        <Link
          to={`/appointments/${appointmentId}`}
          className="text-sm text-blue-600 hover:underline"
        >
          Back to Appointment
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-4 max-w-lg text-sm">
        <p>
          <span className="text-slate-500">Patient:</span>{" "}
          <span className="font-medium">
            {patient?.FullName || `#${appointment?.PatientId}`}
          </span>
        </p>
        <p>
          <span className="text-slate-500">Doctor:</span>{" "}
          <span className="font-medium">
            {doctor?.FullName || `#${appointment?.DoctorId}`}
          </span>
          {doctor?.specialty && (
            <span className="text-slate-400"> · {doctor.specialty}</span>
          )}
        </p>
        <p>
          <span className="text-slate-500">Appointment:</span>{" "}
          <span className="font-medium">
            {appointment &&
              new Date(appointment.appointment_date).toLocaleString()}
          </span>
        </p>
      </div>

      {appointment?.status !== "completed" && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-4 max-w-lg">
          This appointment is not marked completed — new lab reports can't be
          added until it is.
        </p>
      )}

      {canCreate && !showForm && appointment?.status === "completed" && (
        <button
          onClick={startCreate}
          className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          + Add Lab Report
        </button>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow p-6 max-w-lg space-y-4 mb-6"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Test Name
            </label>
            <input
              name="test_name"
              required
              disabled={!!editingId}
              value={form.test_name}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Result
            </label>
            <textarea
              name="result"
              required
              rows={2}
              value={form.result}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Normal Range (optional)
            </label>
            <input
              name="normal_range"
              value={form.normal_range}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="is_abnormal"
              checked={form.is_abnormal}
              onChange={handleChange}
            />
            Result is abnormal
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Save Changes"
                  : "Create Report"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3">Test</th>
              <th className="px-4 py-3">Result</th>
              <th className="px-4 py-3">Normal Range</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  No lab reports yet
                </td>
              </tr>
            )}
            {reports.map((r) => (
              <tr key={r.LabReportId} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {r.test_name}
                </td>
                <td className="px-4 py-3">{r.result}</td>
                <td className="px-4 py-3">{r.normal_range || "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${r.is_abnormal ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
                  >
                    {r.is_abnormal ? "Abnormal" : "Normal"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {canCreate && (
                      <button
                        onClick={() => startEdit(r)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(r.LabReportId)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
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
