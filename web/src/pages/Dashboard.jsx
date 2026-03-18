import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import { listCustomers, listOrders, listProducts } from "../lib/api";

const lowStockThreshold = 10;

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

function Dashboard() {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const todayString = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  }, []);

  const todayRange = useMemo(
    () => buildLocalDateRange(todayString),
    [todayString],
  );

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const formatTime = (value) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    if (!token) return;
    let isMounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");
      try {
        const [ordersResponse, productsResponse, customersResponse] =
          await Promise.all([
            listOrders({
              token,
              skip: 0,
              limit: 100,
              dateFrom: todayRange.from,
              dateTo: todayRange.to,
            }),
            listProducts({ token, skip: 0, limit: 200 }),
            listCustomers({ token, skip: 0, limit: 200 }),
          ]);

        if (!isMounted) return;

        setOrders(ordersResponse?.data?.orders || []);
        setProducts(productsResponse?.data?.products || []);
        setCustomers(customersResponse?.data?.customers || []);
      } catch (err) {
        if (!isMounted) return;
        if (err?.status === 401 || err?.status === 403) {
          logout();
          return;
        }
        setError(err.message || "Gagal memuat ringkasan dashboard.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [token, todayRange.from, todayRange.to, logout]);

  const totalSalesToday = useMemo(
    () =>
      orders.reduce((sum, order) => sum + Number(order.total_paid || 0), 0),
    [orders],
  );

  const totalQtyToday = useMemo(
    () =>
      orders.reduce(
        (sum, order) =>
          sum +
          (order.products || []).reduce(
            (itemSum, item) => itemSum + Number(item.qty || 0),
            0,
          ),
        0,
      ),
    [orders],
  );

  const lowStockItems = useMemo(
    () =>
      [...products]
        .filter((product) => Number(product.stock ?? 0) <= lowStockThreshold)
        .sort((a, b) => Number(a.stock ?? 0) - Number(b.stock ?? 0))
        .slice(0, 5),
    [products],
  );

  const recentTransactions = useMemo(
    () =>
      [...orders]
        .sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime(),
        )
        .slice(0, 6),
    [orders],
  );

  const quickActions = [
    {
      label: "Buka Kasir",
      note: "Mulai transaksi baru",
      onClick: () => navigate("/pos"),
    },
    {
      label: "Tambah Produk",
      note: "Kelola katalog produk",
      onClick: () => navigate("/products"),
    },
    {
      label: "Lihat Pesanan",
      note: "Pantau order hari ini",
      onClick: () => navigate("/orders"),
    },
    {
      label: "Buka Laporan",
      note: "Cek ringkasan penjualan",
      onClick: () => navigate("/reports"),
    },
  ];

  return (
    <>
      <PageHeader
        title="Ringkasan Toko"
        subtitle="Pantau penjualan, stok, dan aktivitas toko dari data backend hari ini."
        actions={
          <>
            <button
              onClick={() => navigate("/reports")}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Lihat Laporan
            </button>
            <button
              onClick={() => navigate("/pos")}
              className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-soft-xl hover:bg-cyan-700"
            >
              Buat Transaksi
            </button>
          </>
        }
      />

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Penjualan Hari Ini"
          value={loading ? "Memuat..." : formatCurrency(totalSalesToday)}
          change={`${orders.length} transaksi`}
          trend="up"
        />
        <StatCard
          label="Item Terjual Hari Ini"
          value={loading ? "Memuat..." : String(totalQtyToday)}
          change={`${recentTransactions.length} transaksi terbaru`}
          trend="up"
        />
        <StatCard
          label="Pelanggan Tersimpan"
          value={loading ? "Memuat..." : String(customers.length)}
          change="data pelanggan"
          trend="up"
        />
        <StatCard
          label="Produk Menipis"
          value={loading ? "Memuat..." : String(lowStockItems.length)}
          change={`stok <= ${lowStockThreshold}`}
          trend={lowStockItems.length > 0 ? "down" : "up"}
        />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Transaksi Terbaru
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Diambil dari order backend untuk tanggal {todayString}.
              </p>
            </div>
            <button
              onClick={() => navigate("/orders")}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Lihat semua
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            {loading ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">
                Memuat transaksi terbaru...
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">
                Belum ada transaksi untuk hari ini.
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  <tr>
                    <th className="py-3">ID</th>
                    <th>Pelanggan</th>
                    <th>Waktu</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {recentTransactions.map((trx) => (
                    <tr
                      key={trx.id}
                      className="text-gray-700 dark:text-slate-200"
                    >
                      <td className="py-3 font-semibold text-gray-900 dark:text-white">
                        #{trx.id}
                      </td>
                      <td>{trx.customer_name || "-"}</td>
                      <td>{formatTime(trx.created_at)}</td>
                      <td className="text-right font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(trx.total_paid)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quick Actions
            </h2>
            <div className="mt-4 space-y-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:border-cyan-200 hover:bg-cyan-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <p>{action.label}</p>
                  <p className="text-xs font-normal text-gray-500 dark:text-slate-400">
                    {action.note}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Stok Menipis
            </h2>
            <div className="mt-4 space-y-3">
              {loading ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">
                  Memuat data stok...
                </div>
              ) : lowStockItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">
                  Tidak ada produk dengan stok rendah.
                </div>
              ) : (
                lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2 dark:border-slate-800"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {item.category?.name || "Umum"} • Sisa {item.stock ?? 0} unit
                      </p>
                    </div>
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
                      {(item.stock ?? 0) === 0 ? "Habis" : "Menipis"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Dashboard;
