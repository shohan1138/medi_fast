import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listAppointments } from "../../api/appointment";
import { listDoctors } from "../../api/doctor";
import { listPatients } from "../../api/patient";
import SearchInput from "../../components/SearchInput";
import Pagination from "../../components/Pagination";
import { usePagination } from "../../hooks/usePagination";
import Spinner from "../../components/Spinner";
import { useToast } from "../../context/ToastContext";

const STATUS_COLORS = {
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-amber-100 text-amber-700",
};

export default function AppointmentListPage() {
  const { hasRole } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctorMap, setDoctorMap] = useState({});
  const [patientMap, setPatientMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    listAppointments()
      .then((res) => setAppointments(res.data))
      .catch(() => showToast("Failed to load appointments", "error"))
      .finally(() => setLoading(false));
    listDoctors()
      .then((res) =>
        setDoctorMap(Object.fromEntries(res.data.map((d) => [d.DoctorId, d]))),
      )
      .catch(() => {});
    listPatients()
      .then((res) =>
        setPatientMap(
          Object.fromEntries(res.data.map((p) => [p.PatientId, p])),
        ),
      )
      .catch(() => {});
  }, []);

  const patientName = (id) => patientMap[id]?.FullName || `#${id}`;
  const doctorName = (id) =>
    doctorMap[id] ? `Dr. ${doctorMap[id].FullName || `#${id}`}` : `#${id}`;

  const filtered = appointments.filter(
    (a) =>
      String(a.AppointmentId).includes(search) ||
      patientName(a.PatientId).toLowerCase().includes(search.toLowerCase()) ||
      doctorName(a.DoctorId).toLowerCase().includes(search.toLowerCase()) ||
      a.status.toLowerCase().includes(search.toLowerCase()),
  );
  const { page, setPage, totalPages, pageItems } = usePagination(filtered, 10);

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex justify-center">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Appointments</h1>
        <div className="flex items-center gap-3">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search by ID, patient, doctor, status..."
          />
          {hasRole("admin", "management", "receptionist") && (
            <Link
              to="/appointments/book"
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 transition whitespace-nowrap"
            >
              + Book Appointment
            </Link>
          )}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Doctor</th>
              <th className="px-4 py-3">Date & Time</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  No appointments found
                </td>
              </tr>
            )}
            {pageItems.map((a) => (
              <tr key={a.AppointmentId} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-800">
                  #{a.AppointmentId}
                </td>
                <td className="px-4 py-3">{patientName(a.PatientId)}</td>
                <td className="px-4 py-3">{doctorName(a.DoctorId)}</td>
                <td className="px-4 py-3">
                  {new Date(a.appointment_date).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[a.status] || "bg-slate-100 text-slate-700"}`}
                  >
                    {a.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    to={`/appointments/${a.AppointmentId}`}
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
