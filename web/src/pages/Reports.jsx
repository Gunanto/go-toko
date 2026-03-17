import { useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { listOrders } from "../lib/api";

const reports = [
  { title: "Laporan Penjualan Harian", period: "Hari ini", status: "Siap" },
  { title: "Laporan Cashflow", period: "Mingguan", status: "Diproses" },
  { title: "Analisis Produk Terlaris", period: "Bulanan", status: "Siap" },
];

const pad2 = (value) => String(value).padStart(2, "0");

const formatOffsetDateTime = (date) => {
  const yyyy = date.getFullYear();
  const mm = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  const hh = pad2(date.getHours());
  const mi = pad2(date.getMinutes());
  const ss = pad2(date.getSeconds());
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absOffset = Math.abs(offsetMinutes);
  const offsetH = pad2(Math.floor(absOffset / 60));
  const offsetM = pad2(absOffset % 60);
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}${sign}${offsetH}:${offsetM}`;
};

const buildLocalDateRange = (dateValue) => {
  if (!dateValue) return { from: "", to: "" };
  const start = new Date(`${dateValue}T00:00:00`);
  const end = new Date(`${dateValue}T23:59:59`);
  return {
    from: formatOffsetDateTime(start),
    to: formatOffsetDateTime(end),
  };
};

function Reports() {
  const { token, logout } = useAuth();
  const [dailyOpen, setDailyOpen] = useState(false);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyOrders, setDailyOrders] = useState([]);
  const [dailyError, setDailyError] = useState("");
  const [dailyDate, setDailyDate] = useState("");

  const todayString = useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const formatDateTime = (value) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleString("id-ID");
  };

  const loadDailyOrders = async (dateValue = dailyDate || todayString) => {
    if (!token) return;
    setDailyLoading(true);
    setDailyError("");
    try {
      const range = buildLocalDateRange(dateValue);
      const response = await listOrders({
        token,
        skip: 0,
        limit: 200,
        dateFrom: range.from,
        dateTo: range.to,
      });
      const list = response?.data?.orders || [];
      setDailyOrders(list);
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        logout();
        return;
      }
      setDailyError(error.message || "Gagal memuat laporan harian.");
    } finally {
      setDailyLoading(false);
    }
  };

  const handleOpenDaily = () => {
    if (!dailyDate) {
      setDailyDate(todayString);
    }
    setDailyOpen(true);
    loadDailyOrders(dailyDate || todayString);
  };

  return (
    <>
      <PageHeader
        title="Laporan"
        subtitle="Generate laporan keuangan dan performa toko."
        actions={
          <button className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-soft-xl hover:bg-cyan-700">
            Buat Laporan Baru
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {reports.map((report) => (
          <div
            key={report.title}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950"
          >
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {report.title}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Periode: {report.period}
            </p>
            <span
              className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                report.status === "Siap"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              {report.status}
            </span>
            {report.title === "Laporan Penjualan Harian" ? (
              <div className="mt-4 grid gap-2">
                <button
                  onClick={handleOpenDaily}
                  className="w-full rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-700"
                >
                  Lihat
                </button>
                <button className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                  Unduh
                </button>
              </div>
            ) : (
              <button className="mt-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                Unduh
              </button>
            )}
          </div>
        ))}
      </div>

      {dailyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-5xl rounded-3xl bg-white p-6 shadow-soft-xl dark:bg-slate-950">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Ringkasan Pembayaran Harian
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Periode: {dailyDate || todayString}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dailyDate || todayString}
                  onChange={(event) => setDailyDate(event.target.value)}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
                <button
                  onClick={() => loadDailyOrders(dailyDate || todayString)}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-slate-800"
                >
                  Tampilkan
                </button>
                <button
                  onClick={() => setDailyOpen(false)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Tutup
                </button>
              </div>
            </div>

            <div className="mt-4">
              {dailyLoading ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">
                  Memuat ringkasan harian...
                </div>
              ) : dailyError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {dailyError}
                </div>
              ) : dailyOrders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">
                  Belum ada transaksi hari ini.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-slate-800">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-slate-900 dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Tanggal</th>
                        <th className="px-4 py-3">Pelanggan</th>
                        <th className="px-4 py-3">Kasir</th>
                        <th className="px-4 py-3">Item Dibeli</th>
                        <th className="px-4 py-3 text-right">Qty</th>
                        <th className="px-4 py-3 text-right">Dibayar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {dailyOrders.map((order) => {
                        const items = order.products || [];
                        const totalQty = items.reduce(
                          (sum, item) => sum + Number(item.qty || 0),
                          0,
                        );
                        const itemSummary =
                          items.length === 0
                            ? "-"
                            : items
                                .map((item) => {
                                  const name =
                                    item.product?.name ||
                                    `Produk #${item.product_id}`;
                                  return `${name} x${item.qty}`;
                                })
                                .join(", ");
                        return (
                          <tr key={order.id}>
                            <td className="px-4 py-3 text-gray-700 dark:text-slate-200">
                              {formatDateTime(order.created_at)}
                            </td>
                            <td className="px-4 py-3 text-gray-700 dark:text-slate-200">
                              {order.customer_name || "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-700 dark:text-slate-200">
                              {order.user?.name || order.user?.username || "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-700 dark:text-slate-200">
                              {itemSummary}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-700 dark:text-slate-200">
                              {totalQty}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(order.total_paid)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Reports;
