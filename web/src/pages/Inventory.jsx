import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { listProducts } from "../lib/api";

function Inventory() {
  const { token, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatDateTime = (value) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleString("id-ID");
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Stok Produk
          </h2>
          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">
                Memuat data stok...
              </div>
            ) : error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">
                Belum ada data stok.
              </div>
            ) : (
              products.map((product) => (
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

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Jadwal Restock
          </h2>
          <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-slate-400">
            <div className="rounded-xl border border-gray-100 px-3 py-3 dark:border-slate-800">
              <p className="font-semibold text-gray-900 dark:text-white">
                Supplier Utama
              </p>
              <p>Estimasi 18 Mar • PO-0034</p>
            </div>
            <div className="rounded-xl border border-gray-100 px-3 py-3 dark:border-slate-800">
              <p className="font-semibold text-gray-900 dark:text-white">
                Gudang Pusat
              </p>
              <p>Estimasi 21 Mar • PO-0035</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Inventory;
