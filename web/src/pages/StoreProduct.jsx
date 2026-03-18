import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchStoreSettings, getStoreProductBySlug } from "../lib/api";
import { addToCart, getCartCount } from "../lib/storeCart";
import logoCommerce from "../assets/logo-gezy-commerce-transparent.png";
import StoreHeaderActions from "../components/StoreHeaderActions";
import StoreMobileNav from "../components/StoreMobileNav";

const placeholderImage =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='900' height='700' viewBox='0 0 900 700'><rect width='900' height='700' fill='%23e2e8f0'/><rect x='40' y='40' width='820' height='620' rx='36' fill='%23cbd5e1'/><circle cx='180' cy='160' r='100' fill='%2394a3b8'/><circle cx='730' cy='500' r='130' fill='%23bfdbfe'/></svg>";

function StoreProduct() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [activeImage, setActiveImage] = useState(0);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  useEffect(() => {
    setCartCount(getCartCount());
    const sync = () => setCartCount(getCartCount());
    window.addEventListener("store-cart-updated", sync);
    return () => window.removeEventListener("store-cart-updated", sync);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      try {
        const response = await fetchStoreSettings();
        if (!isMounted) return;
        setSettings(response?.data || null);
      } catch {
        if (!isMounted) return;
        setSettings(null);
      }
    };
    loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getStoreProductBySlug(slug);
        if (!isMounted) return;
        setProduct(response?.data || null);
        setActiveImage(0);
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || "Gagal memuat produk.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const images = useMemo(() => {
    const hero = product?.image || placeholderImage;
    const gallery = product?.gallery_images || [];
    return [hero, ...gallery.filter(Boolean)];
  }, [product]);

  const storeName = settings?.store_name?.trim() || "GEZY Commerce";
  const storeContact =
    settings?.store_contact?.trim() || "Kontak toko belum tersedia.";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#dbeafe,_transparent_25%),radial-gradient(circle_at_top_left,_#fef3c7,_transparent_18%),linear-gradient(180deg,_#fffdf8_0%,_#f8fafc_48%,_#eff6ff_100%)] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <img
              src={logoCommerce}
              alt="GEZY Commerce"
              className="h-10 w-auto object-contain sm:h-11"
            />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700 sm:text-sm sm:tracking-[0.24em]">
                Detail Produk
              </p>
              <p className="text-sm text-slate-500">{storeName}</p>
            </div>
          </div>
          <StoreHeaderActions
            cartCount={cartCount}
            showHome
            homeLabel="Katalog"
          />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 pb-28 lg:px-8 lg:pb-8">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/80 px-4 py-10 text-center text-sm text-slate-500">
            Memuat detail produk...
          </div>
        ) : product ? (
          <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
            <section className="space-y-5">
              <div className="overflow-hidden rounded-[2.2rem] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
                <div className="aspect-[5/4] overflow-hidden bg-slate-100">
                  <img
                    src={images[activeImage] || placeholderImage}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {images.slice(0, 8).map((image, index) => (
                  <button
                    key={`${product.id}-gallery-${index + 1}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`overflow-hidden rounded-[1.2rem] border transition ${
                      index === activeImage
                        ? "border-slate-950 shadow-lg"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="h-16 w-full object-cover sm:h-24"
                    />
                  </button>
                ))}
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,_#fff7ed,_#ffffff_40%,_#eff6ff)] p-5 shadow-soft-xl sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
                  Kenapa Produk Ini Menarik
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    ["Kategori", product.category?.name || "Umum"],
                    ["Slug", `/${product.slug}`],
                    ["Kontak Toko", storeContact],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-4"
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
              </div>
            </section>

            <section className="space-y-5">
              <div className="rounded-[2.2rem] border border-slate-200 bg-white p-5 shadow-[0_30px_80px_rgba(15,23,42,0.08)] sm:p-6 xl:sticky xl:top-24">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                    {product.category?.name || "Umum"}
                  </span>
                  {product.promo_label ? (
                    <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-950">
                      {product.promo_label}
                    </span>
                  ) : null}
                </div>
                <h1 className="mt-4 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
                  {product.name}
                </h1>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {product.description || "Deskripsi produk belum diisi."}
                </p>

                <div className="mt-6 rounded-[1.8rem] bg-slate-950 px-5 py-5 text-white">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Harga jual
                  </p>
                  <p className="mt-2 text-3xl font-semibold sm:text-4xl">
                    {formatCurrency(product.price)}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                    <span className="text-sm text-slate-300">
                      Stok tersedia
                    </span>
                    <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">
                      {product.stock ?? 0} unit
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      addToCart(product, 1);
                      setCartCount(getCartCount());
                    }}
                    className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                  >
                    Tambahkan ke Keranjang
                  </button>
                  <Link
                    to="/store/cart"
                    className="rounded-full border border-slate-200 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700"
                  >
                    Checkout Sekarang
                  </Link>
                </div>

                <div className="mt-6 grid gap-3">
                  {[
                    "Checkout terhubung langsung ke backend.",
                    "Status pesanan bisa dicek publik via receipt code.",
                    "Alamat default storefront: ambil di toko.",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </main>
      <StoreMobileNav />
    </div>
  );
}

export default StoreProduct;
