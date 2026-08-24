import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  listWards,
  createWard,
  listBedsInWard,
  createBed,
  listWardAssignments,
  admitPatient,
  dischargePatient,
} from "../api/billing";

export default function WardAdmissionPage() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const [wards, setWards] = useState([]);
  const [bedLookup, setBedLookup] = useState({}); // BedId -> { ward_name, bed_number, is_occupied, WardId }
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [admitForm, setAdmitForm] = useState({
    patientId: "",
    wardId: "",
    bedId: "",
  });
  const [newWard, setNewWard] = useState({ name: "", daily_rate: "" });
  const [newBed, setNewBed] = useState({ wardId: "", bed_number: "" });

  const loadData = async () => {
    setLoading(true);
    try {
      const wardsRes = await listWards();
      setWards(wardsRes.data);

      const bedResults = await Promise.all(
        wardsRes.data.map((w) => listBedsInWard(w.WardId)),
      );
      const lookup = {};
      bedResults.forEach((res, i) => {
        res.data.forEach((bed) => {
          lookup[bed.BedId] = { ...bed, ward_name: wardsRes.data[i].name };
        });
      });
      setBedLookup(lookup);

      const assignRes = await listWardAssignments(true);
      setAssignments(assignRes.data);
    } catch (err) {
      setError("Failed to load ward data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const availableBeds = Object.values(bedLookup).filter(
    (b) => String(b.WardId) === String(admitForm.wardId) && !b.is_occupied,
  );

  const handleAdmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await admitPatient({
        PatientId: Number(admitForm.patientId),
        BedId: Number(admitForm.bedId),
      });
      setAdmitForm({ patientId: "", wardId: "", bedId: "" });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to admit patient");
    }
  };

  const handleDischarge = async (assignmentId) => {
    try {
      const res = await dischargePatient(assignmentId);
      navigate(`/billing/invoices/${res.data.InvoiceId}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to discharge patient");
    }
  };

  const handleCreateWard = async (e) => {
    e.preventDefault();
    try {
      await createWard({
        name: newWard.name,
        daily_rate: Number(newWard.daily_rate),
      });
      setNewWard({ name: "", daily_rate: "" });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create ward");
    }
  };

  const handleCreateBed = async (e) => {
    e.preventDefault();
    try {
      await createBed({
        WardId: Number(newBed.wardId),
        bed_number: newBed.bed_number,
      });
      setNewBed({ wardId: "", bed_number: "" });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create bed");
    }
  };

  if (loading)
    return <div className="p-8 text-slate-500">Loading ward data...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Ward Admission & Discharge
        </h1>
        <Link to="/billing" className="text-sm text-blue-600 hover:underline">
          Back to Billing
        </Link>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {hasRole("admin") && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <form
            onSubmit={handleCreateWard}
            className="bg-white rounded-lg shadow p-4 flex gap-2 items-end"
          >
            <div className="flex-1">
              <label className="block text-xs text-slate-500 mb-1">
                New Ward Name
              </label>
              <input
                value={newWard.name}
                onChange={(e) =>
                  setNewWard({ ...newWard, name: e.target.value })
                }
                required
                className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div className="w-28">
              <label className="block text-xs text-slate-500 mb-1">
                Daily Rate
              </label>
              <input
                type="number"
                value={newWard.daily_rate}
                onChange={(e) =>
                  setNewWard({ ...newWard, daily_rate: e.target.value })
                }
                required
                className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <button className="bg-slate-800 text-white text-sm px-3 py-1.5 rounded">
              Add Ward
            </button>
          </form>

          <form
            onSubmit={handleCreateBed}
            className="bg-white rounded-lg shadow p-4 flex gap-2 items-end"
          >
            <div className="flex-1">
              <label className="block text-xs text-slate-500 mb-1">Ward</label>
              <select
                value={newBed.wardId}
                onChange={(e) =>
                  setNewBed({ ...newBed, wardId: e.target.value })
                }
                required
                className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
              >
                <option value="">Select ward</option>
                {wards.map((w) => (
                  <option key={w.WardId} value={w.WardId}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-28">
              <label className="block text-xs text-slate-500 mb-1">
                Bed Number
              </label>
              <input
                value={newBed.bed_number}
                onChange={(e) =>
                  setNewBed({ ...newBed, bed_number: e.target.value })
                }
                required
                className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <button className="bg-slate-800 text-white text-sm px-3 py-1.5 rounded">
              Add Bed
            </button>
          </form>
        </div>
      )}

      <form
        onSubmit={handleAdmit}
        className="bg-white rounded-lg shadow p-6 mb-6 flex gap-3 items-end flex-wrap"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Patient ID
          </label>
          <input
            type="number"
            required
            value={admitForm.patientId}
            onChange={(e) =>
              setAdmitForm({ ...admitForm, patientId: e.target.value })
            }
            className="border border-slate-300 rounded px-3 py-2 w-32"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Ward
          </label>
          <select
            required
            value={admitForm.wardId}
            onChange={(e) =>
              setAdmitForm({ ...admitForm, wardId: e.target.value, bedId: "" })
            }
            className="border border-slate-300 rounded px-3 py-2"
          >
            <option value="">Select ward</option>
            {wards.map((w) => (
              <option key={w.WardId} value={w.WardId}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Bed
          </label>
          <select
            required
            value={admitForm.bedId}
            onChange={(e) =>
              setAdmitForm({ ...admitForm, bedId: e.target.value })
            }
            disabled={!admitForm.wardId}
            className="border border-slate-300 rounded px-3 py-2 disabled:bg-slate-100"
          >
            <option value="">Select bed</option>
            {availableBeds.map((b) => (
              <option key={b.BedId} value={b.BedId}>
                {b.bed_number}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Admit Patient
        </button>
      </form>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3">Patient ID</th>
              <th className="px-4 py-3">Ward</th>
              <th className="px-4 py-3">Bed</th>
              <th className="px-4 py-3">Admitted At</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  No active admissions
                </td>
              </tr>
            )}
            {assignments.map((a) => {
              const bed = bedLookup[a.BedId];
              return (
                <tr
                  key={a.WardAssignmentId}
                  className="border-t border-slate-100"
                >
                  <td className="px-4 py-3 font-medium">{a.PatientId}</td>
                  <td className="px-4 py-3">{bed?.ward_name || "—"}</td>
                  <td className="px-4 py-3">{bed?.bed_number || "—"}</td>
                  <td className="px-4 py-3">
                    {new Date(a.admitted_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDischarge(a.WardAssignmentId)}
                      className="text-red-600 hover:underline"
                    >
                      Discharge
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
