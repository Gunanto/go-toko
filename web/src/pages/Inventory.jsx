import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { listProducts, updateProduct } from "../lib/api";

function Inventory() {
  const { token, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const [stockFinal, setStockFinal] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const formatDateTime = (value) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleString("id-ID");
  };

  const categories = useMemo(() => {
    const names = new Set();
    products.forEach((product) => {
      if (product?.category?.name) names.add(product.category.name);
    });
    return Array.from(names).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery = !query || product.name.toLowerCase().includes(query);
      const matchesCategory =
        categoryFilter === "all" || product.category?.name === categoryFilter;
      const matchesStock =
        stockFilter === "all"
          ? true
          : stockFilter === "low"
            ? (product.stock ?? 0) <= 10
            : (product.stock ?? 0) === 0;
      return matchesQuery && matchesCategory && matchesStock;
    });
  }, [products, search, categoryFilter, stockFilter]);

  const selectedProduct = useMemo(
    () => products.find((product) => String(product.id) === selectedId),
    [products, selectedId],
  );

  const stockStart = selectedProduct?.stock ?? 0;
  const stockEnd = Number(stockFinal);
  const stockDelta = Number.isNaN(stockEnd) ? 0 : stockStart - stockEnd;

  const handleSaveCorrection = async () => {
    if (!selectedProduct) {
      setError("Pilih produk untuk koreksi stok.");
      return;
    }
    if (stockFinal === "") {
      setError("Isi stok akhir.");
      return;
    }
    if (stockEnd < 0) {
      setError("Stok akhir tidak boleh negatif.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await updateProduct(
        selectedProduct.id,
        { stock: stockEnd },
        { token },
      );
      const updatedProduct = updated?.data;
      setProducts((prev) =>
        prev.map((product) =>
          product.id === selectedProduct.id
            ? { ...product, stock: updatedProduct?.stock ?? stockEnd }
            : product,
        ),
      );
      setCorrections((prev) => [
        {
          id: `${selectedProduct.id}-${Date.now()}`,
          name: selectedProduct.name,
          stockStart,
          stockEnd,
          sold: stockDelta,
          note: note.trim() || "-",
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setSelectedId("");
      setStockFinal("");
      setNote("");
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        logout();
        return;
      }
      setError(err.message || "Gagal menyimpan koreksi stok.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await listProducts({ token, skip: 0, limit: 200 });
        const list = response?.data?.products || [];
        if (!isMounted) return;
        setProducts(list);
      } catch (err) {
        if (!isMounted) return;
        if (err?.status === 401 || err?.status === 403) {
          logout();
          return;
        }
        setError(err.message || "Gagal memuat data stok.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [token, logout]);

  return (
    <>
      <PageHeader
        title="Inventori"
        subtitle="Pantau mutasi stok dan jadwal restock."
        actions={
          <button className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-soft-xl hover:bg-cyan-700">
            Stock Opname
          </button>
        }
      />

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Stok Produk
            </h2>
            <div className="flex flex-wrap gap-2">
              <input
                type="search"
                placeholder="Cari produk"
                className="w-48 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <select
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="all">Semua kategori</option>
                {categories.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                value={stockFilter}
                onChange={(event) => setStockFilter(event.target.value)}
              >
                <option value="all">Semua stok</option>
                <option value="low">Stok rendah</option>
                <option value="empty">Stok habis</option>
              </select>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">
                Memuat data stok...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">
                Belum ada data stok.
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 dark:border-slate-800"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {product.category?.name || "Umum"} •{" "}
                      {formatDateTime(product.updated_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        (product.stock ?? 0) <= 10
                          ? "text-rose-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {product.stock ?? 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Stok
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Koreksi Stok
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                Produk
              </label>
              <select
                value={selectedId}
                onChange={(event) => setSelectedId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">Pilih produk</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                    Stok Awal
                  </label>
                  <input
                    type="number"
                    disabled
                    value={selectedProduct ? stockStart : ""}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                    Stok Akhir
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockFinal}
                    onChange={(event) => setStockFinal(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                Terjual: {Number.isNaN(stockEnd) ? "-" : stockDelta}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                  Catatan
                </label>
                <textarea
                  rows="3"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Contoh: koreksi stok opname"
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <button
                onClick={handleSaveCorrection}
                disabled={saving}
                className="w-full rounded-xl bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-300"
              >
                {saving ? "Menyimpan..." : "Simpan Koreksi"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Riwayat Koreksi
            </h2>
            <div className="mt-4 overflow-x-auto">
              {corrections.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">
                  Belum ada koreksi stok.
                </div>
              ) : (
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-slate-900 dark:text-slate-400">
                    <tr>
                      <th className="px-3 py-2">Produk</th>
                      <th className="px-3 py-2 text-right">Stok Awal</th>
                      <th className="px-3 py-2 text-right">Stok Akhir</th>
                      <th className="px-3 py-2 text-right">Terjual</th>
                      <th className="px-3 py-2">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {corrections.map((row) => (
                      <tr key={row.id}>
                        <td className="px-3 py-2 text-gray-700 dark:text-slate-200">
                          <div className="font-semibold">{row.name}</div>
                          <div className="text-[11px] text-gray-500 dark:text-slate-400">
                            {formatDateTime(row.createdAt)}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700 dark:text-slate-200">
                          {row.stockStart}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700 dark:text-slate-200">
                          {row.stockEnd}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-white">
                          {row.sold}
                        </td>
                        <td className="px-3 py-2 text-gray-700 dark:text-slate-200">
                          {row.note}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Inventory;
