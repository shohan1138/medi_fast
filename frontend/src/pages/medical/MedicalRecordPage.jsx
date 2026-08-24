import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAppointment } from "../../api/appointment";
import { getPatient } from "../../api/patient";
import { getDoctor } from "../../api/doctor";
import {
  getMedicalRecordByAppointment,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
} from "../../api/medical";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import Spinner from "../../components/Spinner";

export default function MedicalRecordPage() {
  const { appointmentId } = useParams();
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();

  const canEdit = hasRole("admin", "doctor");
  const canDelete = hasRole("admin");

  const [appointment, setAppointment] = useState(null);
  const [patient, setPatient] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [record, setRecord] = useState(null);
  const [exists, setExists] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    diagnosis: "",
    treatment_plan: "",
    visit_notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const apptRes = await getAppointment(appointmentId);
      setAppointment(apptRes.data);

      // Best-effort fetch for patient and doctor context
      try {
        const patRes = await getPatient(apptRes.data.PatientId);
        setPatient(patRes.data);
      } catch {
        setPatient(null);
      }
      try {
        const docRes = await getDoctor(apptRes.data.DoctorId);
        setDoctor(docRes.data);
      } catch {
        setDoctor(null);
      }

      try {
        const recRes = await getMedicalRecordByAppointment(appointmentId);
        setRecord(recRes.data);
        setExists(true);
        setForm({
          diagnosis: recRes.data.diagnosis,
          treatment_plan: recRes.data.treatment_plan || "",
          visit_notes: recRes.data.visit_notes || "",
        });
      } catch {
        setExists(false);
        setRecord(null);
      }
    } catch (err) {
      showToast(
        err.response?.data?.detail || "Failed to load appointment",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [appointmentId]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (exists) {
        await updateMedicalRecord(record.RecordId, form);
        showToast("Medical record updated", "success");
      } else {
        await createMedicalRecord({
          AppointmentId: Number(appointmentId),
          ...form,
        });
        showToast("Medical record created", "success");
      }
      setEditing(false);
      await load();
    } catch (err) {
      showToast(
        err.response?.data?.detail || "Failed to save medical record",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete medical record?",
      message: "This cannot be undone.",
    });
    if (!ok) return;
    try {
      await deleteMedicalRecord(record.RecordId);
      showToast("Medical record deleted", "success");
      navigate(`/appointments/${appointmentId}`);
    } catch (err) {
      showToast(
        err.response?.data?.detail || "Failed to delete medical record",
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
        <h1 className="text-2xl font-bold text-slate-800">Medical Record</h1>
        <Link
          to={`/appointments/${appointmentId}`}
          className="text-sm text-blue-600 hover:underline"
        >
          Back to Appointment
        </Link>
      </div>

      {/* Context Panel */}
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
          This appointment is not marked completed — a medical record can't be
          created until it is.
        </p>
      )}

      {!exists && !editing && (
        <div className="bg-white rounded-lg shadow p-6 max-w-lg">
          <p className="text-slate-500 mb-4">
            No medical record exists for this appointment yet.
          </p>
          {canEdit && appointment?.status === "completed" && (
            <button
              onClick={() => setEditing(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Create Medical Record
            </button>
          )}
        </div>
      )}

      {(exists || editing) &&
        (editing ? (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow p-6 max-w-lg space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Diagnosis
              </label>
              <textarea
                name="diagnosis"
                required
                rows={2}
                value={form.diagnosis}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Treatment Plan
              </label>
              <textarea
                name="treatment_plan"
                rows={2}
                value={form.treatment_plan}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Visit Notes
              </label>
              <textarea
                name="visit_notes"
                rows={3}
                value={form.visit_notes}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : exists
                    ? "Save Changes"
                    : "Create Record"}
              </button>
              {exists && (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 max-w-lg">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-slate-500">Diagnosis</dt>
                <dd className="font-medium">{record.diagnosis}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Treatment Plan</dt>
                <dd className="font-medium">{record.treatment_plan || "—"}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Visit Notes</dt>
                <dd className="font-medium">{record.visit_notes || "—"}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Created</dt>
                <dd className="font-medium">
                  {new Date(record.created_at).toLocaleString()}
                </dd>
              </div>
            </dl>
            <div className="flex gap-3 mt-6">
              {canEdit && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-blue-600 text-sm hover:underline"
                >
                  Edit
                </button>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="text-red-600 text-sm hover:underline"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}
