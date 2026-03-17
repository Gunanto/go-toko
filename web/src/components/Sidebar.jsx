import PropTypes from "prop-types";
import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/", icon: "chart" },
  { label: "Kasir (POS)", to: "/pos", icon: "cash" },
  { label: "Produk", to: "/products", icon: "bag" },
  { label: "Pesanan", to: "/orders", icon: "receipt" },
  { label: "Pelanggan", to: "/customers", icon: "users" },
  { label: "Inventori", to: "/inventory", icon: "boxes" },
  { label: "Laporan", to: "/reports", icon: "report" },
  { label: "Pengaturan", to: "/settings", icon: "settings" },
];

const iconMap = {
  chart: <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />,
  cash: (
    <>
      <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
      <path d="M10 7a3 3 0 100 6 3 3 0 000-6z" />
    </>
  ),
  bag: (
    <path
      fillRule="evenodd"
      d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4z"
      clipRule="evenodd"
    />
  ),
  receipt: (
    <path
      fillRule="evenodd"
      d="M5 2a1 1 0 00-1 1v14l2-1 2 1 2-1 2 1 2-1 2 1V3a1 1 0 00-1-1H5zm2 4h6v2H7V6zm0 4h6v2H7v-2z"
      clipRule="evenodd"
    />
  ),
  users: (
    <path
      fillRule="evenodd"
      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
      clipRule="evenodd"
    />
  ),
  boxes: (
    <path
      fillRule="evenodd"
      d="M3 3a1 1 0 011-1h3a1 1 0 011 1v3H4a1 1 0 01-1-1V3zm7-1h3a1 1 0 011 1v3h-4V2zm-7 9a1 1 0 011-1h3v4H4a1 1 0 01-1-1v-2zm7-1h4v4h-3a1 1 0 01-1-1v-3z"
      clipRule="evenodd"
    />
  ),
  report: (
    <path
      fillRule="evenodd"
      d="M4 3a1 1 0 000 2h1v10H4a1 1 0 100 2h12a1 1 0 100-2h-1V5h1a1 1 0 100-2H4zm6 4a1 1 0 011 1v5a1 1 0 11-2 0V8a1 1 0 011-1zm-3 2a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm6-1a1 1 0 011 1v4a1 1 0 11-2 0V9a1 1 0 011-1z"
      clipRule="evenodd"
    />
  ),
  settings: (
    <path
      fillRule="evenodd"
      d="M11.983 1.5a1 1 0 00-1.966 0l-.153 1.07a6.966 6.966 0 00-1.507.871l-1.01-.451a1 1 0 10-.8 1.832l.868.39a7.014 7.014 0 00-.002 1.74l-.865.39a1 1 0 10.8 1.832l1.01-.451c.463.36.976.656 1.526.875l.153 1.067a1 1 0 001.966 0l.153-1.067c.55-.219 1.063-.515 1.526-.875l1.01.451a1 1 0 10.8-1.832l-.865-.39a7.014 7.014 0 00-.002-1.74l.868-.39a1 1 0 10-.8-1.832l-1.01.451a6.966 6.966 0 00-1.507-.871l-.153-1.07zM10 8a2 2 0 100 4 2 2 0 000-4z"
      clipRule="evenodd"
    />
  ),
};

function Sidebar({ open, onClose }) {
  return (
    <>
      <aside
        className={`fixed left-0 top-0 z-40 h-full w-64 transform border-r border-gray-200 bg-white pt-20 transition-transform duration-200 dark:border-slate-800 dark:bg-slate-950 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col justify-between px-4 pb-6">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-200"
                      : "text-gray-700 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-900"
                  }`
                }
                onClick={onClose}
              >
                <svg
                  className="h-5 w-5 text-gray-500 dark:text-slate-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  {iconMap[item.icon]}
                </svg>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 p-4 text-white shadow-soft-xl dark:border-slate-800">
            <p className="text-xs uppercase tracking-wide text-cyan-200">
              Insight Harian
            </p>
            <p className="mt-2 text-lg font-semibold">Margin bersih 18.4%</p>
            <p className="text-xs text-gray-200">
              Produk terlaris: Kopi Susu 1L
            </p>
            <button
              type="button"
              className="mt-3 w-full rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20"
            >
              Lihat detail
            </button>
          </div>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-gray-900/50 lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      )}
    </>
  );
}

Sidebar.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Sidebar;
