import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../api/client";

const FIELDS = [
  { name: "username", label: "Username", type: "text" },
  { name: "FullName", label: "Full Name", type: "text" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone_number", label: "Phone Number", type: "text" },
  { name: "password", label: "Password", type: "password" },
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: "",
    FullName: "",
    email: "",
    phone_number: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await apiClient.post("/auth/register", form);
      setSuccess(true);
      // setTimeout(() => navigate("/login"), 2500)
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm text-center">
          <h1 className="text-xl font-semibold text-slate-800 mb-3">
            Account Created
          </h1>
          <p className="text-slate-600 text-sm">
            An administrator needs to assign you a role before you can access
            any features.
          </p>
          <button
            onClick={() => navigate("login")}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transtion"
          >
            Continue to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm"
      >
        <h1 className="text-2xl font-semibold mb-6 text-slate-800">
          Create Account
        </h1>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        {FIELDS.map((field) => (
          <div key={field.name} className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {field.label}
            </label>
            <input
              name={field.name}
              type={field.type}
              value={form[field.name]}
              onChange={handleChange}
              required
              className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Register
        </button>
        <p className="text-sm text-slate-500 mt-4 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
