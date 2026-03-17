import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Register() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess(false);
    try {
      await register(form.name, form.username, form.email, form.password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 600);
    } catch (err) {
      setError(err.message || "Registrasi gagal");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-900 px-4 py-12">
      <div className="mx-auto max-w-md rounded-3xl bg-white/95 p-8 shadow-soft-xl dark:bg-slate-950 dark:text-slate-100">
        <div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            Daftar Akun
          </p>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Buat akun kasir baru.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
              Nama
            </label>
            <input
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              placeholder="Nama lengkap"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
              Username
            </label>
            <input
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              placeholder="cashier01"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
              Email
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              placeholder="you@email.com"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
              Password
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              placeholder="Minimal 8 karakter"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-600">
              Berhasil daftar. Mengalihkan ke login...
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-soft-xl hover:bg-cyan-700 disabled:opacity-70"
          >
            {loading ? "Memproses..." : "Buat Akun"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-500 dark:text-slate-400">
          Sudah punya akun?{" "}
          <Link to="/login" className="font-semibold text-cyan-600">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
