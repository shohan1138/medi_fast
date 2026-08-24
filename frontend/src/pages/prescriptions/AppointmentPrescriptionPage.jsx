import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAppointment } from "../../api/appointment";
import {
  getPrescriptionByAppointment,
  createPrescription,
} from "../../api/prescription";
import { useToast } from "../../context/ToastContext";
import Spinner from "../../components/Spinner";

export default function AppointmentPrescriptionPage() {
  const { appointmentId } = useParams();
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const canCreate = hasRole("admin", "doctor");

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const apptRes = await getAppointment(appointmentId);
      setAppointment(apptRes.data);
      try {
        const presRes = await getPrescriptionByAppointment(appointmentId);
        navigate(`/prescriptions/${presRes.data.PrescriptionId}`, {
          replace: true,
        });
        return;
      } catch {
        // no prescription yet — fall through to the create view
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

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await createPrescription({
        AppointmentId: Number(appointmentId),
        items: [],
      });
      showToast("Prescription created", "success");
      navigate(`/prescriptions/${res.data.PrescriptionId}`);
    } catch (err) {
      showToast(
        err.response?.data?.detail || "Failed to create prescription",
        "error",
      );
    } finally {
      setCreating(false);
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
        <h1 className="text-2xl font-bold text-slate-800">Prescription</h1>
        <Link
          to={`/appointments/${appointmentId}`}
          className="text-sm text-blue-600 hover:underline"
        >
          Back to Appointment
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow p-6 max-w-lg">
        {appointment?.status !== "completed" ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            This appointment is not marked completed — a prescription can't be
            created until it is.
          </p>
        ) : (
          <>
            <p className="text-slate-500 mb-4">
              No prescription exists for this appointment yet.
            </p>
            {canCreate && (
              <button
                onClick={handleCreate}
                disabled={creating}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Prescription"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
