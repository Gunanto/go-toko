import PropTypes from "prop-types";
import logoGezyCommerce from "../assets/logo-gezy-commerce-transparent.png";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="fixed z-30 w-full border-b border-gray-200 bg-white transition-colors duration-200 dark:border-slate-800 dark:bg-slate-950 lg:pl-64">
      <div className="px-4 py-3 lg:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onMenuClick}
              className="inline-flex items-center rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden"
              aria-label="Open sidebar"
            >
              <svg
                className="h-6 w-6"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <img
              src={logoGezyCommerce}
              alt="GEZY Commerce"
              className="h-auto max-h-12 w-auto max-w-[220px] object-contain"
            />
          </div>

          <div className="flex-1 px-4 lg:px-8">
            <div className="relative max-w-lg">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="search"
                placeholder="Cari produk, transaksi, pelanggan..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 md:hidden"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 15a5 5 0 100-10 5 5 0 000 10z" />
                  <path
                    fillRule="evenodd"
                    d="M10 1a1 1 0 011 1v1a1 1 0 11-2 0V2a1 1 0 011-1zm0 15a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm9-7a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM4 10a1 1 0 01-1 1H2a1 1 0 110-2h1a1 1 0 011 1zm11.657-5.657a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM6.464 13.536a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zm8.486 1.414a1 1 0 01-1.414 0l-.707-.707a1 1 0 111.414-1.414l.707.707a1 1 0 010 1.414zM6.464 6.464a1 1 0 01-1.414 0l-.707-.707a1 1 0 111.414-1.414l.707.707a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M17.293 13.293A8 8 0 116.707 2.707a7 7 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="hidden rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 md:inline-flex"
            >
              {theme === "dark" ? "Bright Mode" : "Dark Mode"}
            </button>
            <button
              type="button"
              className="hidden rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 lg:inline-flex"
            >
              Sync Offline
            </button>
            <button
              type="button"
              onClick={logout}
              className="hidden rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 lg:inline-flex"
            >
              Logout
            </button>
            <button
              type="button"
              className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Notifications"
            >
              <svg
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" />
                <path d="M8 16a2 2 0 104 0H8z" />
              </svg>
            </button>
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1 dark:border-slate-800 dark:bg-slate-900">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                {user?.name ? user.name[0]?.toUpperCase() : "GT"}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-gray-900 dark:text-white">
                  {user?.name || "Go Toko"}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                  {user?.role === "admin"
                    ? "Admin"
                    : user?.role === "cashier"
                      ? "Kasir"
                      : "Pengguna"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

Topbar.propTypes = {
  onMenuClick: PropTypes.func.isRequired,
};

export default Topbar;
