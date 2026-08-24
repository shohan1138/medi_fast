import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getMyPatientProfile,
  createMyPatientProfile,
  updateMyPatientProfile,
} from "../../api/patient";

const emptyForm = {
  age: "",
  blood_type: "",
  gender: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  medical_history: "",
};

export default function MyPatientProfilePage() {
  const [profile, setProfile] = useState(null);
  const [exists, setExists] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getMyPatientProfile();
      setProfile(res.data);
      setExists(true);
      setForm({
        age: res.data.age,
        blood_type: res.data.blood_type,
        gender: res.data.gender,
        emergency_contact_name: res.data.emergency_contact_name,
        emergency_contact_phone: res.data.emergency_contact_phone,
        medical_history: res.data.medical_history || "",
      });
    } catch {
      setExists(false);
      setEditing(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const payload = {
      age: Number(form.age),
      blood_type: form.blood_type,
      gender: form.gender,
      emergency_contact_name: form.emergency_contact_name,
      emergency_contact_phone: form.emergency_contact_phone,
      medical_history: form.medical_history || null,
    };
    try {
      if (exists) await updateMyPatientProfile(payload);
      else await createMyPatientProfile(payload);
      setEditing(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save profile");
    }
  };

  if (loading) return <div className="p-8 text-slate-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          My Patient Profile
        </h1>
        <Link to="/patients" className="text-sm text-blue-600 hover:underline">
          Back to Patients
        </Link>
      </div>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {!editing && exists && profile ? (
        <div className="bg-white rounded-lg shadow p-6 max-w-lg">
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-slate-500">Age</dt>
              <dd className="font-medium">{profile.age}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Blood Type</dt>
              <dd className="font-medium">{profile.blood_type}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Gender</dt>
              <dd className="font-medium">{profile.gender}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Emergency Contact</dt>
              <dd className="font-medium">{profile.emergency_contact_name}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Emergency Phone</dt>
              <dd className="font-medium">{profile.emergency_contact_phone}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-sm text-slate-500">Medical History</dt>
              <dd className="font-medium">{profile.medical_history || "—"}</dd>
            </div>
          </dl>
          <button
            onClick={() => setEditing(true)}
            className="mt-6 text-blue-600 text-sm hover:underline"
          >
            Edit Profile
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow p-6 max-w-lg space-y-4"
        >
          {!exists && (
            <p className="text-sm text-slate-500">
              You don't have a patient profile yet — fill this in to create one.
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Age
              </label>
              <input
                name="age"
                type="number"
                required
                value={form.age}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Blood Type
              </label>
              <input
                name="blood_type"
                required
                value={form.blood_type}
                onChange={handleChange}
                placeholder="e.g. O+"
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Gender
            </label>
            <select
              name="gender"
              required
              value={form.gender}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Emergency Contact Name
              </label>
              <input
                name="emergency_contact_name"
                required
                value={form.emergency_contact_name}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Emergency Contact Phone
              </label>
              <input
                name="emergency_contact_phone"
                required
                value={form.emergency_contact_phone}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Medical History (optional)
            </label>
            <textarea
              name="medical_history"
              value={form.medical_history}
              onChange={handleChange}
              rows={3}
              className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              {exists ? "Save Changes" : "Create Profile"}
            </button>
            {exists && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
