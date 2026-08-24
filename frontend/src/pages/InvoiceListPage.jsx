import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listInvoices } from "../api/billing";
import SearchInput from "../components/SearchInput";
import Pagination from "../components/Pagination";
import { usePagination } from "../hooks/usePagination";
import Spinner from "../components/Spinner";
import { useToast } from "../context/ToastContext";

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-700",
  partial: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function InvoiceListPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    listInvoices()
      .then((res) => setInvoices(res.data))
      .catch((err) =>
        showToast(
          err.response?.data?.detail || "Failed to load invoices",
          "error",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = invoices.filter(
    (inv) =>
      String(inv.InvoiceId).includes(search) ||
      String(inv.PatientId).includes(search) ||
      inv.status.toLowerCase().includes(search.toLowerCase()),
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
        <h1 className="text-2xl font-bold text-slate-800">All Invoices</h1>
        <div className="flex items-center gap-3">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search by invoice ID, patient ID, status..."
          />
          <Link
            to="/billing/invoices/new"
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 transition whitespace-nowrap"
          >
            + Create Invoice
          </Link>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3">Invoice ID</th>
              <th className="px-4 py-3">Patient ID</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Billing Date</th>
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
                  No invoices found
                </td>
              </tr>
            )}
            {pageItems.map((inv) => (
              <tr key={inv.InvoiceId} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-800">
                  #{inv.InvoiceId}
                </td>
                <td className="px-4 py-3">{inv.PatientId}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[inv.status] || "bg-slate-100 text-slate-700"}`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  ${Number(inv.total_amount).toFixed(2)}
                </td>
                <td className="px-4 py-3">{inv.billing_date}</td>
                <td className="px-4 py-3">
                  <Link
                    to={`/billing/invoices/${inv.InvoiceId}`}
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
