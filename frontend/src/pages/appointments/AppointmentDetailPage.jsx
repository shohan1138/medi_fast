import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
  cancelAppointment,
} from "../api/appointment";
import { getPatient } from "../api/patient";
import { getDoctor } from "../api/doctor";
import { getInvoicesByAppointment } from "../api/billing";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";
import Spinner from "../components/Spinner";

const STATUS_COLORS = {
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-amber-100 text-amber-700",
};
const INVOICE_STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-700",
  partial: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AppointmentDetailPage() {
  const { appointmentId } = useParams();
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [appointment, setAppointment] = useState(null);
  const [patient, setPatient] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [invoices, setInvoices] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const canManageStatus = hasRole("admin", "management", "doctor");
  const canReschedule = hasRole("patient");
  const canSeeBilling = hasRole("admin", "receptionist");

  const load = async () => {
    try {
      const res = await getAppointment(appointmentId);
      setAppointment(res.data);
      getPatient(res.data.PatientId)
        .then((r) => setPatient(r.data))
        .catch(() => {});
      getDoctor(res.data.DoctorId)
        .then((r) => setDoctor(r.data))
        .catch(() => {});
      if (canSeeBilling) {
        getInvoicesByAppointment(appointmentId)
          .then((r) => setInvoices(r.data))
          .catch(() => setInvoices([]));
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load appointment");
    }
  };

  useEffect(() => {
    load();
  }, [appointmentId]);

  const handleStatusUpdate = async (status) => {
    setSaving(true);
    try {
      await updateAppointmentStatus(appointmentId, status);
      showToast(`Marked as ${status.replace("_", " ")}`, "success");
      await load();
    } catch (err) {
      showToast(
        err.response?.data?.detail || "Failed to update status",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    const ok = await confirm({
      title: "Cancel appointment?",
      message: "This appointment will be marked as cancelled.",
      confirmLabel: "Cancel Appointment",
    });
    if (!ok) return;
    try {
      await cancelAppointment(appointmentId);
      showToast("Appointment cancelled", "success");
      await load();
    } catch (err) {
      showToast(
        err.response?.data?.detail || "Failed to cancel appointment",
        "error",
      );
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!newDate || !newTime) return;
    setSaving(true);
    try {
      await rescheduleAppointment(appointmentId, {
        appointment_date: `${newDate}T${newTime}:00`,
      });
      showToast("Appointment rescheduled", "success");
      setRescheduling(false);
      await load();
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to reschedule", "error");
    } finally {
      setSaving(false);
    }
  };

  if (error)
    return (
      <div className="min-h-screen bg-slate-50 p-8 text-red-600">{error}</div>
    );
  if (!appointment)
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex justify-center">
        <Spinner size="lg" />
      </div>
    );

  const isScheduled = appointment.status === "scheduled";

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Appointment #{appointment.AppointmentId}
        </h1>
        <Link
          to="/appointments"
          className="text-sm text-blue-600 hover:underline"
        >
          Back to Appointments
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-lg mb-4">
        <dl className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <dt className="text-sm text-slate-500">Patient</dt>
            <dd className="font-medium">
              {patient?.FullName || `#${appointment.PatientId}`}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Doctor</dt>
            <dd className="font-medium">
              Dr. {doctor?.FullName || `#${appointment.DoctorId}`}
              {doctor?.specialty && (
                <span className="text-slate-400"> · {doctor.specialty}</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Date & Time</dt>
            <dd className="font-medium">
              {new Date(appointment.appointment_date).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Status</dt>
            <dd>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[appointment.status] || "bg-slate-100 text-slate-700"}`}
              >
                {appointment.status.replace("_", " ")}
              </span>
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-sm text-slate-500">Notes</dt>
            <dd className="font-medium">{appointment.notes || "—"}</dd>
          </div>
        </dl>

        {isScheduled && canManageStatus && (
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => handleStatusUpdate("completed")}
              disabled={saving}
              className="bg-green-600 text-white text-sm px-3 py-1.5 rounded hover:bg-green-700 disabled:opacity-50"
            >
              Mark Completed
            </button>
            <button
              onClick={() => handleStatusUpdate("no_show")}
              disabled={saving}
              className="bg-amber-500 text-white text-sm px-3 py-1.5 rounded hover:bg-amber-600 disabled:opacity-50"
            >
              Mark No-Show
            </button>
            <button
              onClick={() => handleStatusUpdate("cancelled")}
              disabled={saving}
              className="bg-red-600 text-white text-sm px-3 py-1.5 rounded hover:bg-red-700 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}

        {isScheduled && canReschedule && (
          <div className="border-t border-slate-200 pt-4 mt-2">
            {!rescheduling ? (
              <div className="flex gap-3">
                <button
                  onClick={() => setRescheduling(true)}
                  className="text-blue-600 text-sm hover:underline"
                >
                  Reschedule
                </button>
                <button
                  onClick={handleCancel}
                  className="text-red-600 text-sm hover:underline"
                >
                  Cancel Appointment
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleReschedule}
                className="flex gap-2 items-end flex-wrap"
              >
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    New Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="border border-slate-300 rounded px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    New Time
                  </label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="border border-slate-300 rounded px-2 py-1 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setRescheduling(false)}
                  className="text-sm text-slate-500 hover:underline"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        )}

        {appointment.status === "completed" && (
          <div className="flex gap-4 mt-4 pt-4 border-t border-slate-200">
            {hasRole("admin", "management", "doctor", "patient") && (
              <Link
                to={`/appointments/${appointment.AppointmentId}/medical-record`}
                className="text-blue-600 text-sm hover:underline"
              >
                Medical Record
              </Link>
            )}
            {hasRole(
              "admin",
              "management",
              "doctor",
              "patient",
              "lab_technician",
            ) && (
              <Link
                to={`/appointments/${appointment.AppointmentId}/lab-reports`}
                className="text-blue-600 text-sm hover:underline"
              >
                Lab Reports
              </Link>
            )}
            {hasRole("admin", "management", "doctor", "patient") && (
              <Link
                to={`/appointments/${appointment.AppointmentId}/prescription`}
                className="text-blue-600 text-sm hover:underline"
              >
                Prescription
              </Link>
            )}
          </div>
        )}
      </div>

      {canSeeBilling && (
        <div className="bg-white rounded-lg shadow p-6 max-w-lg">
          <h2 className="font-semibold text-slate-800 mb-3">Billing</h2>
          {invoices === null ? (
            <Spinner size="sm" />
          ) : invoices.length === 0 ? (
            <div>
              <p className="text-sm text-slate-400 mb-3">
                No invoice yet for this appointment.
              </p>
              <Link
                to={`/billing/invoices/new?patientId=${appointment.PatientId}&appointmentId=${appointment.AppointmentId}`}
                className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700 inline-block"
              >
                + Create Invoice
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <li
                  key={inv.InvoiceId}
                  className="py-2 flex justify-between items-center text-sm"
                >
                  <span>
                    Invoice #{inv.InvoiceId} ·{" "}
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${INVOICE_STATUS_COLORS[inv.status] || "bg-slate-100 text-slate-700"}`}
                    >
                      {inv.status}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-slate-600">
                      ${Number(inv.total_amount).toFixed(2)}
                    </span>
                    <Link
                      to={`/billing/invoices/${inv.InvoiceId}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
