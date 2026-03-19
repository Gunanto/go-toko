import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStoreAuth } from "../context/StoreAuthContext";
import { useTheme } from "../context/ThemeContext";

function StoreHeaderActions({
  cartCount = 0,
  showHome = false,
  showStatus = true,
  showCart = true,
  homeLabel = "Katalog",
  homeTo = "/store",
}) {
  const { isAuthenticated } = useStoreAuth();
  const { theme, toggleTheme } = useTheme();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  const dayDate = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  const time = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(now);

  return (
    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:justify-end">
      <button
        type="button"
        onClick={toggleTheme}
        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        aria-label={
          theme === "dark" ? "Beralih ke mode terang" : "Beralih ke mode gelap"
        }
      >
        <span className="flex items-center justify-center gap-2">
          <span aria-hidden="true" className="inline-flex h-4 w-4 items-center">
            {theme === "dark" ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4 stroke-current"
              >
                <circle cx="12" cy="12" r="4" strokeWidth="1.8" />
                <path
                  d="M12 2.75v2.5M12 18.75v2.5M21.25 12h-2.5M5.25 12h-2.5M18.54 5.46l-1.77 1.77M7.23 16.77l-1.77 1.77M18.54 18.54l-1.77-1.77M7.23 7.23 5.46 5.46"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4 stroke-current"
              >
                <path
                  d="M20.5 14.25A8.25 8.25 0 1 1 9.75 3.5a6.75 6.75 0 0 0 10.75 10.75Z"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
          <span>{theme === "dark" ? "Terang" : "Gelap"}</span>
        </span>
      </button>
      <div className="col-span-2 rounded-[1.2rem] border border-slate-200 bg-white px-4 py-2 text-center sm:col-span-1 sm:text-left dark:border-slate-700 dark:bg-slate-900">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          {dayDate}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
          {time}
        </p>
      </div>
      {showHome ? (
        <Link
          to={homeTo}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          {homeLabel}
        </Link>
      ) : null}
      {showStatus ? (
        <Link
          to="/store/orders/status"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          Cek Status
        </Link>
      ) : null}
      <Link
        to={
          isAuthenticated
            ? "/store/account"
            : "/store/login?redirect=/store/account"
        }
        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
      >
        {isAuthenticated ? "Akun" : "Masuk"}
      </Link>
      {showCart ? (
        <Link
          to="/store/cart"
          className="rounded-full bg-slate-950 px-4 py-2 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-sky-500 dark:text-slate-950"
        >
          Keranjang {cartCount > 0 ? `(${cartCount})` : ""}
        </Link>
      ) : null}
    </div>
  );
}

StoreHeaderActions.propTypes = {
  cartCount: PropTypes.number,
  showHome: PropTypes.bool,
  showStatus: PropTypes.bool,
  showCart: PropTypes.bool,
  homeLabel: PropTypes.string,
  homeTo: PropTypes.string,
};

export default StoreHeaderActions;
