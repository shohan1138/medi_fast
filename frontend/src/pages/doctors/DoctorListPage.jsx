import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listDoctors } from "../../api/doctor";
import SearchInput from "../../components/SearchInput";
import Pagination from "../../components/Pagination";
import { usePagination } from "../../hooks/usePagination";
import Spinner from "../../components/Spinner";
import { useToast } from "../../context/ToastContext";

export default function DoctorListPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    listDoctors()
      .then((res) => setDoctors(res.data))
      .catch(() => showToast("Failed to load doctors", "error"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = doctors.filter(
    (d) =>
      String(d.DoctorId).includes(search) ||
      d.FullName?.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty?.toLowerCase().includes(search.toLowerCase()) ||
      d.license_number?.toLowerCase().includes(search.toLowerCase()),
  );
  const { page, setPage, totalPages, pageItems } = usePagination(filtered, 9);

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex justify-center">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-800">All Doctors</h1>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by name, specialty, license..."
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pageItems.length === 0 && (
          <p className="text-slate-400">No doctors found</p>
        )}
        {pageItems.map((d) => (
          <Link
            key={d.DoctorId}
            to={`/doctors/${d.DoctorId}`}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition border border-slate-200"
          >
            <p className="font-semibold text-slate-800">
              Dr. {d.FullName || `#${d.DoctorId}`}
            </p>
            <p className="text-sm text-slate-500">{d.specialty}</p>
            <p className="text-xs text-slate-400 mt-1">
              License: {d.license_number}
            </p>
          </Link>
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
