import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listPatients } from "../../api/patient";
import SearchInput from "../../components/SearchInput";
import Pagination from "../../components/Pagination";
import { usePagination } from "../../hooks/usePagination";
import Spinner from "../../components/Spinner";
import { useToast } from "../../context/ToastContext";

export default function PatientListPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    listPatients()
      .then((res) => setPatients(res.data))
      .catch(() => showToast("Failed to load patients", "error"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter(
    (p) =>
      String(p.PatientId).includes(search) ||
      p.FullName?.toLowerCase().includes(search.toLowerCase()) ||
      p.blood_type?.toLowerCase().includes(search.toLowerCase()),
  );
  const { page, setPage, totalPages, pageItems } = usePagination(filtered, 8);

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex justify-center">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-800">All Patients</h1>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by name, ID, blood type..."
        />
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Patient ID</th>
              <th className="px-4 py-3">Age</th>
              <th className="px-4 py-3">Blood Type</th>
              <th className="px-4 py-3">Gender</th>
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
                  No patients found
                </td>
              </tr>
            )}
            {pageItems.map((p) => (
              <tr key={p.PatientId} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {p.FullName || `User #${p.UserId}`}
                </td>
                <td className="px-4 py-3">#{p.PatientId}</td>
                <td className="px-4 py-3">{p.age}</td>
                <td className="px-4 py-3">{p.blood_type}</td>
                <td className="px-4 py-3">{p.gender}</td>
                <td className="px-4 py-3">
                  <Link
                    to={`/patients/${p.PatientId}`}
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
