import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getInvoice, updateInvoiceStatus } from "../api/billing";

const STATUSES = ["pending", "partial", "paid", "cancelled"];

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await getInvoice(invoiceId);
      setInvoice(res.data);
      setStatus(res.data.status);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load invoice");
    }
  };

  useEffect(() => {
    load();
  }, [invoiceId]);

  const handleStatusUpdate = async () => {
    setSaving(true);
    try {
      await updateInvoiceStatus(invoiceId, status);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!invoice) return <div className="p-8 text-slate-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Invoice #{invoice.InvoiceId}
        </h1>
        <Link
          to="/billing/invoices"
          className="text-sm text-blue-600 hover:underline"
        >
          Back to Invoices
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl mb-6">
        <dl className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <dt className="text-sm text-slate-500">Patient ID</dt>
            <dd className="font-medium">{invoice.PatientId}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Appointment ID</dt>
            <dd className="font-medium">{invoice.AppointmentId || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Insurance Provider</dt>
            <dd className="font-medium">{invoice.insurance_provider || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Billing Date</dt>
            <dd className="font-medium">{invoice.billing_date}</dd>
          </div>
        </dl>

        <div className="flex items-center gap-2 mb-6">
          <label className="text-sm font-medium text-slate-700">Status:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            onClick={handleStatusUpdate}
            disabled={saving || status === invoice.status}
            className="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-40"
          >
            {saving ? "Saving..." : "Update Status"}
          </button>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Unit Price</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr
                key={item.InvoiceItemId}
                className="border-t border-slate-100"
              >
                <td className="px-3 py-2">{item.item_type}</td>
                <td className="px-3 py-2">{item.description}</td>
                <td className="px-3 py-2">
                  ${Number(item.unit_price).toFixed(2)}
                </td>
                <td className="px-3 py-2">{item.quantity}</td>
                <td className="px-3 py-2">
                  ${Number(item.subtotal).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-right mt-4 font-semibold text-slate-800">
          Total: ${Number(invoice.total_amount).toFixed(2)}
        </div>
      </div>
    </div>
  );
}
