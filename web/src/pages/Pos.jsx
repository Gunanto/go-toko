import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import {
  createOrder,
  listCustomers,
  listPayments,
  listProducts,
} from "../lib/api";

const placeholderImage =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect width='300' height='300' fill='%230f172a'/><rect x='24' y='24' width='252' height='252' rx='28' fill='%231e293b'/><text x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle' fill='%2394a3b8' font-family='Space Grotesk, Arial' font-size='20'>Go Toko</text></svg>";

const storageKeys = {
  shift: "go_toko_pos_shift",
  draft: "go_toko_pos_draft",
};

function Pos() {
  const { user, token, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [notice, setNotice] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [cashPaid, setCashPaid] = useState("");
  const [shift, setShift] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKeys.shift);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [draft, setDraft] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKeys.draft);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (shift) {
      localStorage.setItem(storageKeys.shift, JSON.stringify(shift));
    } else {
      localStorage.removeItem(storageKeys.shift);
    }
  }, [shift]);

  useEffect(() => {
    if (draft) {
      localStorage.setItem(storageKeys.draft, JSON.stringify(draft));
    } else {
      localStorage.removeItem(storageKeys.draft);
    }
  }, [draft]);

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cartItems],
  );
  const discount = 0;
  const total = subtotal - discount;
  const paidAmount = Number(cashPaid) || 0;
  const changeAmount = Math.max(0, paidAmount - total);
  const checkoutIssue = !shift
    ? "Buka shift terlebih dulu."
    : cartItems.length === 0
      ? "Keranjang masih kosong."
      : !paymentId
        ? "Pilih metode pembayaran."
        : total > 0 && paidAmount < total
          ? "Nilai bayar kurang."
          : "";

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query),
    );
  }, [products, search]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);

  const flash = useCallback((type, message) => {
    setNotice({ type, message });
    window.clearTimeout(flash.timeoutId);
    flash.timeoutId = window.setTimeout(() => setNotice(null), 3500);
  }, []);

  const handleAddToCart = (product) => {
    if (product.stock <= 0) {
      flash("error", "Stok habis.");
      return;
    }
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.qty + 1 > product.stock) {
          flash("error", "Stok tidak mencukupi.");
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
        );
      }
      return [
        ...prev,
        { id: product.id, name: product.name, price: product.price, qty: 1 },
      ];
    });
  };

  const handleUpdateQty = (id, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;
          if (delta > 0) {
            const product = products.find((p) => p.id === id);
            if (product && item.qty + delta > product.stock) {
              flash("error", "Stok tidak mencukupi.");
              return item;
            }
          }
          return { ...item, qty: Math.max(0, item.qty + delta) };
        })
        .filter((item) => item.qty > 0),
    );
  };

  const handleShiftToggle = () => {
    if (shift) {
      setShift(null);
      flash("info", "Shift ditutup.");
      return;
    }
    const openedBy = user?.name || user?.username || "Kasir";
    setShift({ openedAt: new Date().toISOString(), openedBy });
    flash("success", `Shift dibuka oleh ${openedBy}.`);
  };

  const handleSaveDraft = () => {
    if (cartItems.length === 0) {
      flash("error", "Keranjang masih kosong.");
      return;
    }
    setDraft({
      items: cartItems,
      customerId,
      customerName,
      paymentId,
      savedAt: new Date().toISOString(),
    });
    flash("success", "Draft tersimpan.");
  };

  const handleRestoreDraft = () => {
    if (!draft?.items?.length) return;
    setCartItems(draft.items);
    setCustomerId(draft.customerId || "");
    setCustomerName(draft.customerName || "");
    setPaymentId(draft.paymentId || "");
    setDraft(null);
    flash("success", "Draft dipulihkan ke keranjang.");
  };

  const handleDiscardDraft = () => {
    setDraft(null);
    flash("info", "Draft dihapus.");
  };

  const loadProducts = useCallback(
    async (shouldUpdate = () => true) => {
      setLoadingProducts(true);
      try {
        const response = await listProducts({ token, skip: 0, limit: 200 });
        const list = response?.data?.products || [];
        if (shouldUpdate()) {
          setProducts(list.map(normalizeProduct));
        }
      } catch (error) {
        if (error?.status === 401 || error?.status === 403) {
          logout();
        }
        flash("error", error.message || "Gagal memuat produk.");
      } finally {
        if (shouldUpdate()) {
          setLoadingProducts(false);
        }
      }
    },
    [token, logout, flash],
  );

  const handleCheckout = async () => {
    if (!shift) {
      flash("error", "Buka shift terlebih dulu.");
      return;
    }
    if (cartItems.length === 0) {
      flash("error", "Keranjang masih kosong.");
      return;
    }
    if (!paymentId) {
      flash("error", "Pilih metode pembayaran.");
      return;
    }
    if (total > 0 && paidAmount < total) {
      flash("error", "Nilai bayar kurang.");
      return;
    }
    const payload = {
      payment_id: Number(paymentId),
      customer_id: customerId ? Number(customerId) : undefined,
      customer_name: customerName.trim() || "Pelanggan Umum",
      total_paid: Math.round(paidAmount || 0),
      channel: "pos",
      products: cartItems.map((item) => ({
        product_id: item.id,
        qty: item.qty,
      })),
    };
    try {
      const response = await createOrder(payload, { token });
      const updatedProducts = response?.data?.products || [];
      if (updatedProducts.length > 0) {
        const stockById = new Map(
          updatedProducts
            .filter((item) => item?.product?.id != null)
            .map((item) => [item.product.id, item.product.stock]),
        );
        const deltaById = new Map(cartItems.map((item) => [item.id, item.qty]));
        setProducts((prev) =>
          prev.map((product) => {
            if (!stockById.has(product.id)) return product;
            const delta = deltaById.get(product.id) || 0;
            const responseStock = Number(
              stockById.get(product.id) ?? product.stock,
            );
            return {
              ...product,
              stock: Math.min(
                product.stock - delta,
                Number.isNaN(responseStock) ? product.stock : responseStock,
              ),
            };
          }),
        );
      } else {
        setProducts((prev) => {
          const deltaById = new Map(
            cartItems.map((item) => [item.id, item.qty]),
          );
          return prev.map((product) => {
            const delta = deltaById.get(product.id) || 0;
            if (delta === 0) return product;
            return {
              ...product,
              stock: Math.max(0, product.stock - delta),
            };
          });
        });
        await loadProducts();
      }
      setCartItems([]);
      setDraft(null);
      setCashPaid("");
      flash("success", "Transaksi berhasil. Terima kasih.");
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        logout();
      }
      flash("error", error.message || "Gagal menyimpan transaksi.");
    }
  };

  const normalizeProduct = (product) => ({
    id: product.id,
    name: product.name,
    price: product.price ?? 0,
    stock: product.stock ?? 0,
    category: product.category?.name || "Umum",
    image: product.image || placeholderImage,
  });

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    const run = async () => {
      if (!isMounted) return;
      await loadProducts(() => isMounted);
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [token, loadProducts]);

  useEffect(() => {
    if (cartItems.length === 0) {
      setCashPaid("");
    }
  }, [cartItems.length]);

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    const loadCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const response = await listCustomers({ token, skip: 0, limit: 200 });
        const list = response?.data?.customers || [];
        if (!isMounted) return;
        setCustomers(list);
      } catch (error) {
        if (!isMounted) return;
        if (error?.status === 401 || error?.status === 403) {
          logout();
        }
      } finally {
        if (isMounted) setLoadingCustomers(false);
      }
    };
    loadCustomers();
    return () => {
      isMounted = false;
    };
  }, [token, logout]);

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    const loadPayments = async () => {
      setLoadingPayments(true);
      try {
        const response = await listPayments({ token, skip: 0, limit: 100 });
        const list = response?.data?.payments || [];
        if (!isMounted) return;
        setPayments(list);
        if (!paymentId && list.length > 0) {
          setPaymentId(String(list[0].id));
        }
      } catch (error) {
        if (!isMounted) return;
        if (error?.status === 401 || error?.status === 403) {
          logout();
        }
        flash("error", error.message || "Gagal memuat pembayaran.");
      } finally {
        if (isMounted) setLoadingPayments(false);
      }
    };
    loadPayments();
    return () => {
      isMounted = false;
    };
  }, [token, logout, paymentId, flash]);

  return (
    <>
      <PageHeader
        title="Kasir (POS)"
        subtitle="Pilih produk, atur diskon, dan selesaikan transaksi."
        actions={
          <button
            onClick={handleShiftToggle}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-soft-xl ${
              shift
                ? "bg-slate-700 hover:bg-slate-800"
                : "bg-cyan-600 hover:bg-cyan-700"
            }`}
          >
            {shift ? "Tutup Shift" : "Buka Shift"}
          </button>
        }
      />

      {notice && (
        <div
          className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
            notice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : notice.type === "error"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-slate-200 bg-slate-50 text-slate-700"
          }`}
        >
          {notice.message}
        </div>
      )}

      {shift && (
        <div className="mb-4 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-700 dark:border-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-200">
          Shift aktif • {shift.openedBy} •{" "}
          {new Date(shift.openedAt).toLocaleString("id-ID")}
        </div>
      )}

      {draft?.items?.length ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          <span>
            Draft tersimpan pada{" "}
            {new Date(draft.savedAt).toLocaleString("id-ID")}.
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleRestoreDraft}
              className="rounded-lg bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700"
            >
              Pulihkan
            </button>
            <button
              onClick={handleDiscardDraft}
              className="rounded-lg border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
            >
              Hapus
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Daftar Produk
            </h2>
            <input
              type="search"
              placeholder="Cari produk atau barcode"
              className="w-64 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="mt-4">
            {loadingProducts ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">
                Memuat produk dari database...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">
                Produk tidak ditemukan.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock <= 0}
                    className={`group rounded-2xl border border-gray-100 p-4 text-left dark:border-slate-800 ${
                      product.stock <= 0
                        ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-slate-900/60"
                        : "bg-gray-50 hover:border-cyan-200 hover:bg-cyan-50 dark:bg-slate-900 dark:hover:border-cyan-700 dark:hover:bg-cyan-500/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {product.name}
                      </p>
                      <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                        Stok {product.stock}
                      </span>
                    </div>
                    <p className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(product.price)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Kategori {product.category}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Keranjang
          </h2>
          <div className="mt-4">
            <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
              Pelanggan
            </label>
            <select
              value={customerId}
              onChange={(event) => {
                const value = event.target.value;
                const selected = customers.find(
                  (customer) => String(customer.id) === value,
                );
                setCustomerId(value);
                if (selected?.name) {
                  setCustomerName(selected.name);
                }
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
              value={customerName}
              onChange={(event) => {
                setCustomerName(event.target.value);
                setCustomerId("");
              }}
              placeholder="Tulis nama pelanggan"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
            {loadingCustomers && (
              <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                Memuat pelanggan...
              </p>
            )}
          </div>
          <div className="mt-4">
            <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
              Metode Pembayaran
            </label>
            <select
              value={paymentId}
              onChange={(event) => setPaymentId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="">Pilih pembayaran</option>
              {payments.map((payment) => (
                <option key={payment.id} value={payment.id}>
                  {payment.name}
                </option>
              ))}
            </select>
            {loadingPayments && (
              <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                Memuat metode pembayaran...
              </p>
            )}
          </div>
          <div className="mt-4 space-y-3">
            {cartItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-3 py-4 text-center text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">
                Keranjang masih kosong.
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2 dark:border-slate-800"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {item.name}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                      <span>Qty</span>
                      <button
                        onClick={() => handleUpdateQty(item.id, -1)}
                        className="rounded-md border border-gray-200 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        -
                      </button>
                      <span className="min-w-[18px] text-center text-sm font-semibold text-gray-700 dark:text-slate-100">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(item.id, 1)}
                        className="rounded-md border border-gray-200 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(item.price * item.qty)}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="mt-6 space-y-2 text-sm text-gray-600 dark:text-slate-400">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Diskon</span>
              <span>{discount ? `-${formatCurrency(discount)}` : "Rp 0"}</span>
            </div>
            <div className="flex items-center justify-between font-semibold text-gray-900 dark:text-white">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
          <div className="mt-5 space-y-3 rounded-xl border border-dashed border-gray-200 px-3 py-3 dark:border-slate-800">
            <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
              Bayar (Tunai)
            </label>
            <input
              type="number"
              min="0"
              placeholder="Masukkan nilai bayar"
              value={cashPaid}
              onChange={(event) => setCashPaid(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-slate-400">
                Kembalian
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(changeAmount)}
              </span>
            </div>
            {total > 0 && paidAmount > 0 && paidAmount < total && (
              <p className="text-xs text-rose-600 dark:text-rose-400">
                Nilai bayar kurang {formatCurrency(total - paidAmount)}.
              </p>
            )}
          </div>
          <div className="mt-6 grid gap-2">
            {checkoutIssue && (
              <p className="text-xs text-rose-600 dark:text-rose-400">
                {checkoutIssue}
              </p>
            )}
            <button
              onClick={handleCheckout}
              disabled={Boolean(checkoutIssue)}
              className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-soft-xl hover:bg-cyan-700"
            >
              Bayar Sekarang
            </button>
            <button
              onClick={handleSaveDraft}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Simpan Draft
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}

export default Pos;
