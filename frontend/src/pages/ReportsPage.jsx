import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getReportsSummary,
  getRevenueByWard,
  getDoctorAppointmentLoad,
  getRevenueByServiceType,
} from "../api/reports";
import Spinner from "../components/Spinner";
import { useToast } from "../context/ToastContext";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function ReportsPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [summary, setSummary] = useState(null);
  const [wardRevenue, setWardRevenue] = useState([]);
  const [doctorLoad, setDoctorLoad] = useState([]);
  const [serviceRevenue, setServiceRevenue] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [summaryRes, wardRes, doctorRes, serviceRes] = await Promise.all([
        getReportsSummary(year, month),
        getRevenueByWard(year, month),
        getDoctorAppointmentLoad(year, month),
        getRevenueByServiceType(year, month),
      ]);
      setSummary(summaryRes.data);
      setWardRevenue(wardRes.data);
      setDoctorLoad(doctorRes.data);
      setServiceRevenue(serviceRes.data);
    } catch (err) {
      showToast(
        err.response?.data?.detail || "Failed to load reports",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [year, month]);

  const maxWardRevenue = Math.max(
    1,
    ...wardRevenue.map((w) => w.total_revenue),
  );
  const maxServiceRevenue = Math.max(
    1,
    ...serviceRevenue.map((s) => s.total_revenue),
  );
  const maxDoctorLoad = Math.max(
    1,
    ...doctorLoad.map((d) => d.total_appointments),
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-3 items-end flex-wrap max-w-lg">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-slate-300 rounded px-3 py-2 text-sm"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-slate-300 rounded px-3 py-2 text-sm w-24"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl">
          {summary && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-slate-500">Total Revenue</p>
                <p className="text-3xl font-bold text-slate-800">
                  ${summary.total_revenue.toFixed(2)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {summary.period_start} – {summary.period_end}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-slate-500">Invoices Issued</p>
                <p className="text-3xl font-bold text-slate-800">
                  {summary.invoice_count}
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-semibold text-slate-800 mb-4">
              Revenue by Ward
            </h2>
            {wardRevenue.length === 0 ? (
              <p className="text-sm text-slate-400">
                No ward revenue this period
              </p>
            ) : (
              <div className="space-y-3">
                {wardRevenue.map((w) => (
                  <div key={w.ward_name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">
                        {w.ward_name}
                      </span>
                      <span className="text-slate-500">
                        ${w.total_revenue.toFixed(2)} · {w.invoice_count}{" "}
                        invoice(s)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${(w.total_revenue / maxWardRevenue) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-semibold text-slate-800 mb-4">
              Revenue by Service Type
            </h2>
            {serviceRevenue.length === 0 ? (
              <p className="text-sm text-slate-400">
                No billed items this period
              </p>
            ) : (
              <div className="space-y-3">
                {serviceRevenue.map((s) => (
                  <div key={s.item_type}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700 capitalize">
                        {s.item_type}
                      </span>
                      <span className="text-slate-500">
                        ${s.total_revenue.toFixed(2)} · {s.total_items_billed}{" "}
                        item(s)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${(s.total_revenue / maxServiceRevenue) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-semibold text-slate-800 mb-4">
              Doctor Appointment Load
            </h2>
            {doctorLoad.length === 0 ? (
              <p className="text-sm text-slate-400">No doctors found</p>
            ) : (
              <div className="space-y-3">
                {doctorLoad.map((d) => (
                  <div key={`${d.doctor_name}-${d.specialty}`}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">
                        Dr. {d.doctor_name}{" "}
                        <span className="text-slate-400 font-normal">
                          · {d.specialty}
                        </span>
                      </span>
                      <span className="text-slate-500">
                        {d.total_appointments} appointment(s)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{
                          width: `${(d.total_appointments / maxDoctorLoad) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
