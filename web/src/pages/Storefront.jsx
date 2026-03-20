import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  fetchStoreSettings,
  listStoreCategories,
  listStoreProducts,
} from "../lib/api";
import { addToCart, getCartCount } from "../lib/storeCart";
import logoCommerce from "../assets/logo-gezy-commerce-transparent.png";
import StoreHeaderActions from "../components/StoreHeaderActions";
import StoreMobileNav from "../components/StoreMobileNav";

const placeholderImage =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='900' height='700' viewBox='0 0 900 700'><rect width='900' height='700' fill='%23dbeafe'/><rect x='40' y='40' width='820' height='620' rx='36' fill='%23bfdbfe'/><circle cx='700' cy='180' r='120' fill='%2393c5fd'/><circle cx='190' cy='520' r='140' fill='%237dd3fc'/></svg>";

function Storefront() {
  const pageSize = 24;
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all",
  );
  const [cartCount, setCartCount] = useState(0);
  const [page, setPage] = useState(
    Math.max(Number(searchParams.get("page") || "1") - 1, 0),
  );
  const [hasNext, setHasNext] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState(
    searchParams.get("q") || "",
  );

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
    const nextSearch = searchParams.get("q") || "";
    const nextCategory = searchParams.get("category") || "all";
    const nextPage = Math.max(Number(searchParams.get("page") || "1") - 1, 0);

    setSearch((current) => (current === nextSearch ? current : nextSearch));
    setSelectedCategory((current) =>
      current === nextCategory ? current : nextCategory,
    );
    setPage((current) => (current === nextPage ? current : nextPage));
  }, [searchParams]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (search.trim()) nextParams.set("q", search.trim());
    if (selectedCategory !== "all")
      nextParams.set("category", selectedCategory);
    if (page > 0) nextParams.set("page", String(page + 1));
    setSearchParams(nextParams, { replace: true });
  }, [page, search, selectedCategory, setSearchParams]);

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
    const loadCategories = async () => {
      try {
        const response = await listStoreCategories({ limit: 200 });
        if (!isMounted) return;
        setCategories(response?.data?.categories || []);
      } catch {
        if (!isMounted) return;
        setCategories([]);
      }
    };
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, selectedCategory]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await listStoreProducts({
          skip: page * pageSize,
          limit: pageSize,
          query: debouncedSearch,
          categoryId: selectedCategory === "all" ? "" : selectedCategory,
        });
        if (!isMounted) return;
        const list = response?.data?.products || [];
        const total = response?.data?.meta?.total ?? list.length;
        setProducts(list);
        setTotalProducts(total);
        setHasNext((page + 1) * pageSize < total);
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || "Gagal memuat katalog.");
        setProducts([]);
        setTotalProducts(0);
        setHasNext(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, page, pageSize, selectedCategory]);

  const categoryOptions = useMemo(() => {
    return [
      { id: "all", name: "Lihat Semua" },
      ...categories.map((category) => ({
        id: String(category.id),
        name: category.name,
      })),
    ];
  }, [categories]);

  const heroProducts = useMemo(() => products.slice(0, 3), [products]);
  const spotlightProducts = useMemo(
    () => products.filter((item) => Number(item.stock ?? 0) > 0).slice(0, 8),
    [products],
  );
  const totalPages = Math.max(Math.ceil(totalProducts / pageSize), 1);
  const visiblePages = useMemo(() => {
    if (totalPages <= 1) return [1];

    const pages = new Set([1, totalPages, page + 1]);
    if (page > 0) pages.add(page);
    if (page + 2 <= totalPages) pages.add(page + 2);

    return Array.from(pages).sort((left, right) => left - right);
  }, [page, totalPages]);

  const storeName = settings?.store_name?.trim() || "GEZY Commerce";
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fef3c7,_transparent_22%),radial-gradient(circle_at_top_right,_#bae6fd,_transparent_28%),linear-gradient(180deg,_#fffdf8_0%,_#f8fafc_42%,_#eff6ff_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.12),_transparent_18%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.16),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#0f172a_55%,_#111827_100%)] dark:text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={logoCommerce}
              alt="GEZY Commerce"
              className="h-10 w-auto object-contain sm:h-11"
            />
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700 sm:text-sm sm:tracking-[0.28em]">
                Marketplace Storefront
              </p>
              <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                {storeName}
              </p>
            </div>
          </div>
          <StoreHeaderActions cartCount={cartCount} />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 pb-28 lg:px-8 lg:pb-8">
        <section className="overflow-hidden rounded-[2.4rem] border border-slate-200/70 bg-slate-950 text-white shadow-[0_40px_120px_rgba(15,23,42,0.18)]">
          <div className="grid gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[1.08fr,0.92fr] lg:px-10 lg:py-12">
            <div className="relative">
              <div className="absolute -left-10 top-0 h-32 w-32 rounded-full bg-cyan-400/20 blur-3xl" />
              <div className="absolute bottom-8 right-8 h-32 w-32 rounded-full bg-amber-300/20 blur-3xl" />
              <p className="relative text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200 sm:text-xs sm:tracking-[0.34em]">
                Etalase Resmi {storeName}
              </p>
              <h1 className="relative mt-4 max-w-3xl text-xl font-semibold leading-tight sm:mt-5 sm:text-2xl lg:text-3xl">
                Temukan produk pilihan dan nikmati pengalaman belanja yang
                cepat, praktis, dan nyaman.
              </h1>
              <p className="relative mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:mt-5 sm:leading-7 lg:text-base">
                Selamat datang di etalase resmi kami, tempat produk pilihan siap
                Anda pesan tanpa ribet. Tersedia di Jalan Al-Ikhlash, RT 008 RW
                004 Sumberejo 43A Batanghari, Lampung Timur. Hubungi{" "}
                <span className="font-semibold text-white">
                  +62 85156266044
                </span>
                .
              </p>
              <div className="relative mt-6 rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.18)] sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
                  Belanja Lebih Mudah
                </p>
                <div className="mt-4 grid gap-3">
                  {[
                    "Temukan produk favoritmu lewat pencarian atau kategori pilihan.",
                    "Masukkan ke keranjang dalam beberapa klik dari etalase atau halaman detail.",
                    "Selesaikan pembayaran dengan cepat lalu pantau status pesananmu dengan mudah.",
                  ].map((item, index) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-[1.25rem] border border-white/10 bg-slate-950/40 px-4 py-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-950">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-5 text-slate-200">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative mt-6 grid gap-3 sm:mt-7 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Pilihan Siap Dipesan
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {products.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-cyan-400/10 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">
                    Ragam Kategori
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {categories.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-amber-300/10 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-amber-200">
                    Siap Dibeli
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {
                      products.filter((item) => Number(item.stock ?? 0) > 0)
                        .length
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/8 p-4 backdrop-blur sm:p-5">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4">
                <label className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
                  Temukan Favoritmu
                </label>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari produk, kategori, atau promo favorit..."
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  {categoryOptions.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategory(category.id)}
                      className={`max-w-full rounded-full px-3 py-2 text-left text-xs font-semibold transition ${
                        selectedCategory === category.id
                          ? "bg-amber-300 text-slate-950"
                          : "bg-white/10 text-slate-200 hover:bg-white/15"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {heroProducts.length > 0 ? (
                  heroProducts.map((product, index) => (
                    <Link
                      key={product.id}
                      to={`/store/${product.slug}`}
                      className="group flex items-center gap-3 rounded-[1.4rem] border border-white/10 bg-white/5 p-3 transition hover:-translate-y-1 hover:bg-white/10 sm:gap-4"
                    >
                      <img
                        src={product.image || placeholderImage}
                        alt={product.name}
                        className="h-16 w-16 rounded-2xl object-cover sm:h-20 sm:w-20"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-200">
                          Pilihan Unggulan {index + 1}
                        </p>
                        <p className="mt-1 truncate text-base font-semibold text-white">
                          {product.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-300">
                          {formatCurrency(product.price)}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-[1.4rem] border border-dashed border-white/15 bg-white/5 px-4 py-8 text-center text-sm text-slate-300">
                    Belum ada produk yang sesuai dengan pilihanmu saat ini.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="mt-8">
          <div className="rounded-[2rem] border border-slate-200/70 bg-[linear-gradient(135deg,_#fff7ed,_#ffffff_45%,_#eff6ff)] p-5 shadow-soft-xl sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
              <div className="max-w-2xl text-justify">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
                  Koleksi Pilihan
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-950 sm:text-3xl">
                  Koleksi unggulan yang siap kamu pesan hari ini
                </h2>
              </div>
              <Link
                to="/store/cart"
                className="rounded-full bg-slate-950 px-4 py-2 text-center text-sm font-semibold text-white"
              >
                Lanjut ke Keranjang
              </Link>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {spotlightProducts.slice(0, 4).map((product) => (
                <Link
                  key={product.id}
                  to={`/store/${product.slug}`}
                  className="group overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)] transition hover:-translate-y-1"
                >
                  <div className="aspect-[5/4] overflow-hidden bg-slate-100">
                    <img
                      src={product.image || placeholderImage}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
                        {product.category?.name || "Umum"}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        Tersedia {product.stock ?? 0}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-950">
                      {product.name}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                      {product.description ||
                        `Pilihan menarik dari ${storeName} yang siap kamu pesan hari ini.`}
                    </p>
                    <div className="mt-5 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                          Harga
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-slate-950">
                          {formatCurrency(product.price)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          addToCart(product, 1);
                          setCartCount(getCartCount());
                        }}
                        className="shrink-0 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Tambah
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                Semua Pilihan
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">
                Jelajahi produk terbaik yang siap kamu pesan sekarang
              </h2>
            </div>
            <div className="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">
              Halaman {page + 1} dari {totalPages}
            </div>
          </div>

          {loading ? (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/80 px-4 py-10 text-center text-sm text-slate-500">
              Memuat katalog...
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/80 px-4 py-10 text-center text-sm text-slate-500">
              Belum ada produk yang cocok dengan pencarian atau kategori
              pilihan.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product, index) => (
                <Link
                  key={product.id}
                  to={`/store/${product.slug}`}
                  className="group overflow-hidden rounded-[1.8rem] border border-slate-200/80 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)] transition hover:-translate-y-1.5"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <img
                      src={product.image || placeholderImage}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                      <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-700">
                        #{page * pageSize + index + 1}
                      </span>
                      {product.promo_label ? (
                        <span className="rounded-full bg-amber-300 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-950">
                          {product.promo_label}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
                        {product.category?.name || "Umum"}
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          Number(product.stock ?? 0) > 10
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        Tersedia {product.stock ?? 0}
                      </span>
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-slate-950">
                      {product.name}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                      {product.description ||
                        `Pilihan menarik dari ${storeName} yang siap kamu pesan hari ini.`}
                    </p>
                    <div className="mt-5 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                          Harga
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-slate-950">
                          {formatCurrency(product.price)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          addToCart(product, 1);
                          setCartCount(getCartCount());
                        }}
                        className="shrink-0 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Pesan Sekarang
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Menampilkan {products.length} dari {totalProducts} produk.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(current - 1, 0))}
                disabled={page === 0 || loading}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Sebelumnya
              </button>
              {visiblePages.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber - 1)}
                  disabled={loading}
                  className={`min-w-[2.75rem] rounded-full px-3 py-2 text-sm font-semibold transition ${
                    pageNumber === page + 1
                      ? "bg-slate-950 text-white"
                      : "border border-slate-200 bg-white text-slate-700"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={!hasNext || loading}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Berikutnya
              </button>
            </div>
          </div>
        </section>
      </main>
      <StoreMobileNav />
    </div>
  );
}

export default Storefront;
