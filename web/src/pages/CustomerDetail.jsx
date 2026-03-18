import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { getCustomer, listOrders } from "../lib/api";

function CustomerDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token, logout } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const formatDate = (value) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  useEffect(() => {
    if (!token || !id) return;
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [customerResponse, ordersResponse] = await Promise.all([
          getCustomer(id, { token }),
          listOrders({ token, skip: 0, limit: 200 }),
        ]);
        if (!isMounted) return;
        const customerData = customerResponse?.data || null;
        const orderList = ordersResponse?.data?.orders || [];
        setCustomer(customerData);
        setOrders(
          orderList.filter(
            (order) =>
              String(order.customer_id || "") === String(customerData?.id || "") ||
              order.customer_name === customerData?.name,
          ),
        );
      } catch (err) {
        if (!isMounted) return;
        if (err?.status === 401 || err?.status === 403) {
          logout();
          return;
        }
        setError(err.message || "Gagal memuat detail pelanggan.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [token, id, logout]);

  const totalSpent = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.total_paid || 0), 0),
    [orders],
  );

  return (
    <>
      <PageHeader
        title={customer?.name || "Detail Pelanggan"}
        subtitle="Profil pelanggan untuk admin, lengkap dengan ringkasan transaksi."
        actions={
          <button
            type="button"
            onClick={() => navigate("/customers")}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Kembali ke Pelanggan
          </button>
        }
      />

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
          Memuat detail pelanggan...
        </div>
      ) : customer ? (
        <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Profil Pelanggan
              </h3>
              <div className="mt-4 grid gap-3">
                {[
                  ["Nama", customer.name || "-"],
                  ["Telepon", customer.phone || "-"],
                  ["Email", customer.email || "-"],
                  ["Tier", customer.tier || "bronze"],
                  ["Terdaftar", formatDate(customer.created_at)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3 dark:border-slate-800"
                  >
                    <span className="text-sm text-gray-500 dark:text-slate-400">
                      {label}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-dashed border-gray-200 px-4 py-4 text-sm text-gray-600 dark:border-slate-800 dark:text-slate-300">
                {customer.notes || "Belum ada catatan pelanggan."}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-cyan-100 bg-cyan-50/70 p-5 shadow-soft-xl dark:border-cyan-900/30 dark:bg-cyan-900/10">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
                  Total Order
                </p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  {orders.length}
                </p>
              </div>
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-5 shadow-soft-xl dark:border-emerald-900/30 dark:bg-emerald-900/10">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  Total Belanja
                </p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(totalSpent)}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Riwayat Order Terkait
            </h3>
            <div className="mt-4 space-y-3">
              {orders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">
                  Belum ada order yang terkait dengan pelanggan ini.
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3 dark:border-slate-800"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {order.receipt_id
                          ? `#${order.receipt_id}`
                          : `#ORD-${order.id}`}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(order.total_paid)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

export default CustomerDetail;
