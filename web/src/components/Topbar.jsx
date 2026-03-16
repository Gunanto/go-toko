import PropTypes from "prop-types";
import { useAuth } from "../context/AuthContext";

function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();

  return (
    <nav className="fixed z-30 w-full border-b border-gray-200 bg-white">
      <div className="px-4 py-3 lg:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onMenuClick}
              className="inline-flex items-center rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 lg:hidden"
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
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-600 text-white shadow-soft-xl">
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M2 5a2 2 0 012-2h3.5a1 1 0 01.8.4l1.5 2a1 1 0 00.8.4H16a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Go Toko</p>
                <p className="text-xs text-gray-500">POS & Inventory</p>
              </div>
            </div>
          </div>

          <div className="hidden flex-1 px-8 lg:block">
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
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="hidden rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 lg:inline-flex"
            >
              Sync Offline
            </button>
            <button
              type="button"
              onClick={logout}
              className="hidden rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 lg:inline-flex"
            >
              Logout
            </button>
            <button
              type="button"
              className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50"
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
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                {user?.name ? user.name[0]?.toUpperCase() : "GT"}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-gray-900">
                  {user?.name || "Go Toko"}
                </p>
                <p className="text-[11px] text-gray-500">
                  {user?.username || "owner"}
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
