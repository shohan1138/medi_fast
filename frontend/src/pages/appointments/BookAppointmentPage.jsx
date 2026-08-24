import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listDoctors, getDoctorSchedule } from "../../api/doctor";
import { bookAppointment } from "../../api/appointment";
import { useToast } from "../../context/ToastContext";
import Spinner from "../../components/Spinner";

const dayName = (dateStr) => {
  if (!dateStr) return "";
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
  });
};

export default function BookAppointmentPage() {
  const { hasRole } = useAuth();
  const isStaff = hasRole("admin", "management", "receptionist");
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [schedule, setSchedule] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [form, setForm] = useState({
    PatientId: "",
    DoctorId: "",
    date: "",
    time: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listDoctors()
      .then((res) => setDoctors(res.data))
      .catch(() => showToast("Failed to load doctors", "error"))
      .finally(() => setLoadingDoctors(false));
  }, []);

  useEffect(() => {
    if (!form.DoctorId) {
      setSchedule([]);
      return;
    }
    setLoadingSchedule(true);
    getDoctorSchedule(form.DoctorId)
      .then((res) => setSchedule(res.data))
      .catch(() => showToast("Failed to load doctor schedule", "error"))
      .finally(() => setLoadingSchedule(false));
  }, [form.DoctorId]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const selectedDay = dayName(form.date);
  const matchingSlot = useMemo(
    () =>
      schedule.find(
        (s) => s.day_of_week.toLowerCase() === selectedDay.toLowerCase(),
      ),
    [schedule, selectedDay],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.date || !form.time) {
      showToast("Please select a date and time", "error");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        DoctorId: Number(form.DoctorId),
        appointment_date: `${form.date}T${form.time}:00`,
        notes: form.notes || null,
      };
      if (isStaff) payload.PatientId = Number(form.PatientId);

      const res = await bookAppointment(payload);
      showToast("Appointment booked", "success");
      navigate(`/appointments/${res.data.AppointmentId}`);
    } catch (err) {
      showToast(
        err.response?.data?.detail || "Failed to book appointment",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Book Appointment</h1>
        <Link
          to="/appointments"
          className="text-sm text-blue-600 hover:underline"
        >
          Back to Appointments
        </Link>
      </div>

      {loadingDoctors ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow p-6 space-y-4 lg:col-span-2"
          >
            {isStaff && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Patient ID
                </label>
                <input
                  name="PatientId"
                  type="number"
                  required
                  value={form.PatientId}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Doctor
              </label>
              <select
                name="DoctorId"
                required
                value={form.DoctorId}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select doctor</option>
                {doctors.map((d) => (
                  <option key={d.DoctorId} value={d.DoctorId}>
                    Dr. {d.FullName || "Unnamed"} (#{d.DoctorId}) —{" "}
                    {d.specialty}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date
                </label>
                <input
                  name="date"
                  type="date"
                  required
                  value={form.date}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Time
                </label>
                <input
                  name="time"
                  type="time"
                  required
                  value={form.time}
                  onChange={handleChange}
                  min={matchingSlot?.start_time}
                  max={matchingSlot?.end_time}
                  className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {form.date &&
              form.DoctorId &&
              !loadingSchedule &&
              (matchingSlot ? (
                <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                  Available {selectedDay}: {matchingSlot.start_time} –{" "}
                  {matchingSlot.end_time}
                </p>
              ) : (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                  This doctor has no schedule set for {selectedDay}. Booking
                  will likely be rejected — pick another date.
                </p>
              ))}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                name="notes"
                rows={3}
                value={form.notes}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {submitting ? "Booking..." : "Book Appointment"}
            </button>
          </form>

          <div className="bg-white rounded-lg shadow p-6 h-fit">
            <h2 className="font-semibold text-slate-800 mb-3">
              Doctor's Weekly Schedule
            </h2>
            {!form.DoctorId ? (
              <p className="text-sm text-slate-400">
                Select a doctor to see their availability.
              </p>
            ) : loadingSchedule ? (
              <Spinner size="sm" />
            ) : schedule.length === 0 ? (
              <p className="text-sm text-slate-400">
                No schedule set for this doctor.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {schedule.map((s) => (
                  <li
                    key={s.ScheduleId}
                    className={`py-2 flex justify-between ${s.day_of_week.toLowerCase() === selectedDay.toLowerCase() ? "bg-blue-50 -mx-2 px-2 rounded" : ""}`}
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
      )}
    </div>
  );
}
