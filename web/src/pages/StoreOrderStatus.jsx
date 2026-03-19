import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getStoreOrderByReceipt } from "../lib/api";
import logoCommerce from "../assets/logo-gezy-commerce-transparent.png";
import StoreHeaderActions from "../components/StoreHeaderActions";
import StoreMobileNav from "../components/StoreMobileNav";

function StoreOrderStatus() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [receiptCode, setReceiptCode] = useState(
    searchParams.get("receipt") || "",
  );
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
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

  const statusMeta = useMemo(() => {
    if (!order?.status) {
      return {
        label: "-",
        tone: "border-slate-200 bg-slate-100 text-slate-600",
        summary: "Masukkan kode pesanan untuk melihat perkembangan pesananmu.",
      };
    }
    if (order.status === "paid") {
      return {
        label: "Selesai",
        tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
        summary:
          "Pembayaran sudah tercatat dan pesananmu sedang diproses oleh toko.",
      };
    }
    return {
      label: "Menunggu Pembayaran",
      tone: "border-amber-200 bg-amber-50 text-amber-700",
      summary: "Pesanan sudah diterima dan menunggu penyelesaian pembayaran.",
    };
  }, [order]);

  const fetchOrder = async (nextReceiptCode) => {
    const normalized = nextReceiptCode.trim();
    if (!normalized) {
      setError("Kode pesanan perlu diisi.");
      setOrder(null);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await getStoreOrderByReceipt(normalized);
      const nextOrder = response?.data || null;
      setOrder(nextOrder);
      setSearchParams({ receipt: normalized });
    } catch (err) {
      setOrder(null);
      setError(
        err.message || "Pesanan belum ditemukan. Periksa lagi kode pesananmu.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fromQuery = searchParams.get("receipt");
    if (!fromQuery) return;
    setReceiptCode(fromQuery);
    fetchOrder(fromQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await fetchOrder(receiptCode);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fef3c7,_transparent_18%),radial-gradient(circle_at_top_right,_#bfdbfe,_transparent_25%),linear-gradient(180deg,_#fffdf8_0%,_#f8fafc_45%,_#eff6ff_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.12),_transparent_18%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.16),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#0f172a_50%,_#111827_100%)] dark:text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <img
              src={logoCommerce}
              alt="GEZY Commerce"
              className="h-10 w-auto object-contain sm:h-11"
            />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700 sm:text-sm sm:tracking-[0.24em]">
                Status Pesanan
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Pantau status pesananmu kapan saja dengan kode pesanan.
              </p>
            </div>
          </div>
          <StoreHeaderActions showHome homeLabel="Kembali ke Toko" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 pb-28 lg:px-8 lg:pb-8">
        <section className="overflow-hidden rounded-[2.2rem] border border-slate-200 bg-slate-950 text-white shadow-[0_30px_90px_rgba(15,23,42,0.16)]">
          <div className="grid gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[1.05fr,0.95fr] lg:px-10 lg:py-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200 sm:text-xs sm:tracking-[0.3em]">
                Lacak Pesanan
              </p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                Masukkan kode pesanan untuk melihat perkembangan pesananmu dari
                toko.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                Setelah pembayaran selesai, simpan kode pesananmu dan gunakan
                halaman ini kapan saja untuk memantau status pesanan dengan
                mudah.
              </p>
              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/10 px-4 py-4 text-sm text-slate-300">
                Status saat ini:{" "}
                <span className="font-semibold text-white">
                  {statusMeta.summary}
                </span>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-4 backdrop-blur sm:p-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
                    Kode Pesanan
                  </label>
                  <input
                    type="text"
                    value={receiptCode}
                    onChange={(event) => setReceiptCode(event.target.value)}
                    placeholder="Contoh: 4979cf6e-d215-4ff8-9d0d-b3e99bcc7750"
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white placeholder:text-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Mencari..." : "Lihat Status Pesanan"}
                </button>
                {error ? (
                  <div className="rounded-2xl border border-rose-300/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                    {error}
                  </div>
                ) : null}
              </form>
            </div>
          </div>
        </section>

        {order ? (
          <section className="mt-8 grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
            <div className="space-y-6">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft-xl">
                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Kode Pesanan
                    </p>
                    <h2 className="mt-2 break-all text-xl font-semibold text-slate-950 sm:text-2xl">
                      {order.receipt_id}
                    </h2>
                  </div>
                  <span
                    className={`rounded-full border px-4 py-2 text-sm font-semibold ${statusMeta.tone}`}
                  >
                    {statusMeta.label}
                  </span>
                </div>
                <div className="mt-5 grid gap-3">
                  {[
                    ["Nama", order.customer_name || "-"],
                    ["Telepon", order.customer_phone || "-"],
                    ["Email", order.customer_email || "-"],
                    ["Alamat", order.shipping_address || "-"],
                    ["Pembayaran", order.payment_type?.name || "-"],
                    ["Waktu Pesan", formatDateTime(order.created_at)],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex flex-col items-start gap-1 rounded-[1.3rem] border border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="text-sm text-slate-500">{label}</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.8rem] border border-sky-100 bg-sky-50/80 p-5 shadow-soft-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                    Total Pesanan
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {formatCurrency(order.total_price)}
                  </p>
                </div>
                <div className="rounded-[1.8rem] border border-emerald-100 bg-emerald-50/80 p-5 shadow-soft-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                    Total Dibayar
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {formatCurrency(order.total_paid)}
                  </p>
                </div>
                <div className="rounded-[1.8rem] border border-amber-100 bg-amber-50/80 p-5 shadow-soft-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                    Kembalian
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {formatCurrency(order.total_return)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft-xl">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-xl font-semibold text-slate-950">
                  Ringkasan Pesanan
                </h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
                  {(order.products || []).length} item
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {(order.products || []).map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 rounded-[1.4rem] border border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {item.product?.name || `Produk #${item.product_id}`}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Qty {item.qty} • Harga {formatCurrency(item.price)}
                      </p>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {formatCurrency(item.total_final_price)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <StoreMobileNav />
    </div>
  );
}

export default StoreOrderStatus;
