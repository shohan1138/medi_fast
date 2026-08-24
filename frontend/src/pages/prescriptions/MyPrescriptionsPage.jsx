import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyPrescriptions } from "../../api/prescription";
import Spinner from "../../components/Spinner";
import Pagination from "../../components/Pagination";
import { usePagination } from "../../hooks/usePagination";
import { useToast } from "../../context/ToastContext";

const STATUS_COLORS = {
  active: "bg-blue-100 text-blue-700",
  dispensed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function MyPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { page, setPage, totalPages, pageItems } = usePagination(
    prescriptions,
    8,
  );

  useEffect(() => {
    getMyPrescriptions()
      .then((res) =>
        setPrescriptions(
          [...res.data].sort(
            (a, b) => new Date(b.issued_at) - new Date(a.issued_at),
          ),
        ),
      )
      .catch(() => showToast("Failed to load prescriptions", "error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex justify-center">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">My Prescriptions</h1>
        <Link
          to="/prescriptions"
          className="text-sm text-blue-600 hover:underline"
        >
          Back to Prescriptions
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Appointment ID</th>
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
                  colSpan={6}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  No prescriptions
                </td>
              </tr>
            )}
            {pageItems.map((p) => (
              <tr key={p.PrescriptionId} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-800">
                  #{p.PrescriptionId}
                </td>
                <td className="px-4 py-3">{p.AppointmentId}</td>
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
