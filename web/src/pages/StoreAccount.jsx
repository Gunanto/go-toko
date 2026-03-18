import { Link, Navigate } from "react-router-dom";
import logoCommerce from "../assets/logo-gezy-commerce-transparent.png";
import StoreGoogleButton from "../components/StoreGoogleButton";
import { useStoreAuth } from "../context/StoreAuthContext";
import StoreMobileNav from "../components/StoreMobileNav";

function StoreAccount() {
  const { customer, isAuthenticated, logout } = useStoreAuth();

  if (!isAuthenticated) {
    return <Navigate to="/store/login?redirect=/store/account" replace />;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#eff6ff_100%)] px-4 py-10 pb-28 text-slate-900 lg:pb-10">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img
              src={customer?.avatar_url || logoCommerce}
              alt="GEZY Commerce"
              className="h-10 w-10 rounded-full object-cover"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                Akun Customer
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-950">
                {customer?.name}
              </h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to="/store"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Kembali ke toko
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            ["Email", customer?.email || "-"],
            ["Telepon", customer?.phone || "-"],
            ["Alamat", customer?.address || "-"],
            ["Tier", customer?.tier || "-"],
            ["Provider", customer?.auth_provider || "-"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                {label}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/store/cart"
            className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white"
          >
            Lanjut ke checkout
          </Link>
          <Link
            to="/store/orders/status"
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Cek status pesanan
          </Link>
          <StoreGoogleButton
            redirect="/store/account"
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
          />
        </div>
      </div>
      <StoreMobileNav />
    </div>
  );
}

export default StoreAccount;
