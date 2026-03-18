import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { getOrder, payOrder } from "../lib/api";

function OrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token, logout } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState("");

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

  const flash = (type, message) => {
    setNotice({ type, message });
    window.clearTimeout(flash.timeoutId);
    flash.timeoutId = window.setTimeout(() => setNotice(null), 3500);
  };

  const getChannelLabel = (channel) => {
    switch (channel) {
      case "storefront":
        return "Storefront";
      case "manual":
        return "Manual";
      case "pos":
      default:
        return "POS";
    }
  };

  useEffect(() => {
    if (!token || !id) return;
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getOrder(id, { token });
        if (!isMounted) return;
        const nextOrder = response?.data || null;
        setOrder(nextOrder);
        setPayAmount(String(Number(nextOrder?.total_price || 0)));
      } catch (err) {
        if (!isMounted) return;
        if (err?.status === 401 || err?.status === 403) {
          logout();
          return;
        }
        setError(err.message || "Gagal memuat detail order.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [token, id, logout]);

  const handlePay = async () => {
    if (!order) return;
    const totalPaid = Number(payAmount || 0);
    if (Number.isNaN(totalPaid)) {
      flash("error", "Nominal bayar tidak valid.");
      return;
    }
    setPaying(true);
    try {
      const response = await payOrder(id, { total_paid: totalPaid }, { token });
      const nextOrder = response?.data || order;
      setOrder(nextOrder);
      setPayAmount(
        String(Number(nextOrder?.total_paid || nextOrder?.total_price || 0)),
      );
      flash("success", "Order berhasil ditandai lunas.");
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        logout();
        return;
      }
      flash("error", err.message || "Gagal mengubah status order.");
    } finally {
      setPaying(false);
    }
  };

  const totalQty = useMemo(
    () =>
      (order?.products || []).reduce(
        (sum, item) => sum + Number(item.qty || 0),
        0,
      ),
    [order],
  );

  return (
    <>
      <PageHeader
        title={
          order?.receipt_id ? `Order #${order.receipt_id}` : `Order #${id}`
        }
        subtitle="Detail operasional transaksi untuk kebutuhan admin dan audit."
        actions={
          <div className="flex gap-2">
            {order?.status === "pending" ? (
              <button
                type="button"
                onClick={handlePay}
                disabled={paying}
                className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {paying ? "Memproses..." : "Tandai Lunas"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => navigate("/orders")}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Kembali ke Pesanan
            </button>
          </div>
        }
      />

      {notice && (
        <div
          className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
            notice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {notice.message}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
          Memuat detail order...
        </div>
      ) : order ? (
        <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Ringkasan Transaksi
              </h3>
              <div className="mt-4 grid gap-3">
                {[
                  ["Pelanggan", order.customer_name || "-"],
                  ["Channel", getChannelLabel(order.channel)],
                  ["Telepon", order.customer_phone || "-"],
                  ["Email", order.customer_email || "-"],
                  ["Alamat", order.shipping_address || "-"],
                  ["Kasir", order.user?.name || order.user?.username || "-"],
                  ["Pembayaran", order.payment_type?.name || "-"],
                  ["Status", order.status === "paid" ? "Selesai" : "Menunggu"],
                  ["Waktu", formatDateTime(order.created_at)],
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
            </div>

            {order.status === "pending" ? (
              <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Konfirmasi Pembayaran
                </h3>
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                      Total Dibayar
                    </label>
                    <input
                      type="number"
                      min={order.total_price}
                      value={payAmount}
                      onChange={(event) => setPayAmount(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Minimal pembayaran {formatCurrency(order.total_price)}.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-cyan-100 bg-cyan-50/70 p-5 shadow-soft-xl dark:border-cyan-900/30 dark:bg-cyan-900/10">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
                  Total Belanja
                </p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(order.total_price)}
                </p>
              </div>
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-5 shadow-soft-xl dark:border-emerald-900/30 dark:bg-emerald-900/10">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  Dibayar
                </p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(order.total_paid)}
                </p>
              </div>
              <div className="rounded-3xl border border-amber-100 bg-amber-50/70 p-5 shadow-soft-xl dark:border-amber-900/30 dark:bg-amber-900/10">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                  Qty Item
                </p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  {totalQty}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Item Pesanan
            </h3>
            <div className="mt-4 space-y-3">
              {(order.products || []).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3 dark:border-slate-800"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {item.product?.name || `Produk #${item.product_id}`}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Qty {item.qty} • Harga {formatCurrency(item.price)}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(item.total_final_price)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

export default OrderDetail;
