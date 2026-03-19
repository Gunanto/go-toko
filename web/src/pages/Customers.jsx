import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PasswordField from "../components/PasswordField";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
} from "../lib/api";

const customerStatusFilterKey = "go_toko_customer_status_filter";
const customerTierFilterKey = "go_toko_customer_tier_filter";

function Customers() {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    () => localStorage.getItem(customerStatusFilterKey) || "all",
  );
  const [tierFilter, setTierFilter] = useState(
    () => localStorage.getItem(customerTierFilterKey) || "all",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [resetCustomer, setResetCustomer] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    tier: "bronze",
    notes: "",
  });
  const [resetForm, setResetForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [page, setPage] = useState(0);
  const [pageSize] = useState(12);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [hasNext, setHasNext] = useState(false);

  const flash = useCallback((type, message) => {
    setNotice({ type, message });
    window.clearTimeout(flash.timeoutId);
    flash.timeoutId = window.setTimeout(() => setNotice(null), 3500);
  }, []);

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const generateTemporaryPassword = () => {
    const suffix = `${Math.floor(1000 + Math.random() * 9000)}`;
    const generated = `Toko-${suffix}`;
    setResetForm({
      password: generated,
      confirmPassword: generated,
    });
    flash("success", "Password sementara berhasil dibuat otomatis.");
  };

  const loadCustomers = useCallback(
    async (pageIndex = page) => {
      setLoading(true);
      try {
        const response = await listCustomers({
          token,
          skip: pageIndex * pageSize,
          limit: pageSize,
        });
        const list = response?.data?.customers || [];
        const total = response?.data?.meta?.total ?? list.length;
        setCustomers(list);
        setTotalCustomers(total);
        setHasNext((pageIndex + 1) * pageSize < total);
      } catch (error) {
        if (error?.status === 401 || error?.status === 403) {
          logout();
        }
        flash("error", error.message || "Gagal memuat pelanggan.");
      } finally {
        setLoading(false);
      }
    },
    [token, page, pageSize, logout, flash],
  );

  useEffect(() => {
    if (!token) return;
    loadCustomers(page);
  }, [token, page, pageSize, loadCustomers]);

  useEffect(() => {
    localStorage.setItem(customerStatusFilterKey, statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    localStorage.setItem(customerTierFilterKey, tierFilter);
  }, [tierFilter]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesQuery =
        customer.name.toLowerCase().includes(query) ||
        (customer.phone || "").toLowerCase().includes(query) ||
        (customer.email || "").toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "password"
            ? customer.auth_provider === "password"
            : customer.auth_provider !== "password";
      const matchesTier =
        tierFilter === "all"
          ? true
          : (customer.tier || "bronze") === tierFilter;
      return (query ? matchesQuery : true) && matchesStatus && matchesTier;
    });
  }, [customers, search, statusFilter, tierFilter]);

  const handleCopyTemporaryPassword = async () => {
    if (!resetForm.password) return;
    try {
      await navigator.clipboard.writeText(resetForm.password);
      flash("success", "Password sementara berhasil disalin.");
    } catch {
      flash("error", "Gagal menyalin password sementara.");
    }
  };

  const handleCopyContact = async (value, label) => {
    if (!value) {
      flash("error", `${label} pelanggan belum tersedia.`);
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      flash("success", `${label} berhasil disalin.`);
    } catch {
      flash("error", `Gagal menyalin ${label.toLowerCase()}.`);
    }
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 0) return;
    setPage(nextPage);
  };

  const resetEditForm = () => {
    setForm({
      name: "",
      phone: "",
      email: "",
      tier: "bronze",
      notes: "",
    });
    setEditingId(null);
  };

  const resetPasswordForm = () => {
    setResetForm({
      password: "",
      confirmPassword: "",
    });
    setResetCustomer(null);
  };

  const handleOpenCreate = () => {
    resetEditForm();
    setIsModalOpen(true);
  };

  const handleEdit = async (customer) => {
    try {
      const response = await getCustomer(customer.id, { token });
      const detail = response?.data;
      if (!detail) return;
      setEditingId(detail.id);
      setForm({
        name: detail.name || "",
        phone: detail.phone || "",
        email: detail.email || "",
        tier: detail.tier || "bronze",
        notes: detail.notes || "",
      });
      setIsModalOpen(true);
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        logout();
        return;
      }
      flash("error", error.message || "Gagal memuat detail pelanggan.");
    }
  };

  const handleOpenResetPassword = (customer) => {
    setResetCustomer(customer);
    setResetForm({
      password: "",
      confirmPassword: "",
    });
    setIsResetModalOpen(true);
  };

  const handleDelete = async (customerId) => {
    const confirmed = window.confirm("Hapus pelanggan ini?");
    if (!confirmed) return;

    try {
      await deleteCustomer(customerId, { token });
      flash("success", "Pelanggan berhasil dihapus.");
      loadCustomers(page);
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        logout();
      }
      flash("error", error.message || "Gagal menghapus pelanggan.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        tier: form.tier,
        notes: form.notes.trim(),
      };

      if (editingId) {
        await updateCustomer(editingId, payload, { token });
        flash("success", "Pelanggan berhasil diperbarui.");
      } else {
        await createCustomer(payload, { token });
        flash("success", "Pelanggan berhasil ditambahkan.");
      }
      setIsModalOpen(false);
      resetEditForm();
      loadCustomers(page);
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        logout();
      }
      flash("error", error.message || "Gagal menyimpan pelanggan.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPasswordSubmit = async (event) => {
    event.preventDefault();
    if (!resetCustomer?.id) return;
    if (resetForm.password.trim() !== resetForm.confirmPassword.trim()) {
      flash("error", "Konfirmasi password sementara tidak cocok.");
      return;
    }
    if (!resetForm.password.trim()) {
      flash("error", "Isi password sementara terlebih dahulu.");
      return;
    }
    if (
      !window.confirm(
        "Simpan password sementara baru untuk pelanggan ini? Password lama akan diganti.",
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      await updateCustomer(
        resetCustomer.id,
        {
          name: resetCustomer.name,
          phone: resetCustomer.phone || "",
          email: resetCustomer.email || "",
          address: resetCustomer.address || "",
          tier: resetCustomer.tier || "bronze",
          notes: resetCustomer.notes || "",
          password: resetForm.password.trim(),
        },
        { token },
      );
      flash(
        "success",
        `Password sementara untuk ${resetCustomer.name} berhasil diperbarui.`,
      );
      setIsResetModalOpen(false);
      resetPasswordForm();
      loadCustomers(page);
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        logout();
      }
      flash("error", error.message || "Gagal mereset password pelanggan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Pelanggan"
        subtitle="Kelola data pelanggan dan segmentasi loyalitas."
        actions={
          <button
            onClick={handleOpenCreate}
            className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-soft-xl hover:bg-cyan-700"
          >
            Tambah Pelanggan
          </button>
        }
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-soft-xl dark:bg-slate-950">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingId ? "Edit Pelanggan" : "Tambah Pelanggan"}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetEditForm();
                }}
                className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                  Nama
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="Nama pelanggan"
                  required
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                    Telepon
                  </label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        phone: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="0812-xxxx-xxxx"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                    Email
                  </label>
                  <input
                    name="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="email@contoh.com"
                    type="email"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                  Tier
                </label>
                <select
                  name="tier"
                  value={form.tier}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, tier: event.target.value }))
                  }
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                  Catatan
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="Catatan pelanggan"
                />
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
                    : "Simpan Pelanggan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {isResetModalOpen && resetCustomer ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-soft-xl dark:bg-slate-950">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Reset Password Pelanggan
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                  Buat password sementara baru untuk {resetCustomer.name}.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/customers/${resetCustomer.id}`)}
                  className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Lihat Detail
                </button>
                <button
                  onClick={() => {
                    setIsResetModalOpen(false);
                    resetPasswordForm();
                  }}
                  className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Tutup
                </button>
              </div>
            </div>
            <form
              className="mt-4 space-y-4"
              onSubmit={handleResetPasswordSubmit}
            >
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                    Password Sementara
                  </label>
                  <button
                    type="button"
                    onClick={generateTemporaryPassword}
                    className="rounded-lg border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-700"
                  >
                    Generate Otomatis
                  </button>
                </div>
                <PasswordField
                  value={resetForm.password}
                  onChange={(event) =>
                    setResetForm((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  placeholder="Masukkan password sementara baru"
                  className="mt-3 bg-gray-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
                <div className="mt-3">
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">
                    Konfirmasi Password Sementara
                  </label>
                  <PasswordField
                    value={resetForm.confirmPassword}
                    onChange={(event) =>
                      setResetForm((prev) => ({
                        ...prev,
                        confirmPassword: event.target.value,
                      }))
                    }
                    placeholder="Ulangi password sementara"
                    className="mt-2 bg-gray-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                {resetForm.password ? (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-600">
                    <div className="flex items-center justify-between gap-3">
                      <p>
                        Simpan password sementara ini dan kirimkan ke pelanggan:
                        <span className="ml-1 font-semibold text-slate-900">
                          {resetForm.password}
                        </span>
                      </p>
                      <button
                        type="button"
                        onClick={handleCopyTemporaryPassword}
                        className="shrink-0 rounded-lg border border-slate-200 px-2 py-1 text-slate-700"
                        aria-label="Salin password sementara"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-4 w-4"
                        >
                          <rect x="9" y="9" width="11" height="11" rx="2" />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : null}
                <p className="mt-3 text-xs text-amber-800">
                  Minta pelanggan segera mengganti password ini setelah berhasil
                  login kembali.
                </p>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Menyimpan..." : "Simpan Password Sementara"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {notice && (
        <div
          className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
            notice.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-slate-200 bg-slate-50 text-slate-700"
          }`}
        >
          {notice.message}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Cari pelanggan..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-72 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="all">Semua Status</option>
            <option value="password">Sudah Bisa Login</option>
            <option value="guest">Guest / Belum Ada Password</option>
          </select>
          <select
            value={tierFilter}
            onChange={(event) => setTierFilter(event.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="all">Semua Tier</option>
            <option value="bronze">Bronze</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </select>
          <button
            type="button"
            onClick={() => setStatusFilter("password")}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700"
          >
            Hanya yang Bisa Login
          </button>
        </div>
        <div className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {filteredCustomers.length} hasil
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
          Memuat data pelanggan...
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
          Belum ada pelanggan.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {filteredCustomers.map((customer) => {
            return (
              <div
                key={customer.id}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {customer.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {customer.phone || "-"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                      {customer.tier || "bronze"}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                        customer.auth_provider === "password"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {customer.auth_provider === "password"
                        ? "Sudah Bisa Login"
                        : "Guest / Belum Ada Password"}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-slate-400">
                  <span>Email</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {customer.email || "-"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyContact(customer.email, "Email")}
                      className="rounded-md border border-gray-200 px-2 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Salin
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-gray-600 dark:text-slate-400">
                  <span>Terdaftar</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatDate(customer.created_at)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-gray-600 dark:text-slate-400">
                  <span>Telepon</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {customer.phone || "-"}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyContact(customer.phone, "Nomor telepon")
                      }
                      className="rounded-md border border-gray-200 px-2 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Salin
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => navigate(`/customers/${customer.id}`)}
                    className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Detail
                  </button>
                  <button
                    onClick={() => handleEdit(customer)}
                    className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleOpenResetPassword(customer)}
                    className="rounded-lg border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                  >
                    Reset Password
                  </button>
                  <button
                    onClick={() => handleDelete(customer.id)}
                    className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-200 dark:hover:bg-rose-900/20"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-slate-400">
          Halaman {page + 1} • Total {totalCustomers}
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
    </>
  );
}

export default Customers;
