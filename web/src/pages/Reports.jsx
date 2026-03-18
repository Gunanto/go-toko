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
  const [weeklyOpen, setWeeklyOpen] = useState(false);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weeklyOrders, setWeeklyOrders] = useState([]);
  const [weeklyError, setWeeklyError] = useState("");
  const [weeklyDate, setWeeklyDate] = useState("");
  const [monthlyOpen, setMonthlyOpen] = useState(false);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [monthlyOrders, setMonthlyOrders] = useState([]);
  const [monthlyError, setMonthlyError] = useState("");
  const [monthlyDate, setMonthlyDate] = useState("");

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

  const formatDate = (value) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getWeekRange = (dateValue) => {
    if (!dateValue) return { start: null, end: null };
    const base = new Date(`${dateValue}T00:00:00`);
    const day = base.getDay();
    const diffToMonday = (day + 6) % 7;
    const start = new Date(base);
    start.setDate(base.getDate() - diffToMonday);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const weeklyRangeLabel = useMemo(() => {
    const { start, end } = getWeekRange(weeklyDate || todayString);
    if (!start || !end) return "-";
    return `${formatDate(start)} - ${formatDate(end)}`;
  }, [weeklyDate, todayString]);

  const getMonthRange = (dateValue) => {
    if (!dateValue) return { start: null, end: null };
    const [yearStr, monthStr] = dateValue.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!year || !month) return { start: null, end: null };
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return { start, end };
  };

  const monthlyRangeLabel = useMemo(() => {
    const { start, end } = getMonthRange(monthlyDate || todayString);
    if (!start || !end) return "-";
    return `${formatDate(start)} - ${formatDate(end)}`;
  }, [monthlyDate, todayString]);

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

  const loadWeeklyOrders = async (dateValue = weeklyDate || todayString) => {
    if (!token) return;
    setWeeklyLoading(true);
    setWeeklyError("");
    try {
      const { start, end } = getWeekRange(dateValue);
      if (!start || !end) {
        setWeeklyOrders([]);
        setWeeklyError("Tanggal tidak valid.");
        return;
      }
      const response = await listOrders({
        token,
        skip: 0,
        limit: 400,
        dateFrom: formatOffsetDateTime(start),
        dateTo: formatOffsetDateTime(end),
      });
      const list = response?.data?.orders || [];
      setWeeklyOrders(list);
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        logout();
        return;
      }
      setWeeklyError(error.message || "Gagal memuat cashflow mingguan.");
    } finally {
      setWeeklyLoading(false);
    }
  };

  const loadMonthlyOrders = async (dateValue = monthlyDate || todayString) => {
    if (!token) return;
    setMonthlyLoading(true);
    setMonthlyError("");
    try {
      const { start, end } = getMonthRange(dateValue);
      if (!start || !end) {
        setMonthlyOrders([]);
        setMonthlyError("Tanggal tidak valid.");
        return;
      }
      const response = await listOrders({
        token,
        skip: 0,
        limit: 800,
        dateFrom: formatOffsetDateTime(start),
        dateTo: formatOffsetDateTime(end),
      });
      const list = response?.data?.orders || [];
      setMonthlyOrders(list);
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        logout();
        return;
      }
      setMonthlyError(error.message || "Gagal memuat analisis bulanan.");
    } finally {
      setMonthlyLoading(false);
    }
  };

  const handleOpenDaily = () => {
    if (!dailyDate) {
      setDailyDate(todayString);
    }
    setDailyOpen(true);
    loadDailyOrders(dailyDate || todayString);
  };

  const handleOpenWeekly = () => {
    if (!weeklyDate) {
      setWeeklyDate(todayString);
    }
    setWeeklyOpen(true);
    loadWeeklyOrders(weeklyDate || todayString);
  };

  const handleOpenMonthly = () => {
    if (!monthlyDate) {
      setMonthlyDate(todayString);
    }
    setMonthlyOpen(true);
    loadMonthlyOrders(monthlyDate || todayString);
  };

  const weeklySummary = useMemo(() => {
    const totals = {
      inflow: 0,
      outflow: 0,
      net: 0,
      orders: weeklyOrders.length,
    };

    const { start } = getWeekRange(weeklyDate || todayString);
    const dailyBuckets = {};

    if (start) {
      for (let i = 0; i < 7; i += 1) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        const key = `${day.getFullYear()}-${pad2(day.getMonth() + 1)}-${pad2(
          day.getDate(),
        )}`;
        dailyBuckets[key] = {
          date: new Date(day),
          inflow: 0,
          outflow: 0,
          net: 0,
          orders: 0,
        };
      }
    }

    weeklyOrders.forEach((order) => {
      const inflow =
        Number(order.total_paid || 0) - Number(order.total_return || 0);
      const outflow = (order.products || []).reduce((sum, item) => {
        if (item.total_cost != null) {
          return sum + Number(item.total_cost || 0);
        }
        const fallbackCost =
          Number(item.cost_at_sale || 0) * Number(item.qty || 0);
        return sum + fallbackCost;
      }, 0);
      totals.inflow += inflow;
      totals.outflow += outflow;
      totals.net += inflow - outflow;

      const createdAt = new Date(order.created_at);
      if (Number.isNaN(createdAt.getTime())) return;
      const key = `${createdAt.getFullYear()}-${pad2(
        createdAt.getMonth() + 1,
      )}-${pad2(createdAt.getDate())}`;
      if (!dailyBuckets[key]) return;
      dailyBuckets[key].inflow += inflow;
      dailyBuckets[key].outflow += outflow;
      dailyBuckets[key].net += inflow - outflow;
      dailyBuckets[key].orders += 1;
    });

    const daily = Object.values(dailyBuckets).sort((a, b) => a.date - b.date);

    return { totals, daily };
  }, [weeklyOrders, weeklyDate, todayString]);

  const monthlyTopProducts = useMemo(() => {
    const totals = {
      qty: 0,
      revenue: 0,
      orders: monthlyOrders.length,
    };
    const map = new Map();

    monthlyOrders.forEach((order) => {
      const items = order.products || [];
      const paid =
        Number(order.total_paid || 0) - Number(order.total_return || 0);
      totals.revenue += paid;

      items.forEach((item) => {
        const qty = Number(item.qty || 0);
        const name = item.product?.name || `Produk #${item.product_id || "-"}`;
        const key = `${item.product_id || name}`;
        const current = map.get(key) || {
          productId: item.product_id || null,
          name,
          qty: 0,
          revenue: 0,
          orders: 0,
        };
        const itemRevenue =
          item.total_final_price != null
            ? Number(item.total_final_price || 0)
            : item.total_normal_price != null
              ? Number(item.total_normal_price || 0)
              : Number(item.price || 0) * qty;
        current.qty += qty;
        current.revenue += itemRevenue;
        current.orders += 1;
        map.set(key, current);
        totals.qty += qty;
      });
    });

    const list = Array.from(map.values())
      .sort((a, b) => b.qty - a.qty || b.revenue - a.revenue)
      .slice(0, 10);

    return { totals, list };
  }, [monthlyOrders]);

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
            ) : report.title === "Laporan Cashflow" ? (
              <div className="mt-4 grid gap-2">
                <button
                  onClick={handleOpenWeekly}
                  className="w-full rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-700"
                >
                  Lihat
                </button>
                <button className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                  Unduh
                </button>
              </div>
            ) : report.title === "Analisis Produk Terlaris" ? (
              <div className="mt-4 grid gap-2">
                <button
                  onClick={handleOpenMonthly}
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

      {weeklyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-6xl rounded-3xl bg-white p-6 shadow-soft-xl dark:bg-slate-950">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Laporan Cashflow Mingguan
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Periode: {weeklyRangeLabel}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={weeklyDate || todayString}
                  onChange={(event) => setWeeklyDate(event.target.value)}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
                <button
                  onClick={() => loadWeeklyOrders(weeklyDate || todayString)}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-slate-800"
                >
                  Tampilkan
                </button>
                <button
                  onClick={() => setWeeklyOpen(false)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Tutup
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-200">
                <p className="text-xs font-semibold uppercase tracking-wide">
                  Total Kas Masuk
                </p>
                <p className="mt-1 text-xl font-semibold">
                  {formatCurrency(weeklySummary.totals.inflow)}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-300">
                  {weeklySummary.totals.orders} transaksi
                </p>
              </div>
              <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4 text-rose-700 dark:border-rose-900/30 dark:bg-rose-900/20 dark:text-rose-200">
                <p className="text-xs font-semibold uppercase tracking-wide">
                  Total Kas Keluar
                </p>
                <p className="mt-1 text-xl font-semibold">
                  {formatCurrency(weeklySummary.totals.outflow)}
                </p>
                <p className="text-xs text-rose-600 dark:text-rose-300">
                  Estimasi HPP
                </p>
              </div>
              <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4 text-cyan-700 dark:border-cyan-900/30 dark:bg-cyan-900/20 dark:text-cyan-200">
                <p className="text-xs font-semibold uppercase tracking-wide">
                  Cashflow Bersih
                </p>
                <p className="mt-1 text-xl font-semibold">
                  {formatCurrency(weeklySummary.totals.net)}
                </p>
                <p className="text-xs text-cyan-600 dark:text-cyan-300">
                  Kas masuk - kas keluar
                </p>
              </div>
            </div>

            <div className="mt-4">
              {weeklyLoading ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">
                  Memuat cashflow mingguan...
                </div>
              ) : weeklyError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {weeklyError}
                </div>
              ) : weeklyOrders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">
                  Belum ada transaksi pada minggu ini.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-slate-800">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-slate-900 dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Tanggal</th>
                        <th className="px-4 py-3 text-right">Transaksi</th>
                        <th className="px-4 py-3 text-right">Kas Masuk</th>
                        <th className="px-4 py-3 text-right">Kas Keluar</th>
                        <th className="px-4 py-3 text-right">Bersih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {weeklySummary.daily.map((row) => (
                        <tr key={row.date.toISOString()}>
                          <td className="px-4 py-3 text-gray-700 dark:text-slate-200">
                            {formatDate(row.date)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700 dark:text-slate-200">
                            {row.orders}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700 dark:text-slate-200">
                            {formatCurrency(row.inflow)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700 dark:text-slate-200">
                            {formatCurrency(row.outflow)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(row.net)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {monthlyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-6xl rounded-3xl bg-white p-6 shadow-soft-xl dark:bg-slate-950">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Analisis Produk Terlaris Bulanan
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Periode: {monthlyRangeLabel}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="month"
                  value={(monthlyDate || todayString).slice(0, 7)}
                  onChange={(event) =>
                    setMonthlyDate(`${event.target.value}-01`)
                  }
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
                <button
                  onClick={() => loadMonthlyOrders(monthlyDate || todayString)}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-slate-800"
                >
                  Tampilkan
                </button>
                <button
                  onClick={() => setMonthlyOpen(false)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Tutup
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4 text-cyan-700 dark:border-cyan-900/30 dark:bg-cyan-900/20 dark:text-cyan-200">
                <p className="text-xs font-semibold uppercase tracking-wide">
                  Total Penjualan
                </p>
                <p className="mt-1 text-xl font-semibold">
                  {formatCurrency(monthlyTopProducts.totals.revenue)}
                </p>
                <p className="text-xs text-cyan-600 dark:text-cyan-300">
                  {monthlyTopProducts.totals.orders} transaksi
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-200">
                <p className="text-xs font-semibold uppercase tracking-wide">
                  Total Item Terjual
                </p>
                <p className="mt-1 text-xl font-semibold">
                  {monthlyTopProducts.totals.qty}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-300">
                  Semua produk
                </p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-200">
                <p className="text-xs font-semibold uppercase tracking-wide">
                  Top Produk
                </p>
                <p className="mt-1 text-xl font-semibold">
                  {monthlyTopProducts.list[0]?.name || "-"}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-300">
                  {monthlyTopProducts.list[0]?.qty || 0} terjual
                </p>
              </div>
            </div>

            <div className="mt-4">
              {monthlyLoading ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">
                  Memuat analisis produk terlaris...
                </div>
              ) : monthlyError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {monthlyError}
                </div>
              ) : monthlyOrders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">
                  Belum ada transaksi pada bulan ini.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-slate-800">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-slate-900 dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Produk</th>
                        <th className="px-4 py-3 text-right">Qty Terjual</th>
                        <th className="px-4 py-3 text-right">Order</th>
                        <th className="px-4 py-3 text-right">Omzet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {monthlyTopProducts.list.map((item) => (
                        <tr key={item.productId || item.name}>
                          <td className="px-4 py-3 text-gray-700 dark:text-slate-200">
                            {item.name}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700 dark:text-slate-200">
                            {item.qty}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700 dark:text-slate-200">
                            {item.orders}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(item.revenue)}
                          </td>
                        </tr>
                      ))}
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
