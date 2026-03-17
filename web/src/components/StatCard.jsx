import PropTypes from "prop-types";

function StatCard({ label, value, change, trend }) {
  const isUp = trend === "up";
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
        <div
          className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
            isUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          }`}
        >
          <svg
            className="h-3 w-3"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            {isUp ? (
              <path
                fillRule="evenodd"
                d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            ) : (
              <path
                fillRule="evenodd"
                d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            )}
          </svg>
          {change}
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-500 dark:text-slate-400">
        dibanding minggu sebelumnya
      </p>
    </div>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  change: PropTypes.string.isRequired,
  trend: PropTypes.oneOf(["up", "down"]).isRequired,
};

export default StatCard;
