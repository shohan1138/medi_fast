import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listPrescriptions } from "../../api/prescription";
import { listAppointments } from "../../api/appointment";
import { listPatients } from "../../api/patient";
import { listDoctors } from "../../api/doctor";
import SearchInput from "../../components/SearchInput";
import Pagination from "../../components/Pagination";
import { usePagination } from "../../hooks/usePagination";
import Spinner from "../../components/Spinner";
import { useToast } from "../../context/ToastContext";

const STATUS_COLORS = {
  active: "bg-blue-100 text-blue-700",
  dispensed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AllPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [appointmentMap, setAppointmentMap] = useState({});
  const [patientMap, setPatientMap] = useState({});
  const [doctorMap, setDoctorMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    listPrescriptions()
      .then((res) => setPrescriptions(res.data))
      .catch(() => showToast("Failed to load prescriptions", "error"))
      .finally(() => setLoading(false));

    listAppointments()
      .then((res) =>
        setAppointmentMap(
          Object.fromEntries(res.data.map((a) => [a.AppointmentId, a])),
        ),
      )
      .catch(() => {});
    listPatients()
      .then((res) =>
        setPatientMap(
          Object.fromEntries(res.data.map((p) => [p.PatientId, p])),
        ),
      )
      .catch(() => {});
    listDoctors()
      .then((res) =>
        setDoctorMap(Object.fromEntries(res.data.map((d) => [d.DoctorId, d]))),
      )
      .catch(() => {});
  }, []);

  const patientNameFor = (appointmentId) => {
    const appt = appointmentMap[appointmentId];
    if (!appt) return "—";
    return patientMap[appt.PatientId]?.FullName || `#${appt.PatientId}`;
  };
  const doctorNameFor = (appointmentId) => {
    const appt = appointmentMap[appointmentId];
    if (!appt) return "—";
    return doctorMap[appt.DoctorId]
      ? `Dr. ${doctorMap[appt.DoctorId].FullName || `#${appt.DoctorId}`}`
      : `#${appt.DoctorId}`;
  };

  const filtered = prescriptions.filter(
    (p) =>
      String(p.PrescriptionId).includes(search) ||
      String(p.AppointmentId).includes(search) ||
      p.status.toLowerCase().includes(search.toLowerCase()) ||
      patientNameFor(p.AppointmentId)
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      doctorNameFor(p.AppointmentId)
        .toLowerCase()
        .includes(search.toLowerCase()),
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
        <h1 className="text-2xl font-bold text-slate-800">All Prescriptions</h1>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by ID, patient, doctor, status..."
        />
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Doctor</th>
              <th className="px-4 py-3">Issued</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  No prescriptions found
                </td>
              </tr>
            )}
            {pageItems.map((p) => (
              <tr key={p.PrescriptionId} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-800">
                  #{p.PrescriptionId}
                </td>
                <td className="px-4 py-3">{patientNameFor(p.AppointmentId)}</td>
                <td className="px-4 py-3">{doctorNameFor(p.AppointmentId)}</td>
                <td className="px-4 py-3">
                  {new Date(p.issued_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[p.status] || "bg-slate-100 text-slate-700"}`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3">{p.items?.length || 0}</td>
                <td className="px-4 py-3">
                  <Link
                    to={`/prescriptions/${p.PrescriptionId}`}
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
