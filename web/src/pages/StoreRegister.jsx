import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import logoCommerce from "../assets/logo-gezy-commerce-transparent.png";
import PasswordField from "../components/PasswordField";
import StoreGoogleButton from "../components/StoreGoogleButton";
import { useStoreAuth } from "../context/StoreAuthContext";

function StoreRegister() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, loading } = useStoreAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "ambil di toko",
    password: "",
  });
  const [error, setError] = useState("");

  const redirectTo = searchParams.get("redirect") || "/store/account";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await register(form);
      navigate(redirectTo);
    } catch (err) {
      setError(err.message || "Pendaftaran akun belum berhasil. Coba lagi.");
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#fffdf8_0%,_#eff6ff_100%)] px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft-xl">
        <div className="flex items-center gap-3">
          <img
            src={logoCommerce}
            alt="GEZY Commerce"
            className="h-10 w-auto object-contain"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              Akun Baru
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">
              Daftar untuk belanja lebih praktis
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <input
            type="text"
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
            placeholder="Nama lengkap"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
          />
          <input
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, email: event.target.value }))
            }
            placeholder="Email"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
          />
          <input
            type="text"
            value={form.phone}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, phone: event.target.value }))
            }
            placeholder="Nomor WhatsApp / telepon"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
          />
          <textarea
            rows={3}
            value={form.address}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, address: event.target.value }))
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
          />
          <PasswordField
            value={form.password}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, password: event.target.value }))
            }
            placeholder="Password minimal 8 karakter"
          />
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Daftar Sekarang"}
          </button>
        </form>

        <div className="mt-4">
          <StoreGoogleButton
            redirect={redirectTo}
            className="block w-full rounded-xl border border-slate-200 px-5 py-3 text-center text-sm font-semibold text-slate-700"
          />
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link to="/store" className="font-semibold text-slate-600">
            Kembali belanja
          </Link>
          <Link
            to={`/store/login?redirect=${encodeURIComponent(redirectTo)}`}
            className="font-semibold text-sky-700"
          >
            Sudah punya akun?
          </Link>
        </div>
      </div>
    </div>
  );
}

export default StoreRegister;
