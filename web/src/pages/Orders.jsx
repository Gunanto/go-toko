import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import {
  createOrder,
  listCustomers,
  listOrders,
  listPayments,
  listProducts,
  payOrder,
} from "../lib/api";

function Orders() {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [notice, setNotice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState(null);
  const [payDialog, setPayDialog] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [hasNext, setHasNext] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);
  const [filters, setFilters] = useState({
    status: "all",
    dateFrom: "",
    dateTo: "",
  });
  const [items, setItems] = useState([{ productId: "", qty: 1 }]);
  const [form, setForm] = useState({
    customerName: "",
    customerId: "",
    paymentId: "",
    totalPaid: "",
  });

  const productMap = useMemo(() => {
    const map = new Map();
    products.forEach((product) => map.set(product.id, product));
    return map;
  }, [products]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const product = productMap.get(Number(item.productId));
      if (!product) return sum;
      return sum + (product.price || 0) * Number(item.qty || 0);
    }, 0);
  }, [items, productMap]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);

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

  const flash = useCallback((type, message) => {
    setNotice({ type, message });
    window.clearTimeout(flash.timeoutId);
    flash.timeoutId = window.setTimeout(() => setNotice(null), 3500);
  }, []);

  const loadOrders = useCallback(
    async (pageIndex = page) => {
      setLoading(true);
      try {
        const statusFilter = filters.status === "all" ? "" : filters.status;
        const response = await listOrders({
          token,
          skip: pageIndex * pageSize,
          limit: pageSize,
          status: statusFilter,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        });
        const list = response?.data?.orders || [];
        const total = response?.data?.meta?.total ?? list.length;
        setOrders(list);
        setTotalOrders(total);
        setHasNext((pageIndex + 1) * pageSize < total);
      } catch (error) {
        if (error?.status === 401 || error?.status === 403) {
          logout();
        }
        flash("error", error.message || "Gagal memuat pesanan.");
      } finally {
        setLoading(false);
      }
    },
    [
      page,
      filters.status,
      filters.dateFrom,
      filters.dateTo,
      pageSize,
      token,
      logout,
      flash,
    ],
  );

  const loadMeta = useCallback(async () => {
    setLoadingMeta(true);
    try {
      const [paymentsResponse, productsResponse, customersResponse] =
        await Promise.all([
          listPayments({ token, skip: 0, limit: 100 }),
          listProducts({ token, skip: 0, limit: 200 }),
          listCustomers({ token, skip: 0, limit: 200 }),
        ]);
      setPayments(paymentsResponse?.data?.payments || []);
      setProducts(productsResponse?.data?.products || []);
      setCustomers(customersResponse?.data?.customers || []);
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        logout();
      }
      flash("error", error.message || "Gagal memuat data pendukung.");
    } finally {
      setLoadingMeta(false);
    }
  }, [token, logout, flash]);

  useEffect(() => {
    if (!token) return;
    loadMeta();
  }, [token, loadMeta]);

  useEffect(() => {
    if (!token) return;
    loadOrders(page);
  }, [
    token,
    page,
    filters.status,
    filters.dateFrom,
    filters.dateTo,
    pageSize,
    loadOrders,
  ]);

  const handleOpenModal = () => {
    setForm({ customerName: "", customerId: "", paymentId: "", totalPaid: "" });
    setItems([{ productId: "", qty: 1 }]);
    setIsModalOpen(true);
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, { productId: "", qty: 1 }]);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.customerName.trim()) {
      flash("error", "Nama pelanggan wajib diisi.");
      return;
    }
    if (!form.paymentId) {
      flash("error", "Pilih metode pembayaran.");
      return;
    }

    const filteredItems = items.filter((item) => item.productId);
    if (filteredItems.length === 0) {
      flash("error", "Tambahkan minimal satu produk.");
      return;
    }

    const payload = {
      payment_id: Number(form.paymentId),
      customer_id: form.customerId ? Number(form.customerId) : undefined,
      customer_name: form.customerName.trim(),
      total_paid: Number(form.totalPaid || subtotal),
      channel: "manual",
      products: filteredItems.map((item) => ({
        product_id: Number(item.productId),
        qty: Number(item.qty || 1),
      })),
    };

    setCreating(true);
    try {
      await createOrder(payload, { token });
      flash("success", "Order berhasil dibuat.");
      setIsModalOpen(false);
      setPage(0);
      await loadOrders(0);
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        logout();
      }
      flash("error", error.message || "Gagal membuat order.");
    } finally {
      setCreating(false);
    }
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 0) return;
    setPage(nextPage);
  };

  const handleOpenPayDialog = (order) => {
    setPayDialog({
      id: order.id,
      totalPrice: Number(order.total_price || 0),
      totalPaid: String(Number(order.total_price || 0)),
    });
  };

  const handlePayOrder = async () => {
    if (!payDialog) return;
    const totalPaid = Number(payDialog.totalPaid || 0);
    if (Number.isNaN(totalPaid)) {
      flash("error", "Nominal bayar tidak valid.");
      return;
    }

    const orderId = payDialog.id;
    setPayingOrderId(orderId);
    try {
      await payOrder(orderId, { total_paid: totalPaid }, { token });
      flash("success", "Order berhasil ditandai lunas.");
      setPayDialog(null);
      await loadOrders(page);
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        logout();
        return;
      }
      flash("error", error.message || "Gagal mengubah status order.");
    } finally {
      setPayingOrderId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Pesanan"
        subtitle="Pantau status order dari POS maupun kanal online."
        actions={
          <button
            onClick={handleOpenModal}
            className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-soft-xl hover:bg-cyan-700"
          >
            Buat Order Manual
          </button>
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

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, status: event.target.value }))
              }
              className="mt-2 w-40 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="all">Semua</option>
              <option value="Selesai">Selesai</option>
              <option value="Menunggu">Menunggu</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  dateFrom: event.target.value,
                }))
              }
              className="mt-2 w-44 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  dateTo: event.target.value,
                }))
              }
              className="mt-2 w-44 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setFilters({ status: "all", dateFrom: "", dateTo: "" })
            }
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Reset
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
          Memuat data pesanan...
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
          Belum ada pesanan.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {orders.map((order) => {
            const status = order.status === "paid" ? "Selesai" : "Menunggu";
            const channel = getChannelLabel(order.channel);
            return (
              <div
                key={order.id}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950"
              >
                <p className="text-xs uppercase text-gray-500 dark:text-slate-400">
                  {channel}
                </p>
                <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                  {order.receipt_id
                    ? `#${order.receipt_id}`
                    : `#ORD-${order.id}`}
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {formatCurrency(order.total_price)}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                  {order.payment_type?.name || "-"}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      status === "Selesai"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {status}
                  </span>
                  <div className="flex gap-2">
                    {order.status === "pending" ? (
                      <button
                        onClick={() => handleOpenPayDialog(order)}
                        disabled={payingOrderId === order.id}
                        className="rounded-lg bg-cyan-600 px-3 py-1 text-xs font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {payingOrderId === order.id ? "Proses..." : "Bayar"}
                      </button>
                    ) : null}
                    <button
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Detail
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-slate-400">
          Halaman {page + 1} • Total {totalOrders}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 0 || loading}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Sebelumnya
          </button>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={!hasNext || loading}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Berikutnya
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-soft-xl dark:bg-slate-950">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Buat Order Manual
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                    Pelanggan
                  </label>
                  <select
                    value={form.customerId}
                    onChange={(event) => {
                      const value = event.target.value;
                      const selected = customers.find(
                        (customer) => String(customer.id) === value,
                      );
                      setForm((prev) => ({
                        ...prev,
                        customerId: value,
                        customerName: selected?.name || prev.customerName,
                      }));
                    }}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="">Pilih pelanggan (opsional)</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  <input
                    value={form.customerName}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        customerName: event.target.value,
                        customerId: "",
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="Tulis nama pelanggan"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                    Metode Pembayaran
                  </label>
                  <select
                    value={form.paymentId}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        paymentId: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    required
                  >
                    <option value="">Pilih pembayaran</option>
                    {payments.map((payment) => (
                      <option key={payment.id} value={payment.id}>
                        {payment.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                  Produk
                </label>
                <div className="mt-2 space-y-2">
                  {items.map((item, index) => (
                    <div
                      key={`${item.productId}-${index}`}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <select
                        value={item.productId}
                        onChange={(event) =>
                          handleItemChange(
                            index,
                            "productId",
                            event.target.value,
                          )
                        }
                        className="min-w-[220px] flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                      >
                        <option value="">Pilih produk</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(event) =>
                          handleItemChange(index, "qty", event.target.value)
                        }
                        className="w-20 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        disabled={items.length === 1}
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white dark:bg-slate-800"
                  >
                    Tambah Produk
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                    Subtotal
                  </label>
                  <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                    {formatCurrency(subtotal)}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                    Total Bayar
                  </label>
                  <input
                    value={form.totalPaid}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        totalPaid: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    placeholder={String(subtotal)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={creating || loadingMeta}
                className="w-full rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-soft-xl hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {creating ? "Menyimpan..." : "Simpan Order"}
              </button>
            </form>
          </div>
        </div>
      )}

      {payDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-soft-xl dark:bg-slate-950">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Bayar Order
              </h3>
              <button
                onClick={() => setPayDialog(null)}
                className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                Total tagihan: {formatCurrency(payDialog.totalPrice)}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                  Total Dibayar
                </label>
                <input
                  type="number"
                  min={payDialog.totalPrice}
                  value={payDialog.totalPaid}
                  onChange={(event) =>
                    setPayDialog((prev) =>
                      prev ? { ...prev, totalPaid: event.target.value } : prev,
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <button
                type="button"
                onClick={handlePayOrder}
                disabled={payingOrderId === payDialog.id}
                className="w-full rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-soft-xl hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {payingOrderId === payDialog.id
                  ? "Memproses..."
                  : "Konfirmasi Pembayaran"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Orders;
