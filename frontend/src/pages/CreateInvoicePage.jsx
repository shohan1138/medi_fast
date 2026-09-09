import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { createInvoice } from "../api/billing";

const ITEM_TYPES = ["appointment", "test", "ward", "bed"];
const emptyItem = {
  item_type: "appointment",
  reference_id: "",
  description: "",
  unit_price: "",
  quantity: 1,
};

export default function CreateInvoicePage() {
  const [searchParams] = useSearchParams();
  const [patientId, setPatientId] = useState(
    searchParams.get("patientId") || "",
  );
  const [appointmentId, setAppointmentId] = useState(
    searchParams.get("appointmentId") || "",
  );
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [billingDate, setBillingDate] = useState("");
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const updateItem = (index, field, value) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: value };
    setItems(next);
  };

  const addItem = () => setItems([...items, { ...emptyItem }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const total = items.reduce(
    (sum, i) => sum + (Number(i.unit_price) || 0) * (Number(i.quantity) || 0),
    0,
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await createInvoice({
        PatientId: Number(patientId),
        AppointmentId: appointmentId ? Number(appointmentId) : null,
        insurance_provider: insuranceProvider || null,
        billing_date: billingDate || null,
        items: items.map((i) => ({
          item_type: i.item_type,
          reference_id: i.reference_id ? Number(i.reference_id) : null,
          description: i.description,
          unit_price: Number(i.unit_price),
          quantity: Number(i.quantity),
        })),
      });
      navigate(`/billing/invoices/${res.data.InvoiceId}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create invoice");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Create Invoice</h1>
        <Link to="/billing" className="text-sm text-blue-600 hover:underline">
          Back to Billing
        </Link>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow p-6 max-w-2xl space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Patient ID
            </label>
            <input
              type="number"
              required
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Appointment ID (optional)
            </label>
            <input
              type="number"
              value={appointmentId}
              onChange={(e) => setAppointmentId(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Insurance Provider (optional)
            </label>
            <input
              value={insuranceProvider}
              onChange={(e) => setInsuranceProvider(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Billing Date
            </label>
            <input
              type="date"
              value={billingDate}
              onChange={(e) => setBillingDate(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold text-slate-800">Invoice Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="text-sm text-blue-600 hover:underline"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 items-start border border-slate-200 rounded p-3"
              >
                <select
                  value={item.item_type}
                  onChange={(e) => updateItem(idx, "item_type", e.target.value)}
                  className="col-span-2 border border-slate-300 rounded px-2 py-1 text-sm"
                >
                  {ITEM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Description"
                  required
                  value={item.description}
                  onChange={(e) =>
                    updateItem(idx, "description", e.target.value)
                  }
                  className="col-span-4 border border-slate-300 rounded px-2 py-1 text-sm"
                />
                <input
                  type="number"
                  placeholder="Unit Price"
                  required
                  value={item.unit_price}
                  onChange={(e) =>
                    updateItem(idx, "unit_price", e.target.value)
                  }
                  className="col-span-2 border border-slate-300 rounded px-2 py-1 text-sm"
                />
                <input
                  type="number"
                  placeholder="Qty"
                  required
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                  className="col-span-1 border border-slate-300 rounded px-2 py-1 text-sm"
                />
                <input
                  type="number"
                  placeholder="Ref ID"
                  value={item.reference_id}
                  onChange={(e) =>
                    updateItem(idx, "reference_id", e.target.value)
                  }
                  className="col-span-2 border border-slate-300 rounded px-2 py-1 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  disabled={items.length === 1}
                  className="col-span-1 text-red-500 hover:text-red-700 disabled:opacity-30 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
          <p className="font-semibold text-slate-800">
            Total: ${total.toFixed(2)}
          </p>
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            Create Invoice
          </button>
        </div>
      </form>
    </div>
  );
}
