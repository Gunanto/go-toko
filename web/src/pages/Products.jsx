import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import {
  bulkCreateProducts,
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getCategory,
  getProduct,
  listCategories,
  listProducts,
  updateCategory,
  updateProduct,
} from "../lib/api";

const initialProducts = [];
const placeholderImage =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect width='300' height='300' fill='%230f172a'/><rect x='24' y='24' width='252' height='252' rx='28' fill='%231e293b'/><text x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle' fill='%2394a3b8' font-family='Space Grotesk, Arial' font-size='20'>Go Toko</text></svg>";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);

const parseCsvLine = (line) => {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current);
  return result;
};

const parseCsv = (text) => {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]).map((header) =>
    header.trim().toLowerCase(),
  );
  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    return headers.reduce((acc, header, index) => {
      acc[header] = (cols[index] ?? "").trim();
      return acc;
    }, {});
  });
};

function Products() {
  const navigate = useNavigate();
  const { token, logout, user } = useAuth();
  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [filters, setFilters] = useState({
    category: "all",
    minStock: "",
    maxStock: "",
  });
  const [sort, setSort] = useState({ field: "name", direction: "asc" });
  const [editingId, setEditingId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryDraft, setCategoryDraft] = useState("");
  const [form, setForm] = useState({
    name: "",
    sku: "",
    slug: "",
    description: "",
    stock: "",
    price: "",
    cost: "",
    category: "",
    image: "",
    gallery: "",
    status: "draft",
    promoLabel: "",
  });
  const fileInputRef = useRef(null);
  const isAdmin = user?.role === "admin";

  const flash = useCallback((type, message) => {
    setNotice({ type, message });
    window.clearTimeout(flash.timeoutId);
    flash.timeoutId = window.setTimeout(() => setNotice(null), 3500);
  }, []);

  const warnAdminOnly = () => {
    flash("error", "Hanya Admin yang dapat mengerjakan.");
  };

  const resetForm = () => {
    setForm({
      name: "",
      sku: "",
      slug: "",
      description: "",
      stock: "",
      price: "",
      cost: "",
      category: "",
      image: "",
      gallery: "",
      status: "draft",
      promoLabel: "",
    });
    setEditingId(null);
  };

  const resetCategoryEditor = () => {
    setEditingCategoryId(null);
    setCategoryDraft("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const categoryNames = useMemo(() => {
    const list = products
      .map((product) => product.category)
      .filter((value) => value && value.trim().length > 0);
    return Array.from(new Set(list));
  }, [products]);

  const categoryNameToId = useMemo(() => {
    const map = new Map();
    categories.forEach((category) => {
      map.set(category.name.toLowerCase(), category.id);
    });
    return map;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products
      .filter((product) => {
        if (!query) return true;
        return (
          product.name.toLowerCase().includes(query) ||
          product.sku.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
        );
      })
      .filter((product) => {
        if (
          filters.category !== "all" &&
          product.category !== filters.category
        ) {
          return false;
        }
        const min = Number(filters.minStock);
        const max = Number(filters.maxStock);
        if (
          !Number.isNaN(min) &&
          filters.minStock !== "" &&
          product.stock < min
        ) {
          return false;
        }
        if (
          !Number.isNaN(max) &&
          filters.maxStock !== "" &&
          product.stock > max
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dir = sort.direction === "asc" ? 1 : -1;
        if (sort.field === "price") {
          return (a.price - b.price) * dir;
        }
        if (sort.field === "cost") {
          return (a.cost - b.cost) * dir;
        }
        if (sort.field === "stock") {
          return (a.stock - b.stock) * dir;
        }
        return a.name.localeCompare(b.name) * dir;
      });
  }, [products, search, filters, sort]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({ category: "all", minStock: "", maxStock: "" });
  };

  const applySort = (field) => {
    setSort((prev) => {
      const nextDirection =
        prev.field === field && prev.direction === "asc" ? "desc" : "asc";
      return { field, direction: nextDirection };
    });
  };

  const normalizeProduct = (product) => {
    if (!product) return null;
    return {
      id: product.id,
      name: product.name,
      sku: product.sku || `SKU-${product.id}`,
      slug: product.slug || "",
      description: product.description || "",
      stock: product.stock ?? 0,
      price: product.price ?? 0,
      cost: product.cost ?? 0,
      category: product.category?.name || "Umum",
      image: product.image || placeholderImage,
      galleryImages: product.gallery_images || product.galleryImages || [],
      status: product.status || "draft",
      promoLabel: product.promo_label || product.promoLabel || "",
    };
  };

  const ensureCategory = async (name) => {
    if (!isAdmin) {
      warnAdminOnly();
      return null;
    }
    const normalized = name.trim() || "Umum";
    const cached = categoryNameToId.get(normalized.toLowerCase());
    if (cached) return cached;
    try {
      const response = await createCategory(normalized, { token });
      const created = response?.data;
      if (created?.id) {
        setCategories((prev) => [...prev, created]);
        return created.id;
      }
    } catch (error) {
      flash("error", error.message || "Gagal membuat kategori.");
    }
    return null;
  };

  const handleEditCategory = (category) => {
    if (!isAdmin) {
      warnAdminOnly();
      return;
    }
    setEditingCategoryId(category.id);
    setCategoryDraft(category.name);
  };

  const handleEditCategoryDetail = async (categoryId) => {
    if (!isAdmin) {
      warnAdminOnly();
      return;
    }
    try {
      const response = await getCategory(categoryId, { token });
      const category = response?.data;
      if (!category) return;
      handleEditCategory(category);
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        logout();
        return;
      }
      flash("error", error.message || "Gagal memuat detail kategori.");
    }
  };

  const handleSaveCategory = async () => {
    if (!isAdmin) {
      warnAdminOnly();
      return;
    }
    if (!editingCategoryId || !categoryDraft.trim()) {
      flash("error", "Nama kategori wajib diisi.");
      return;
    }
    try {
      const response = await updateCategory(
        editingCategoryId,
        { name: categoryDraft.trim() },
        { token },
      );
      const updated = response?.data;
      if (updated?.id) {
        setCategories((prev) =>
          prev.map((category) =>
            category.id === updated.id ? updated : category,
          ),
        );
        setProducts((prev) =>
          prev.map((product) =>
            product.category ===
            categories.find((item) => item.id === updated.id)?.name
              ? { ...product, category: updated.name }
              : product,
          ),
        );
      }
      flash("success", "Kategori diperbarui.");
      resetCategoryEditor();
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        logout();
        return;
      }
      flash("error", error.message || "Gagal memperbarui kategori.");
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!isAdmin) {
      warnAdminOnly();
      return;
    }
    const used = products.some((product) => product.category === category.name);
    if (used) {
      flash("error", "Kategori masih dipakai produk dan belum bisa dihapus.");
      return;
    }
    const confirmed = window.confirm(`Hapus kategori ${category.name}?`);
    if (!confirmed) return;
    try {
      await deleteCategory(category.id, { token });
      setCategories((prev) => prev.filter((item) => item.id !== category.id));
      if (editingCategoryId === category.id) {
        resetCategoryEditor();
      }
      flash("success", "Kategori dihapus.");
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        logout();
        return;
      }
      flash("error", error.message || "Gagal menghapus kategori.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isAdmin) {
      warnAdminOnly();
      return;
    }
    if (!form.name.trim()) {
      flash("error", "Nama produk wajib diisi.");
      return;
    }
    const price = Number(form.price.toString().replace(/[^\d]/g, ""));
    if (!price) {
      flash("error", "Harga produk wajib diisi.");
      return;
    }
    const cost = Number(form.cost.toString().replace(/[^\d]/g, ""));
    const stock = Number(form.stock);
    const category = form.category.trim() || "Umum";
    const image = form.image.trim() || placeholderImage;
    const galleryImages = form.gallery
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      const categoryId = await ensureCategory(category);
      if (!categoryId) {
        flash("error", "Kategori belum tersedia.");
        return;
      }
      if (editingId) {
        const response = await updateProduct(
          editingId,
          {
            category_id: categoryId,
            name: form.name.trim(),
            slug: form.slug.trim(),
            description: form.description.trim(),
            image,
            gallery_images: galleryImages,
            price,
            cost: Number.isNaN(cost) ? 0 : cost,
            stock: Number.isNaN(stock) ? 0 : stock,
            status: form.status,
            promo_label: form.promoLabel.trim(),
          },
          { token },
        );
        const updated = normalizeProduct(response?.data);
        if (updated) {
          setProducts((prev) =>
            prev.map((product) =>
              product.id === updated.id ? updated : product,
            ),
          );
        }
        flash("success", "Produk diperbarui.");
      } else {
        const response = await createProduct(
          {
            category_id: categoryId,
            name: form.name.trim(),
            slug: form.slug.trim(),
            description: form.description.trim(),
            image,
            gallery_images: galleryImages,
            price,
            cost: Number.isNaN(cost) ? 0 : cost,
            stock: Number.isNaN(stock) ? 0 : stock,
            status: form.status,
            promo_label: form.promoLabel.trim(),
          },
          { token },
        );
        const created = normalizeProduct(response?.data);
        if (created) {
          setProducts((prev) => [...prev, created]);
        }
        flash("success", "Produk ditambahkan.");
      }
      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        logout();
      }
      flash("error", error.message || "Gagal menyimpan produk.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (product) => {
    if (!isAdmin) {
      warnAdminOnly();
      return;
    }
    try {
      const response = await getProduct(product.id, { token });
      const detail = normalizeProduct(response?.data);
      if (!detail) return;
      setEditingId(detail.id);
      setForm({
        name: detail.name,
        sku: detail.sku,
        slug: detail.slug || "",
        description: detail.description || "",
        stock: detail.stock.toString(),
        price: detail.price.toString(),
        cost: detail.cost?.toString() || "",
        category: detail.category,
        image: detail.image || "",
        gallery: (detail.galleryImages || []).join("\n"),
        status: detail.status || "draft",
        promoLabel: detail.promoLabel || "",
      });
      setIsModalOpen(true);
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        logout();
        return;
      }
      flash("error", error.message || "Gagal memuat detail produk.");
    }
  };

  const handleDelete = async (product) => {
    if (!isAdmin) {
      warnAdminOnly();
      return;
    }
    const confirmed = window.confirm(`Hapus produk ${product.name}?`);
    if (!confirmed) return;
    try {
      await deleteProduct(product.id, { token });
      setProducts((prev) => prev.filter((item) => item.id !== product.id));
      flash("success", "Produk dihapus.");
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        logout();
      }
      flash("error", error.message || "Gagal menghapus produk.");
    }
  };

  const handleImportClick = () => {
    if (!isAdmin) {
      warnAdminOnly();
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!isAdmin) {
      warnAdminOnly();
      return;
    }
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (!rows.length) {
        flash("error", "CSV kosong atau format tidak terbaca.");
        return;
      }
      const mapped = rows
        .map((row, index) => {
          const name =
            row.name ||
            row.nama ||
            row.product ||
            row.produk ||
            row["nama produk"];
          if (!name) return null;
          const sku =
            row.sku ||
            row.kode ||
            row["kode produk"] ||
            `SKU-${Date.now()}-${index}`;
          const stock = Number(row.stock || row.stok || 0);
          const price = Number(
            (row.price || row.harga || 0).toString().replace(/[^\d]/g, ""),
          );
          const cost = Number(
            (
              row.cost ||
              row.hpp ||
              row["harga pokok"] ||
              row["harga_pokok"] ||
              0
            )
              .toString()
              .replace(/[^\d]/g, ""),
          );
          const category = row.category || row.kategori || "Umum";
          const image =
            row.image ||
            row.gambar ||
            row.photo ||
            row.foto ||
            placeholderImage;
          return {
            name: String(name).trim(),
            sku: String(sku).trim(),
            stock: Number.isNaN(stock) ? 0 : stock,
            price: Number.isNaN(price) ? 0 : price,
            cost: Number.isNaN(cost) ? 0 : cost,
            category: String(category).trim() || "Umum",
            image: String(image).trim() || placeholderImage,
          };
        })
        .filter(Boolean);

      if (!mapped.length) {
        flash("error", "CSV tidak memiliki kolom nama produk.");
        return;
      }
      const payloads = [];
      let failed = 0;
      for (const row of mapped) {
        const categoryId = await ensureCategory(row.category);
        if (!categoryId) {
          failed += 1;
          continue;
        }
        payloads.push({
          category_id: categoryId,
          name: row.name,
          image: row.image || placeholderImage,
          price: row.price,
          cost: row.cost,
          stock: row.stock,
        });
      }

      if (!payloads.length) {
        flash("error", "Tidak ada produk yang bisa diimpor.");
        return;
      }

      let created = [];
      try {
        const response = await bulkCreateProducts(payloads, { token });
        const list = response?.data?.products || [];
        created = list.map((item) => normalizeProduct(item)).filter(Boolean);
        failed += Number(response?.data?.failed || 0);
      } catch {
        for (const payload of payloads) {
          try {
            const response = await createProduct(payload, { token });
            const product = normalizeProduct(response?.data);
            if (product) created.push(product);
          } catch {
            failed += 1;
          }
        }
      }
      if (created.length) {
        setProducts((prev) => [...prev, ...created]);
      }
      if (failed) {
        flash(
          "error",
          `${created.length} produk berhasil diimpor, ${failed} gagal.`,
        );
      } else {
        flash("success", `${created.length} produk diimpor.`);
      }
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        logout();
      }
      flash("error", "Gagal membaca file CSV.");
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [categoriesResponse, productsResponse] = await Promise.all([
          listCategories({ token, skip: 0, limit: 100 }),
          listProducts({ token, skip: 0, limit: 200 }),
        ]);
        if (!isMounted) return;
        const categoryList = categoriesResponse?.data?.categories || [];
        const productList = productsResponse?.data?.products || [];
        setCategories(categoryList);
        setProducts(
          productList.map((item) => normalizeProduct(item)).filter(Boolean),
        );
      } catch (error) {
        if (!isMounted) return;
        if (error?.status === 401 || error?.status === 403) {
          logout();
        }
        flash("error", error.message || "Gagal memuat produk.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [token, logout, flash]);

  return (
    <>
      <PageHeader
        title="Produk"
        subtitle="Kelola katalog, harga, dan stok produk."
        actions={
          <>
            <button
              onClick={handleImportClick}
              disabled={importing || loading}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {importing ? "Mengimpor..." : "Import CSV"}
            </button>
            <button
              onClick={() => {
                if (!isAdmin) {
                  warnAdminOnly();
                  return;
                }
                setIsModalOpen(true);
              }}
              disabled={loading}
              className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-soft-xl hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Tambah Produk
            </button>
          </>
        }
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFileChange}
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

      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Manajemen Kategori
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Kelola kategori produk yang dipakai di katalog.
            </p>
          </div>
          {editingCategoryId ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={categoryDraft}
                onChange={(event) => setCategoryDraft(event.target.value)}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                placeholder="Nama kategori"
              />
              <button
                type="button"
                onClick={handleSaveCategory}
                className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
              >
                Simpan
              </button>
              <button
                type="button"
                onClick={resetCategoryEditor}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Batal
              </button>
            </div>
          ) : null}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">
              Belum ada kategori.
            </div>
          ) : (
            categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                  {category.name}
                </span>
                <button
                  type="button"
                  onClick={() => handleEditCategoryDetail(category.id)}
                  className="text-xs font-semibold text-cyan-700 dark:text-cyan-300"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(category)}
                  className="text-xs font-semibold text-rose-600"
                >
                  Hapus
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-soft-xl dark:bg-slate-950">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingId ? "Edit Produk" : "Tambah Produk"}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                  Nama Produk
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="Kopi Susu 1L"
                  required
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                    Slug
                  </label>
                  <input
                    name="slug"
                    value={form.slug}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="kopi-susu-1l"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                    SKU (Otomatis)
                  </label>
                  <input
                    name="sku"
                    value={form.sku}
                    onChange={handleChange}
                    readOnly
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="Dibuat otomatis"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                    Kategori
                  </label>
                  <input
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="Minuman"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                  Deskripsi
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="Deskripsi singkat untuk halaman admin dan katalog."
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                  Gambar (URL)
                </label>
                <input
                  name="image"
                  value={form.image}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  placeholder={placeholderImage}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                  Gallery Images
                </label>
                <textarea
                  name="gallery"
                  value={form.gallery}
                  onChange={handleChange}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  placeholder={"Satu URL per baris\nhttps://...\nhttps://..."}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                    Stok
                  </label>
                  <input
                    name="stock"
                    value={form.stock}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="0"
                    type="number"
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                    Harga Jual
                  </label>
                  <input
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="78000"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                    Harga Pokok
                  </label>
                  <input
                    name="cost"
                    value={form.cost}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                    Promo Label
                  </label>
                  <input
                    name="promoLabel"
                    value={form.promoLabel}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="Best Seller"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                  Status Publikasi
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="mt-2 w-full rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-soft-xl hover:bg-cyan-700"
              >
                {saving
                  ? "Menyimpan..."
                  : editingId
                    ? "Simpan Perubahan"
                    : "Simpan Produk"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            type="search"
            placeholder="Cari produk, SKU, kategori..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-72 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
          <div className="relative flex gap-2">
            <button
              onClick={() => {
                setShowFilter((prev) => !prev);
                setShowSort(false);
              }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-slate-700 dark:text-slate-200"
            >
              Filter
            </button>
            <button
              onClick={() => {
                setShowSort((prev) => !prev);
                setShowFilter(false);
              }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-slate-700 dark:text-slate-200"
            >
              Sortir
            </button>
            {showFilter && (
              <div className="absolute right-0 top-12 z-10 w-64 rounded-2xl border border-gray-100 bg-white p-4 text-sm shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                      Kategori
                    </label>
                    <select
                      name="category"
                      value={filters.category}
                      onChange={handleFilterChange}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="all">Semua</option>
                      {categoryNames.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                        Stok Min
                      </label>
                      <input
                        name="minStock"
                        value={filters.minStock}
                        onChange={handleFilterChange}
                        type="number"
                        min="0"
                        className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                        Stok Max
                      </label>
                      <input
                        name="maxStock"
                        value={filters.maxStock}
                        onChange={handleFilterChange}
                        type="number"
                        min="0"
                        className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={resetFilters}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setShowFilter(false)}
                      className="rounded-lg bg-cyan-600 px-3 py-1 text-xs font-semibold text-white hover:bg-cyan-700"
                    >
                      Terapkan
                    </button>
                  </div>
                </div>
              </div>
            )}
            {showSort && (
              <div className="absolute right-0 top-12 z-10 w-52 rounded-2xl border border-gray-100 bg-white p-4 text-sm shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
                <div className="space-y-2">
                  {[
                    { label: "Nama", field: "name" },
                    { label: "Harga Jual", field: "price" },
                    { label: "Harga Pokok", field: "cost" },
                    { label: "Stok", field: "stock" },
                  ].map((option) => (
                    <button
                      key={option.field}
                      onClick={() => applySort(option.field)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm ${
                        sort.field === option.field
                          ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-200"
                          : "hover:bg-gray-50 dark:hover:bg-slate-900"
                      }`}
                    >
                      <span>{option.label}</span>
                      {sort.field === option.field && (
                        <span className="text-xs font-semibold">
                          {sort.direction === "asc" ? "ASC" : "DESC"}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
              <tr>
                <th className="py-3">Gambar</th>
                <th className="py-3">Produk</th>
                <th>SKU</th>
                <th>Stok</th>
                <th>Harga Jual</th>
                <th>Harga Pokok</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-6 text-center text-sm text-gray-500 dark:text-slate-400"
                  >
                    Memuat produk...
                  </td>
                </tr>
              )}
              {filteredProducts.map((product) => (
                <tr
                  key={product.sku}
                  className="text-gray-700 dark:text-slate-200"
                >
                  <td className="py-3">
                    <img
                      src={product.image || placeholderImage}
                      alt={product.name}
                      className="h-10 w-10 rounded-lg object-cover"
                      loading="lazy"
                    />
                  </td>
                  <td className="py-3 font-semibold text-gray-900 dark:text-white">
                    {product.name}
                  </td>
                  <td>{product.sku}</td>
                  <td>{product.stock} unit</td>
                  <td>{formatCurrency(product.price)}</td>
                  <td>{formatCurrency(product.cost)}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/products/${product.id}`)}
                        className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Detail
                      </button>
                      <button
                        onClick={() => handleEdit(product)}
                        className="rounded-lg border border-cyan-200 px-3 py-1 text-xs font-semibold text-cyan-700 hover:bg-cyan-50 dark:border-cyan-700 dark:text-cyan-200 dark:hover:bg-cyan-500/10"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-200 dark:hover:bg-rose-500/10"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredProducts.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-6 text-center text-sm text-gray-500 dark:text-slate-400"
                  >
                    Produk tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default Products;
