import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStoreAuth } from "../context/StoreAuthContext";

function StoreOAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { consumeToken } = useStoreAuth();
  const token = searchParams.get("token");
  const redirect = searchParams.get("redirect") || "/store/account";
  const error = token ? "" : "Token login Google tidak ditemukan.";

  useEffect(() => {
    if (!token) {
      return;
    }

    consumeToken(token);
    navigate(redirect, { replace: true });
  }, [consumeToken, navigate, redirect, token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-soft-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
          Google Sign-In
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">
          {error ? "Login gagal" : "Menyelesaikan login..."}
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          {error || "Mohon tunggu, akun belanja kamu sedang disiapkan."}
        </p>
      </div>
    </div>
  );
}

export default StoreOAuthCallback;
