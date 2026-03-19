import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createStoreOrder,
  findStoreCustomer,
  fetchStoreSettings,
  listStoreOrdersHistory,
  listStorePayments,
} from "../lib/api";
import logoCommerce from "../assets/logo-gezy-commerce-transparent.png";
import StoreGoogleButton from "../components/StoreGoogleButton";
import StoreHeaderActions from "../components/StoreHeaderActions";
import {
  clearCart,
  getCartItems,
  removeFromCart,
  setCartItems,
  updateCartQty,
} from "../lib/storeCart";
import StoreMobileNav from "../components/StoreMobileNav";
import { useStoreAuth } from "../context/StoreAuthContext";

const placeholderImage =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect width='300' height='300' fill='%23e2e8f0'/><rect x='24' y='24' width='252' height='252' rx='28' fill='%23cbd5e1'/></svg>";

function StoreCart() {
  const navigate = useNavigate();
  const { customer, isAuthenticated } = useStoreAuth();
  const [items, setItems] = useState([]);
  const [settings, setSettings] = useState(null);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("ambil di toko");
  const [customerNote, setCustomerNote] = useState("");
  const [payments, setPayments] = useState([]);
  const [paymentId, setPaymentId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lookingUpCustomer, setLookingUpCustomer] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");
  const [orderHistory, setOrderHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [notice, setNotice] = useState(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  useEffect(() => {
    let isMounted = true;
    const loadStoreData = async () => {
      try {
        const [settingsResponse, paymentsResponse] = await Promise.all([
          fetchStoreSettings(),
          listStorePayments({ skip: 0, limit: 50 }),
        ]);
        if (!isMounted) return;
        setSettings(settingsResponse?.data || null);
        const paymentList = paymentsResponse?.data?.payments || [];
        setPayments(paymentList);
        if (paymentList.length > 0) {
          setPaymentId(String(paymentList[0].id));
        }
      } catch {
        if (!isMounted) return;
        setSettings(null);
        setPayments([]);
      }
    };
    loadStoreData();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const sync = () => setItems(getCartItems());
    sync();
    window.addEventListener("store-cart-updated", sync);
    return () => window.removeEventListener("store-cart-updated", sync);
  }, []);

  useEffect(() => {
    if (!customer) {
      return;
    }
    setCustomerId(String(customer.id || ""));
    setCustomerName((prev) => prev.trim() || customer.name || "");
    setCustomerPhone((prev) => prev.trim() || customer.phone || "");
    setCustomerEmail((prev) => prev.trim() || customer.email || "");
    setShippingAddress((prev) => {
      const normalized = prev.trim().toLowerCase();
      if (!prev.trim() || normalized === "ambil di toko") {
        return customer.address || "ambil di toko";
      }
      return prev;
    });
    setLookupMessage(`Masuk sebagai ${customer.name}`);
  }, [customer]);

  useEffect(() => {
    const phone = customerPhone.trim();
    const email = customerEmail.trim();

    if (isAuthenticated) {
      setLookingUpCustomer(false);
      return undefined;
    }

    if (!phone && !email) {
      setCustomerId("");
      setLookupMessage("");
      setLookingUpCustomer(false);
      return undefined;
    }

    const timerId = window.setTimeout(async () => {
      setLookingUpCustomer(true);
      try {
        const response = await findStoreCustomer({ phone, email });
        const customer = response?.data;
        if (!customer) {
          setCustomerId("");
          setLookupMessage("");
          return;
        }

        setCustomerId(String(customer.id || ""));
        setLookupMessage(`Pelanggan lama ditemukan: ${customer.name}`);
        setCustomerName((prev) => prev.trim() || customer.name || "");
        setShippingAddress((prev) => {
          const normalized = prev.trim().toLowerCase();
          if (!prev.trim() || normalized === "ambil di toko") {
            return customer.address || "ambil di toko";
          }
          return prev;
        });
        setCustomerEmail((prev) => prev.trim() || customer.email || "");
      } catch (error) {
        if (error?.status === 404) {
          setCustomerId("");
          setLookupMessage("");
          return;
        }
        setLookupMessage(
          "Pencarian pelanggan gagal. Lanjutkan pembayaran secara manual.",
        );
      } finally {
        setLookingUpCustomer(false);
      }
    }, 400);

    return () => window.clearTimeout(timerId);
  }, [customerPhone, customerEmail, isAuthenticated]);

  useEffect(() => {
    const phone = customerPhone.trim();
    const email = customerEmail.trim();

    if (!customerId && !phone && !email) {
      setOrderHistory([]);
      setLoadingHistory(false);
      return undefined;
    }

    if (!customerId) {
      setOrderHistory([]);
      return undefined;
    }

    let cancelled = false;
    const run = async () => {
      setLoadingHistory(true);
      try {
        const response = await listStoreOrdersHistory({
          phone,
          email,
          limit: 5,
        });
        if (cancelled) return;
        setOrderHistory(response?.data?.orders || []);
      } catch {
        if (cancelled) return;
        setOrderHistory([]);
      } finally {
        if (!cancelled) {
          setLoadingHistory(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [customerId, customerPhone, customerEmail]);

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
        0,
      ),
    [items],
  );

  const storeName = settings?.store_name?.trim() || "GEZY Commerce";
  const storeContact = settings?.store_contact?.trim() || "";
  const taxName = settings?.tax_name?.trim() || "Pajak";
  const serviceFeeName = settings?.service_fee_name?.trim() || "Biaya Layanan";
  const taxAmount = useMemo(
    () => (total * Number(settings?.tax_rate || 0)) / 100,
    [settings?.tax_rate, total],
  );
  const serviceFeeAmount = useMemo(
    () => (total * Number(settings?.service_fee_rate || 0)) / 100,
    [settings?.service_fee_rate, total],
  );
  const grandTotal = total + taxAmount + serviceFeeAmount;

  const flash = (type, message) => {
    setNotice({ type, message });
    window.clearTimeout(flash.timeoutId);
    flash.timeoutId = window.setTimeout(() => setNotice(null), 3500);
  };

  const orderSummary = useMemo(() => {
    const lines = [
      `Halo ${storeName}, saya ingin memesan:`,
      "",
      ...items.map(
        (item, index) =>
          `${index + 1}. ${item.name} x${item.qty} - ${formatCurrency(
            Number(item.price || 0) * Number(item.qty || 0),
          )}`,
      ),
      "",
      `Subtotal: ${formatCurrency(total)}`,
      `${taxName}: ${formatCurrency(taxAmount)}`,
      `${serviceFeeName}: ${formatCurrency(serviceFeeAmount)}`,
      `Total: ${formatCurrency(grandTotal)}`,
    ];

    if (customerName.trim()) {
      lines.push(`Nama: ${customerName.trim()}`);
    }
    if (customerPhone.trim()) {
      lines.push(`Telepon: ${customerPhone.trim()}`);
    }
    if (customerEmail.trim()) {
      lines.push(`Email: ${customerEmail.trim()}`);
    }
    if (shippingAddress.trim()) {
      lines.push(`Alamat: ${shippingAddress.trim()}`);
    }
    if (customerNote.trim()) {
      lines.push(`Catatan: ${customerNote.trim()}`);
    }

    return lines.join("\n");
  }, [
    customerEmail,
    customerName,
    customerNote,
    customerPhone,
    grandTotal,
    items,
    serviceFeeAmount,
    shippingAddress,
    serviceFeeName,
    storeName,
    taxAmount,
    taxName,
    total,
  ]);

  const whatsappUrl = useMemo(() => {
    const normalizedPhone = storeContact.replace(/[^\d]/g, "");
    if (!normalizedPhone) return "";
    return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(orderSummary)}`;
  }, [orderSummary, storeContact]);

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(orderSummary);
      flash("success", "Ringkasan pesanan berhasil disalin.");
    } catch {
      flash("error", "Gagal menyalin ringkasan pesanan.");
    }
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      flash("error", "Masuk dulu untuk melanjutkan pembayaran.");
      navigate("/store/login?redirect=/store/cart");
      return;
    }
    if (!customerName.trim()) {
      flash("error", "Nama pemesan perlu diisi.");
      return;
    }
    if (!paymentId) {
      flash("error", "Pilih metode pembayaran yang kamu inginkan.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await createStoreOrder({
        payment_id: Number(paymentId),
        customer_id: customerId ? Number(customerId) : undefined,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim(),
        shipping_address: shippingAddress.trim(),
        customer_note: customerNote.trim(),
        products: items.map((item) => ({
          product_id: item.id,
          qty: item.qty,
        })),
      });

      const receiptCode = response?.data?.receipt_code;
      clearCart();
      setItems([]);
      setCustomerId("");
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setShippingAddress("ambil di toko");
      setCustomerNote("");
      setLookupMessage("");
      setOrderHistory([]);
      if (receiptCode) {
        navigate(
          `/store/orders/status?receipt=${encodeURIComponent(receiptCode)}`,
        );
        return;
      }
      flash("success", "Pesanan berhasil dibuat.");
    } catch (error) {
      flash("error", error.message || "Gagal membuat pesanan.");
    } finally {
      setSubmitting(false);
    }
  };

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
      flash("error", "Item pada pesanan lama tidak ditemukan.");
      return;
    }

    setCartItems(nextItems);
    setItems(getCartItems());
    flash("success", "Isi pesanan lama dimasukkan lagi ke keranjang.");
  };

  const toggleHistoryDetail = (orderId) => {
    setExpandedHistoryId((current) => (current === orderId ? null : orderId));
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#ecfeff_35%,_#f8fafc_100%)] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <img
              src={logoCommerce}
              alt="GEZY Commerce"
              className="h-10 w-auto object-contain"
            />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">
                Keranjang Belanja
              </p>
              <p className="text-sm text-slate-500">
                Hampir selesai, lengkapi pesananmu di {storeName}
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
            <StoreHeaderActions
              showHome
              homeLabel="Kembali Belanja"
              showCart={false}
            />
            {items.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  clearCart();
                  setItems([]);
                }}
                className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
              >
                Kosongkan Keranjang
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 pb-28 lg:px-8 lg:pb-8">
        {notice ? (
          <div
            className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
              notice.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {notice.message}
          </div>
        ) : null}

        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 px-4 py-12 text-center text-sm text-slate-500">
            Keranjangmu masih kosong. Yuk, pilih produk favoritmu dulu.
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
            <section className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-soft-xl"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={item.image || placeholderImage}
                      alt={item.name}
                      className="h-20 w-20 rounded-2xl object-cover sm:h-24 sm:w-24"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/store/${item.slug}`}
                        className="text-lg font-semibold text-slate-900"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 sm:mt-0 sm:ml-4 sm:flex-col sm:items-end">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const nextQty = Math.max(item.qty - 1, 1);
                          updateCartQty(item.id, nextQty);
                          setItems(getCartItems());
                        }}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                      >
                        -
                      </button>
                      <span className="w-10 text-center text-sm font-semibold">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          updateCartQty(item.id, item.qty + 1);
                          setItems(getCartItems());
                        }}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(item.price * item.qty)}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          removeFromCart(item.id);
                          setItems(getCartItems());
                        }}
                        className="mt-2 text-xs font-semibold text-rose-600"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-soft-xl sm:p-6">
              <h1 className="text-2xl font-semibold text-slate-950">
                Ringkasan Pesanan
              </h1>

              {!isAuthenticated ? (
                <div className="mt-6 rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-4">
                  <p className="text-sm font-semibold text-amber-800">
                    Masuk ke akun pelanggan untuk melanjutkan pembayaran dengan
                    lebih cepat.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      to="/store/login?redirect=/store/cart"
                      className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Masuk Sekarang
                    </Link>
                    <Link
                      to="/store/register?redirect=/store/cart"
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      Daftar Akun
                    </Link>
                    <StoreGoogleButton
                      redirect="/store/cart"
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                    />
                  </div>
                </div>
              ) : null}

              <div className="mt-6 space-y-3">
                <input
                  type="text"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Nama lengkap pemesan"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                />
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder="Nomor WhatsApp / telepon"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                />
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(event) => setCustomerEmail(event.target.value)}
                  placeholder="Email (opsional)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                />
                {lookingUpCustomer ? (
                  <p className="text-xs text-slate-500">
                    Menyiapkan data pelanggan...
                  </p>
                ) : lookupMessage ? (
                  <p className="text-xs text-emerald-600">{lookupMessage}</p>
                ) : null}
                <textarea
                  rows={3}
                  value={shippingAddress}
                  onChange={(event) => setShippingAddress(event.target.value)}
                  placeholder="Alamat pengiriman"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                />
                <select
                  value={paymentId}
                  onChange={(event) => setPaymentId(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                >
                  <option value="">Pilih metode pembayaran</option>
                  {payments.map((payment) => (
                    <option key={payment.id} value={payment.id}>
                      {payment.name} ({payment.type})
                    </option>
                  ))}
                </select>
                <textarea
                  rows={3}
                  value={customerNote}
                  onChange={(event) => setCustomerNote(event.target.value)}
                  placeholder="Catatan pesanan, alamat, atau permintaan khusus"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                />
              </div>

              {customerId ? (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Riwayat Pesanan Terakhir
                    </h2>
                    {loadingHistory ? (
                      <span className="text-xs text-slate-500">Memuat...</span>
                    ) : null}
                  </div>
                  <div className="mt-3 space-y-2">
                    {orderHistory.length > 0 ? (
                      orderHistory.map((order) => (
                        <div
                          key={order.id}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-900">
                              {order.receipt_id || `#ORD-${order.id}`}
                            </p>
                            <span className="text-xs text-slate-500">
                              {order.status === "paid" ? "Selesai" : "Menunggu"}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {order.created_at
                              ? new Date(order.created_at).toLocaleString(
                                  "id-ID",
                                )
                              : "-"}
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {formatCurrency(order.total_price)}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => toggleHistoryDetail(order.id)}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                            >
                              {expandedHistoryId === order.id
                                ? "Sembunyikan Item"
                                : "Lihat Item"}
                            </button>
                            <Link
                              to={`/store/orders/status?receipt=${encodeURIComponent(order.receipt_id || "")}`}
                              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                            >
                              Lihat Status
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleBuyAgain(order)}
                              className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
                            >
                              Beli Lagi
                            </button>
                          </div>
                          {expandedHistoryId === order.id ? (
                            <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                              {(order.products || []).length > 0 ? (
                                (order.products || []).map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-start justify-between gap-3 text-xs"
                                  >
                                    <div>
                                      <p className="font-semibold text-slate-800">
                                        {item.product?.name ||
                                          `Produk #${item.product_id}`}
                                      </p>
                                      <p className="mt-1 text-slate-500">
                                        Qty {item.qty} •{" "}
                                        {formatCurrency(item.price)}
                                      </p>
                                    </div>
                                    <p className="font-semibold text-slate-900">
                                      {formatCurrency(item.total_final_price)}
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-slate-500">
                                  Detail item untuk pesanan ini belum tersedia.
                                </p>
                              )}
                            </div>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">
                        Belum ada riwayat pesanan sebelumnya untuk akun ini.
                      </p>
                    )}
                  </div>
                </div>
              ) : null}

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-100 px-4 py-3">
                  <span className="text-sm text-slate-500">Total Item</span>
                  <span className="font-semibold text-slate-900">
                    {items.reduce((sum, item) => sum + item.qty, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-100 px-4 py-3">
                  <span className="text-sm text-slate-500">Subtotal</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(total)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-100 px-4 py-3">
                  <span className="text-sm text-slate-500">{taxName}</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(taxAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-100 px-4 py-3">
                  <span className="text-sm text-slate-500">
                    {serviceFeeName}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(serviceFeeAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950 px-4 py-3">
                  <span className="text-sm text-slate-300">
                    Total Pembayaran
                  </span>
                  <span className="font-semibold text-white">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>

              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 block w-full rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white"
                >
                  Kirim Ringkasan via WhatsApp
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="mt-6 w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                >
                  Salin Ringkasan Pesanan
                </button>
              )}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={submitting}
                className="mt-3 w-full rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Memproses Pesanan..." : "Selesaikan Checkout"}
              </button>

              <button
                type="button"
                onClick={handleCopySummary}
                className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Salin Ringkasan
              </button>

              <p className="mt-3 text-xs text-slate-500">
                Ringkasan pesanan bisa langsung dikirim ke toko. Jika WhatsApp
                toko belum tersedia, salin ringkasannya lalu kirim secara
                manual.
              </p>
            </section>
          </div>
        )}
      </main>
      <StoreMobileNav />
    </div>
  );
}

export default StoreCart;
