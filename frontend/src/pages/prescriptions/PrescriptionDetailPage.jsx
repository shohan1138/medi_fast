import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getPrescription,
  updatePrescriptionStatus,
  addPrescriptionItem,
  updatePrescriptionItem,
  deletePrescriptionItem,
} from "../../api/prescription";
import { getAppointment } from "../../api/appointment";
import { getPatient } from "../../api/patient";
import { getDoctor } from "../../api/doctor";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import Spinner from "../../components/Spinner";

const emptyForm = {
  medicine_name: "",
  dosage: "",
  frequency: "",
  duration: "",
};

export default function PrescriptionDetailPage() {
  const { prescriptionId } = useParams();
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const canManage = hasRole("admin", "doctor");

  const [prescription, setPrescription] = useState(null);
  const [patient, setPatient] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingItemId, setEditingItemId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getPrescription(prescriptionId);
      setPrescription(res.data);
      getAppointment(res.data.AppointmentId)
        .then((apptRes) => {
          getPatient(apptRes.data.PatientId)
            .then((r) => setPatient(r.data))
            .catch(() => {});
          getDoctor(apptRes.data.DoctorId)
            .then((r) => setDoctor(r.data))
            .catch(() => {});
        })
        .catch(() => {});
    } catch (err) {
      showToast(
        err.response?.data?.detail || "Failed to load prescription",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [prescriptionId]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });
  const startAdd = () => {
    setForm(emptyForm);
    setEditingItemId(null);
    setShowForm(true);
  };
  const startEdit = (item) => {
    setForm({
      medicine_name: item.medicine_name,
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
    });
    setEditingItemId(item.PrescriptionItemId);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingItemId) {
        await updatePrescriptionItem(prescriptionId, editingItemId, {
          dosage: form.dosage,
          frequency: form.frequency,
          duration: form.duration,
        });
        showToast("Item updated", "success");
      } else {
        await addPrescriptionItem(prescriptionId, form);
        showToast("Medicine added", "success");
      }
      setShowForm(false);
      await load();
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to save item", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (item) => {
    const ok = await confirm({
      title: "Remove medicine?",
      message: `Remove ${item.medicine_name} from this prescription?`,
      confirmLabel: "Remove",
    });
    if (!ok) return;
    try {
      await deletePrescriptionItem(prescriptionId, item.PrescriptionItemId);
      showToast("Item removed", "success");
      await load();
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to remove item", "error");
    }
  };

  const handleCancelPrescription = async () => {
    const ok = await confirm({
      title: "Cancel prescription?",
      message:
        "This prescription will be marked cancelled and can no longer be edited.",
      confirmLabel: "Cancel Prescription",
    });
    if (!ok) return;
    try {
      await updatePrescriptionStatus(prescriptionId, "cancelled");
      showToast("Prescription cancelled", "success");
      await load();
    } catch (err) {
      showToast(
        err.response?.data?.detail || "Failed to cancel prescription",
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
  if (!prescription) return null;

  const isActive = prescription.status === "active";

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Prescription #{prescription.PrescriptionId}
        </h1>
        <Link
          to={`/appointments/${prescription.AppointmentId}`}
          className="text-sm text-blue-600 hover:underline"
        >
          Back to Appointment
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-4 max-w-2xl text-sm">
        <p>
          <span className="text-slate-500">Patient:</span>{" "}
          <span className="font-medium">{patient?.FullName || "—"}</span>
        </p>
        <p>
          <span className="text-slate-500">Doctor:</span>{" "}
          <span className="font-medium">
            {doctor?.FullName ? `Dr. ${doctor.FullName}` : "—"}
          </span>
          {doctor?.specialty && (
            <span className="text-slate-400"> · {doctor.specialty}</span>
          )}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6 max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-slate-500">
            Appointment #{prescription.AppointmentId} · Issued{" "}
            {new Date(prescription.issued_at).toLocaleString()}
          </p>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              prescription.status === "active"
                ? "bg-blue-100 text-blue-700"
                : prescription.status === "dispensed"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
            }`}
          >
            {prescription.status}
          </span>
        </div>

        {canManage && isActive && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={startAdd}
              className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700"
            >
              + Add Medicine
            </button>
            <button
              onClick={handleCancelPrescription}
              className="text-red-600 text-sm hover:underline"
            >
              Cancel Prescription
            </button>
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="border border-slate-200 rounded-lg p-4 mb-4 space-y-3"
          >
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Medicine Name
              </label>
              <input
                name="medicine_name"
                required
                disabled={!!editingItemId}
                value={form.medicine_name}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm disabled:bg-slate-100"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Dosage
                </label>
                <input
                  name="dosage"
                  required
                  placeholder="500mg"
                  value={form.dosage}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Frequency
                </label>
                <input
                  name="frequency"
                  required
                  placeholder="Twice daily"
                  value={form.frequency}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Duration
                </label>
                <input
                  name="duration"
                  required
                  placeholder="7 days"
                  value={form.duration}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingItemId
                    ? "Save Changes"
                    : "Add Medicine"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm text-slate-500 hover:underline"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-3 py-2">Medicine</th>
              <th className="px-3 py-2">Dosage</th>
              <th className="px-3 py-2">Frequency</th>
              <th className="px-3 py-2">Duration</th>
              {canManage && isActive && <th className="px-3 py-2"></th>}
            </tr>
          </thead>
          <tbody>
            {(!prescription.items || prescription.items.length === 0) && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-4 text-center text-slate-400"
                >
                  No medicines added yet
                </td>
              </tr>
            )}
            {prescription.items?.map((item) => (
              <tr
                key={item.PrescriptionItemId}
                className="border-t border-slate-100"
              >
                <td className="px-3 py-2 font-medium">{item.medicine_name}</td>
                <td className="px-3 py-2">{item.dosage}</td>
                <td className="px-3 py-2">{item.frequency}</td>
                <td className="px-3 py-2">{item.duration}</td>
                {canManage && isActive && (
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemove(item)}
                        className="text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
