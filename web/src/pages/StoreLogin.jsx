import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import logoCommerce from "../assets/logo-gezy-commerce-transparent.png";
import StoreGoogleButton from "../components/StoreGoogleButton";
import { useStoreAuth } from "../context/StoreAuthContext";

function StoreLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loading } = useStoreAuth();
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const redirectTo = searchParams.get("redirect") || "/store/account";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await login(loginValue, password);
      navigate(redirectTo);
    } catch (err) {
      setError(err.message || "Login customer gagal.");
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#eff6ff_100%)] px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft-xl">
        <div className="flex items-center gap-3">
          <img
            src={logoCommerce}
            alt="GEZY Commerce"
            className="h-10 w-auto object-contain"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
              Customer Login
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">
              Masuk ke akun belanja
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="text"
            value={loginValue}
            onChange={(event) => setLoginValue(event.target.value)}
            placeholder="Email atau nomor telepon"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
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
            {loading ? "Memproses..." : "Masuk"}
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
            Kembali ke toko
          </Link>
          <Link
            to={`/store/register?redirect=${encodeURIComponent(redirectTo)}`}
            className="font-semibold text-sky-700"
          >
            Buat akun
          </Link>
        </div>
      </div>
    </div>
  );
}

export default StoreLogin;
