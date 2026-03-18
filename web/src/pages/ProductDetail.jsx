import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { getProduct } from "../lib/api";

const placeholderImage =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='900' height='700' viewBox='0 0 900 700'><rect width='900' height='700' fill='%23e2e8f0'/><rect x='40' y='40' width='820' height='620' rx='36' fill='%23cbd5e1'/><text x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle' fill='%23475569' font-family='Arial' font-size='42'>Preview Produk</text></svg>";

function ProductDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token, logout } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  useEffect(() => {
    if (!token || !id) return;
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getProduct(id, { token });
        if (!isMounted) return;
        setProduct(response?.data || null);
      } catch (err) {
        if (!isMounted) return;
        if (err?.status === 401 || err?.status === 403) {
          logout();
          return;
        }
        setError(err.message || "Gagal memuat detail produk.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [token, id, logout]);

  const stockTone = useMemo(() => {
    const stock = Number(product?.stock ?? 0);
    if (stock <= 0) return "bg-rose-100 text-rose-700";
    if (stock <= 10) return "bg-amber-100 text-amber-700";
    return "bg-emerald-100 text-emerald-700";
  }, [product]);

  const stockLabel = useMemo(() => {
    const stock = Number(product?.stock ?? 0);
    if (stock <= 0) return "Stok habis";
    if (stock <= 10) return "Stok terbatas";
    return "Siap dijual";
  }, [product]);

  const grossProfit = useMemo(() => {
    const price = Number(product?.price ?? 0);
    const cost = Number(product?.cost ?? 0);
    return Math.max(price - cost, 0);
  }, [product]);

  const marginPercent = useMemo(() => {
    const price = Number(product?.price ?? 0);
    if (!price) return 0;
    return Math.round((grossProfit / price) * 100);
  }, [grossProfit, product]);

  const showcaseImages = useMemo(() => {
    const hero = product?.image || placeholderImage;
    const gallery = product?.gallery_images || [];
    const merged = [hero, ...gallery.filter(Boolean)];
    return merged.slice(0, 4);
  }, [product]);

  const productStory = useMemo(() => {
    if (!product) return "";
    if (product.description) return product.description;
    const category = product.category?.name || "umum";
    return `${product.name} adalah produk kategori ${category} yang saat ini sudah siap ditampilkan dalam layout admin. Struktur halaman ini sengaja dibuat supaya nanti mudah berkembang menjadi halaman jualan ketika backend sudah memiliki deskripsi produk, galeri, varian, dan komponen pemasaran lainnya.`;
  }, [product]);

  const sellingPoints = useMemo(() => {
    if (!product) return [];
    return [
      `${product.category?.name || "Produk umum"} yang siap masuk katalog`,
      `Margin kotor sekitar ${marginPercent}% per item`,
      `${stockLabel} dengan stok ${product.stock ?? 0} unit`,
      product.status === "published"
        ? "Sudah siap tampil di katalog publik"
        : "Masih tersimpan sebagai draft",
    ];
  }, [product, marginPercent, stockLabel]);

  return (
    <>
      <PageHeader
        title={product?.name || "Detail Produk"}
        subtitle="Halaman detail admin yang disusun agar mudah berkembang menjadi halaman jualan."
        actions={
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Kembali ke Produk
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
          Memuat detail produk...
        </div>
      ) : product ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <section className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
            <div className="bg-gradient-to-br from-cyan-100 via-white to-emerald-100 p-6 dark:from-cyan-900/20 dark:via-slate-950 dark:to-emerald-900/20">
              <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/80 shadow-soft-xl dark:border-slate-800 dark:bg-slate-900/80">
                    <img
                      src={product.image || placeholderImage}
                      alt={product.name}
                      className="h-full min-h-[340px] w-full object-cover"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {showcaseImages.map((image, index) => (
                      <div
                        key={`${product.id}-preview-${index + 1}`}
                        className="overflow-hidden rounded-2xl border border-white/70 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80"
                      >
                        <img
                          src={image}
                          alt={`${product.name} preview ${index + 1}`}
                          className="h-24 w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-cyan-700 shadow-sm dark:bg-slate-900 dark:text-cyan-300">
                        {product.category?.name || "Umum"}
                      </span>
                      {product.promo_label ? (
                        <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                          {product.promo_label}
                        </span>
                      ) : null}
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${stockTone}`}
                      >
                        {stockLabel}
                      </span>
                    </div>
                    <h2 className="mt-4 text-3xl font-semibold text-gray-900 dark:text-white">
                      {product.name}
                    </h2>
                    <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                      SKU {product.sku}
                    </p>
                    <p className="mt-4 text-sm leading-7 text-gray-600 dark:text-slate-300">
                      {productStory}
                    </p>
                  </div>

                  <div className="rounded-[1.75rem] border border-white/80 bg-white/85 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500 dark:text-slate-400">
                          Harga Jual
                        </p>
                        <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(product.price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500 dark:text-slate-400">
                          Status
                        </p>
                        <p className="mt-2 text-xl font-semibold text-emerald-600 dark:text-emerald-300">
                          {product.status || "draft"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          product.slug
                            ? navigate(`/store/${product.slug}`)
                            : navigate("/store")
                        }
                        className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-cyan-600"
                      >
                        Preview Katalog
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate("/products")}
                        className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                      >
                        Kelola Produk
                      </button>
                    </div>
                    <p className="mt-3 text-xs text-gray-500 dark:text-slate-400">
                      Produk `published` akan tampil di katalog publik,
                      sedangkan draft tetap bisa dipreview lewat struktur
                      storefront.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white/80 p-4 shadow-sm dark:bg-slate-900">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                        Harga Pokok
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(product.cost)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/80 p-4 shadow-sm dark:bg-slate-900">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                        Profit Kotor
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(grossProfit)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${stockTone}`}
                    >
                      Stok {product.stock ?? 0}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-slate-400">
                      Siap dipakai untuk katalog admin sekarang, dan bisa
                      berkembang ke storefront nanti.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Informasi Produk
              </h3>
              <div className="mt-4 grid gap-3">
                <div className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3 dark:border-slate-800">
                  <span className="text-sm text-gray-500 dark:text-slate-400">
                    Nama
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {product.name}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3 dark:border-slate-800">
                  <span className="text-sm text-gray-500 dark:text-slate-400">
                    Kategori
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {product.category?.name || "Umum"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3 dark:border-slate-800">
                  <span className="text-sm text-gray-500 dark:text-slate-400">
                    Slug
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {product.slug || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3 dark:border-slate-800">
                  <span className="text-sm text-gray-500 dark:text-slate-400">
                    SKU
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {product.sku}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3 dark:border-slate-800">
                  <span className="text-sm text-gray-500 dark:text-slate-400">
                    Stok
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {product.stock ?? 0} unit
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3 dark:border-slate-800">
                  <span className="text-sm text-gray-500 dark:text-slate-400">
                    Margin
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {marginPercent}%
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Poin Jual Utama
              </h3>
              <div className="mt-4 space-y-3">
                {sellingPoints.map((point) => (
                  <div
                    key={point}
                    className="rounded-2xl border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-600 dark:border-slate-800 dark:text-slate-300"
                  >
                    {point}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Komponen Storefront Berikutnya
              </h3>
              <div className="mt-4 grid gap-3">
                {[
                  "Deskripsi produk panjang",
                  "Galeri multi-gambar",
                  "Varian dan atribut",
                  "Produk terkait dan promo",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3 dark:border-slate-800"
                  >
                    <span className="text-sm text-gray-600 dark:text-slate-300">
                      {item}
                    </span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                      Belum tersedia
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Catatan Komersial
              </h3>
              <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-slate-300">
                Layout ini tetap relevan untuk admin, tetapi sudah punya blok
                media, ringkasan harga, CTA, poin jual, dan placeholder komponen
                katalog. Saat nanti backend produk mendukung deskripsi, varian,
                dan galeri asli, halaman ini bisa diperluas tanpa mengganti
                struktur utamanya.
              </p>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

export default ProductDetail;
