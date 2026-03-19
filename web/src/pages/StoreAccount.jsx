import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import logoCommerce from "../assets/logo-gezy-commerce-transparent.png";
import StoreGoogleButton from "../components/StoreGoogleButton";
import { useStoreAuth } from "../context/StoreAuthContext";
import StoreMobileNav from "../components/StoreMobileNav";
import { listStoreOrdersHistory } from "../lib/api";
import { setCartItems } from "../lib/storeCart";

function StoreAccount() {
  const { customer, isAuthenticated, logout } = useStoreAuth();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [notice, setNotice] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState(null);

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

  useEffect(() => {
    const phone = customer?.phone?.trim() || "";
    const email = customer?.email?.trim() || "";

    if (!phone && !email) {
      setOrders([]);
      setOrdersError("");
      return;
    }

    let cancelled = false;

    const loadOrders = async () => {
      setLoadingOrders(true);
      setOrdersError("");
      try {
        const response = await listStoreOrdersHistory({
          phone,
          email,
          limit: 20,
        });
        if (cancelled) return;
        setOrders(response?.data?.orders || []);
      } catch (error) {
        if (cancelled) return;
        setOrders([]);
        setOrdersError(
          error?.message || "Riwayat pesanan belum bisa dimuat sekarang.",
        );
      } finally {
        if (!cancelled) {
          setLoadingOrders(false);
        }
      }
    };

    loadOrders();
    return () => {
      cancelled = true;
    };
  }, [customer?.email, customer?.phone]);

  const orderStats = useMemo(
    () => ({
      totalOrders: orders.length,
      pendingOrders: orders.filter((order) => order.status !== "paid").length,
      paidOrders: orders.filter((order) => order.status === "paid").length,
    }),
    [orders],
  );

  const handleBuyAgain = (order) => {
    const nextItems = (order?.products || [])
      .map((item) => ({
        id: item.product?.id || item.product_id,
        slug: item.product?.slug || "",
        name: item.product?.name || `Produk #${item.product_id}`,
        price: Number(item.price || item.product?.price || 0),
        image: item.product?.image || "",
        qty: Number(item.qty || 1),
      }))
      .filter((item) => item.id);

    if (nextItems.length === 0) {
      setNotice(
        "Produk pada pesanan ini belum bisa dimasukkan lagi ke keranjang.",
      );
      return;
    }

    setCartItems(nextItems);
    setNotice("Pesanan lama berhasil dimasukkan lagi ke keranjang.");
  };

  if (!isAuthenticated) {
    return <Navigate to="/store/login?redirect=/store/account" replace />;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#eff6ff_100%)] px-4 py-10 pb-28 text-slate-900 lg:pb-10">
      <div className="mx-auto max-w-5xl space-y-6">
        {notice ? (
          <div className="rounded-[1.4rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
            {notice}
          </div>
        ) : null}

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <img
                src={customer?.avatar_url || logoCommerce}
                alt="GEZY Commerce"
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                  Akun Pelanggan
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-slate-950">
                  {customer?.name}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Kelola informasi akunmu dan lanjutkan belanja dengan lebih
                  cepat.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                to="/store"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Kembali belanja
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
              >
                Keluar
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-[1.6rem] border border-sky-100 bg-sky-50/80 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
              Ringkasan Akun
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Pastikan data akunmu selalu siap dipakai agar proses pembayaran,
              pelacakan pesanan, dan komunikasi dengan toko berjalan lebih
              lancar.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              ["Email", customer?.email || "-"],
              ["Telepon", customer?.phone || "-"],
              ["Alamat", customer?.address || "-"],
              ["Level Member", customer?.tier || "-"],
              ["Metode Masuk", customer?.auth_provider || "-"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  {label}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/store/cart"
              className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white"
            >
              Lanjut ke Pembayaran
            </Link>
            <Link
              to="/store/orders/status"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Lacak Pesanan
            </Link>
            <StoreGoogleButton
              redirect="/store/account"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
            />
          </div>
        </div>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                Pesanan Saya
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Riwayat checkout dan belanja ulang
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Semua checkout pelanggan tersimpan sebagai order. Dari sini kamu
                bisa melihat isi order lama, mengecek statusnya, lalu memasukkan
                item yang sama kembali ke keranjang.
              </p>
            </div>
            <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-3">
              <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4 text-center">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  Total
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {orderStats.totalOrders}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-4 text-center">
                <p className="text-xs uppercase tracking-[0.22em] text-amber-600">
                  Pending
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {orderStats.pendingOrders}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-center">
                <p className="text-xs uppercase tracking-[0.22em] text-emerald-600">
                  Paid
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {orderStats.paidOrders}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {loadingOrders ? (
              <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                Memuat riwayat pesanan...
              </div>
            ) : null}

            {ordersError ? (
              <div className="rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                {ordersError}
              </div>
            ) : null}

            {!loadingOrders && !ordersError && orders.length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Belum ada riwayat checkout untuk akun ini.
              </div>
            ) : null}

            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-950">
                        {order.receipt_id || `#ORD-${order.id}`}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          order.status === "paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {order.status === "paid"
                          ? "Pembayaran selesai"
                          : "Menunggu pembayaran"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {formatDateTime(order.created_at)}
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {[
                        ["Total", formatCurrency(order.total_price)],
                        ["Pembayaran", order.payment_type?.name || "-"],
                        [
                          "Jumlah item",
                          `${(order.products || []).length} item`,
                        ],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-3"
                        >
                          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                            {label}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:max-w-xs lg:justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedOrderId((current) =>
                          current === order.id ? null : order.id,
                        )
                      }
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                    >
                      {expandedOrderId === order.id
                        ? "Sembunyikan Item"
                        : "Lihat Item"}
                    </button>
                    <Link
                      to={`/store/orders/status?receipt=${encodeURIComponent(order.receipt_id || "")}`}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                    >
                      Lihat Status
                    </Link>
                    {order.status !== "paid" ? (
                      <Link
                        to={`/store/orders/status?receipt=${encodeURIComponent(order.receipt_id || "")}`}
                        className="rounded-xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950"
                      >
                        Lanjutkan Pembayaran
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleBuyAgain(order)}
                      className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                    >
                      Beli Lagi
                    </button>
                  </div>
                </div>

                {expandedOrderId === order.id ? (
                  <div className="mt-4 rounded-[1.4rem] border border-slate-200 bg-white p-4">
                    {(order.products || []).length > 0 ? (
                      <div className="space-y-3">
                        {(order.products || []).map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col gap-2 rounded-[1.2rem] border border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="font-semibold text-slate-900">
                                {item.product?.name ||
                                  `Produk #${item.product_id}`}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Qty {item.qty} • Harga{" "}
                                {formatCurrency(item.price)}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-slate-950">
                              {formatCurrency(item.total_final_price)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        Detail item untuk pesanan ini belum tersedia.
                      </p>
                    )}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </div>
      <StoreMobileNav />
    </div>
  );
}

export default StoreAccount;
