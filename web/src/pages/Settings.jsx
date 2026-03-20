import { useCallback, useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import {
  createPayment,
  deleteUser,
  deletePayment,
  fetchSettings,
  getPayment,
  getUser,
  listPayments,
  listUsers,
  registerUser,
  updateSettings,
  updateUser,
  updatePayment,
} from "../lib/api";

const initialForm = {
  store_name: "",
  store_address: "",
  store_contact: "",
  tax_name: "",
  tax_rate: "0",
  service_fee_name: "",
  service_fee_rate: "0",
  purchase_discount_name: "Diskon Pembelian",
  purchase_discount_rate: "0",
};

const initialUserForm = {
  name: "",
  username: "",
  email: "",
  password: "",
  role: "cashier",
};

const initialPaymentForm = {
  name: "",
  type: "CASH",
  logo: "",
};

function Settings() {
  const { token, logout, user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [userForm, setUserForm] = useState(initialUserForm);
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingUserSnapshot, setEditingUserSnapshot] = useState(null);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [notice, setNotice] = useState(null);

  const isAdmin = user?.role === "admin";
  const isEditingCurrentUser =
    editingUserId != null && editingUserId === user?.id;

  const flash = useCallback((type, message) => {
    setNotice({ type, message });
    window.clearTimeout(flash.timeoutId);
    flash.timeoutId = window.setTimeout(() => setNotice(null), 3500);
  }, []);

  const resetUserForm = () => {
    setUserForm(initialUserForm);
    setEditingUserId(null);
    setEditingUserSnapshot(null);
  };

  const resetPaymentForm = () => {
    setPaymentForm(initialPaymentForm);
    setEditingPaymentId(null);
  };

  const loadUsers = useCallback(async () => {
    if (!token || !isAdmin) return;
    setLoadingUsers(true);
    try {
      const response = await listUsers({ token, skip: 0, limit: 100 });
      setUsers(response?.data?.users || []);
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        logout();
        return;
      }
      flash("error", error.message || "Gagal memuat daftar pengguna.");
    } finally {
      setLoadingUsers(false);
    }
  }, [token, isAdmin, logout, flash]);

  const loadPayments = useCallback(async () => {
    if (!token) return;
    setLoadingPayments(true);
    try {
      const response = await listPayments({ token, skip: 0, limit: 100 });
      setPayments(response?.data?.payments || []);
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        logout();
        return;
      }
      flash("error", error.message || "Gagal memuat metode pembayaran.");
    } finally {
      setLoadingPayments(false);
    }
  }, [token, logout, flash]);

  useEffect(() => {
    if (!token) return;
    let isMounted = true;

    const loadSettings = async () => {
      setLoading(true);
      try {
        const response = await fetchSettings({ token });
        const data = response?.data || {};
        if (!isMounted) return;
        setForm({
          store_name: data.store_name || "",
          store_address: data.store_address || "",
          store_contact: data.store_contact || "",
          tax_name: data.tax_name || "",
          tax_rate: String(data.tax_rate ?? 0),
          service_fee_name: data.service_fee_name || "",
          service_fee_rate: String(data.service_fee_rate ?? 0),
          purchase_discount_name:
            data.purchase_discount_name || "Diskon Pembelian",
          purchase_discount_rate: String(data.purchase_discount_rate ?? 0),
        });
      } catch (error) {
        if (!isMounted) return;
        if (error?.status === 401 || error?.status === 403) {
          logout();
          return;
        }
        flash("error", error.message || "Gagal memuat pengaturan.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [token, logout, flash]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserChange = (event) => {
    const { name, value } = event.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentChange = (event) => {
    const { name, value } = event.target;
    setPaymentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!isAdmin) {
      flash("error", "Hanya admin yang dapat menyimpan pengaturan.");
      return;
    }

    const storeName = form.store_name.trim();
    const storeAddress = form.store_address.trim();
    const storeContact = form.store_contact.trim();
    const taxName = form.tax_name.trim();
    const serviceFeeName = form.service_fee_name.trim();
    const purchaseDiscountName = form.purchase_discount_name.trim();
    const taxRate =
      form.tax_rate.trim() === "" ? 0 : Number.parseFloat(form.tax_rate);
    const serviceFeeRate =
      form.service_fee_rate.trim() === ""
        ? 0
        : Number.parseFloat(form.service_fee_rate);
    const purchaseDiscountRate =
      form.purchase_discount_rate.trim() === ""
        ? 0
        : Number.parseFloat(form.purchase_discount_rate);

    if (
      !storeName ||
      !storeAddress ||
      !storeContact ||
      !taxName ||
      !serviceFeeName ||
      !purchaseDiscountName
    ) {
      flash("error", "Semua field pengaturan wajib diisi.");
      return;
    }

    if (!Number.isFinite(taxRate) || taxRate < 0) {
      flash("error", "Tarif pajak harus berupa angka 0 atau lebih.");
      return;
    }

    if (!Number.isFinite(serviceFeeRate) || serviceFeeRate < 0) {
      flash("error", "Tarif biaya layanan harus berupa angka 0 atau lebih.");
      return;
    }

    if (
      !Number.isFinite(purchaseDiscountRate) ||
      purchaseDiscountRate < 0 ||
      purchaseDiscountRate > 100
    ) {
      flash(
        "error",
        "Diskon pembelian harus berupa angka antara 0 sampai 100.",
      );
      return;
    }

    setSaving(true);
    try {
      const payload = {
        store_name: storeName,
        store_address: storeAddress,
        store_contact: storeContact,
        tax_name: taxName,
        tax_rate: taxRate,
        service_fee_name: serviceFeeName,
        service_fee_rate: serviceFeeRate,
        purchase_discount_name: purchaseDiscountName,
        purchase_discount_rate: purchaseDiscountRate,
      };
      const response = await updateSettings(payload, { token });
      const data = response?.data || payload;
      setForm({
        store_name: data.store_name || "",
        store_address: data.store_address || "",
        store_contact: data.store_contact || "",
        tax_name: String(data.tax_name || ""),
        tax_rate: String(data.tax_rate ?? 0),
        service_fee_name: String(data.service_fee_name || ""),
        service_fee_rate: String(data.service_fee_rate ?? 0),
        purchase_discount_name: String(
          data.purchase_discount_name || "Diskon Pembelian",
        ),
        purchase_discount_rate: String(data.purchase_discount_rate ?? 0),
      });
      flash("success", "Pengaturan berhasil disimpan.");
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        logout();
        return;
      }
      flash("error", error.message || "Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = (selectedUser) => {
    const load = async () => {
      try {
        const response = await getUser(selectedUser.id, { token });
        const detail = response?.data || selectedUser;
        setEditingUserId(detail.id);
        setUserForm({
          name: detail.name || "",
          username: detail.username || "",
          email: detail.email || "",
          password: "",
          role: detail.role || "cashier",
        });
        setEditingUserSnapshot({
          name: detail.name || "",
          username: detail.username || "",
          email: detail.email || "",
          role: detail.role || "cashier",
        });
      } catch (error) {
        if (error?.status === 401 || error?.status === 403) {
          logout();
          return;
        }
        flash("error", error.message || "Gagal memuat detail pengguna.");
      }
    };
    load();
  };

  const handleSubmitUser = async () => {
    if (!isAdmin) {
      flash("error", "Hanya admin yang dapat mengelola pengguna.");
      return;
    }

    if (
      !userForm.name.trim() ||
      !userForm.username.trim() ||
      !userForm.email.trim()
    ) {
      flash("error", "Nama, username, dan email wajib diisi.");
      return;
    }

    if (!editingUserId && userForm.password.trim().length < 8) {
      flash("error", "Password minimal 8 karakter untuk pengguna baru.");
      return;
    }

    setSavingUser(true);
    try {
      if (editingUserId) {
        const nextName = userForm.name.trim();
        const nextUsername = userForm.username.trim();
        const nextEmail = userForm.email.trim();
        const nextRole = isEditingCurrentUser ? user.role : userForm.role;
        const nextPassword = userForm.password.trim();
        const payload = {};

        if (nextName !== editingUserSnapshot?.name) {
          payload.name = nextName;
        }
        if (nextUsername !== editingUserSnapshot?.username) {
          payload.username = nextUsername;
        }
        if (nextEmail !== editingUserSnapshot?.email) {
          payload.email = nextEmail;
        }
        if (nextRole !== editingUserSnapshot?.role) {
          payload.role = nextRole;
        }
        if (nextPassword) {
          payload.password = nextPassword;
        }

        if (!Object.keys(payload).length) {
          flash("error", "Tidak ada perubahan untuk disimpan.");
          return;
        }

        await updateUser(editingUserId, payload, { token });
        flash("success", "Pengguna berhasil diperbarui.");
      } else {
        const created = await registerUser(
          userForm.name.trim(),
          userForm.username.trim(),
          userForm.email.trim(),
          userForm.password.trim(),
          { token },
        );
        const createdUser = created?.data;
        if (userForm.role === "admin" && createdUser?.id) {
          await updateUser(createdUser.id, { role: "admin" }, { token });
        }
        flash("success", "Pengguna baru berhasil dibuat.");
      }

      resetUserForm();
      await loadUsers();
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        logout();
        return;
      }
      flash("error", error.message || "Gagal menyimpan data pengguna.");
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!isAdmin) {
      flash("error", "Hanya admin yang dapat menghapus pengguna.");
      return;
    }
    if (userId === user?.id) {
      flash("error", "Akun yang sedang dipakai tidak dapat dihapus.");
      return;
    }

    setSavingUser(true);
    try {
      await deleteUser(userId, { token });
      flash("success", "Pengguna berhasil dihapus.");
      if (editingUserId === userId) {
        resetUserForm();
      }
      await loadUsers();
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        logout();
        return;
      }
      flash("error", error.message || "Gagal menghapus pengguna.");
    } finally {
      setSavingUser(false);
    }
  };

  const handleEditPayment = (payment) => {
    const load = async () => {
      try {
        const response = await getPayment(payment.id, { token });
        const detail = response?.data || payment;
        setEditingPaymentId(detail.id);
        setPaymentForm({
          name: detail.name || "",
          type: detail.type || "CASH",
          logo: detail.logo || "",
        });
      } catch (error) {
        if (error?.status === 401 || error?.status === 403) {
          logout();
          return;
        }
        flash(
          "error",
          error.message || "Gagal memuat detail metode pembayaran.",
        );
      }
    };
    load();
  };

  const handleSubmitPayment = async () => {
    if (!isAdmin) {
      flash("error", "Hanya admin yang dapat mengelola metode pembayaran.");
      return;
    }
    if (!paymentForm.name.trim()) {
      flash("error", "Nama metode pembayaran wajib diisi.");
      return;
    }

    setSavingPayment(true);
    try {
      const payload = {
        name: paymentForm.name.trim(),
        type: paymentForm.type,
        logo: paymentForm.logo.trim(),
      };

      if (editingPaymentId) {
        await updatePayment(editingPaymentId, payload, { token });
        flash("success", "Metode pembayaran berhasil diperbarui.");
      } else {
        await createPayment(payload, { token });
        flash("success", "Metode pembayaran berhasil ditambahkan.");
      }

      resetPaymentForm();
      await loadPayments();
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        logout();
        return;
      }
      flash("error", error.message || "Gagal menyimpan metode pembayaran.");
    } finally {
      setSavingPayment(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!isAdmin) {
      flash("error", "Hanya admin yang dapat menghapus metode pembayaran.");
      return;
    }

    setSavingPayment(true);
    try {
      await deletePayment(paymentId, { token });
      flash("success", "Metode pembayaran berhasil dihapus.");
      if (editingPaymentId === paymentId) {
        resetPaymentForm();
      }
      await loadPayments();
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        logout();
        return;
      }
      flash("error", error.message || "Gagal menghapus metode pembayaran.");
    } finally {
      setSavingPayment(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Pengaturan"
        subtitle="Kelola toko, pajak, dan akses pengguna."
        actions={
          <button
            onClick={handleSubmit}
            disabled={loading || saving || !isAdmin}
            className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-soft-xl hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
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

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Pengaturan Toko
            </h2>
            <div className="mt-4 space-y-3">
              <input
                type="text"
                name="store_name"
                placeholder="Nama toko"
                value={form.store_name}
                onChange={handleChange}
                disabled={loading || !isAdmin}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
              <textarea
                name="store_address"
                placeholder="Alamat toko"
                value={form.store_address}
                onChange={handleChange}
                disabled={loading || !isAdmin}
                rows={4}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
              <input
                type="text"
                name="store_contact"
                placeholder="Nomor kontak"
                value={form.store_contact}
                onChange={handleChange}
                disabled={loading || !isAdmin}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Pengaturan Pajak
            </h2>
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-gray-100 px-4 py-3 dark:border-slate-800">
                <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                  Nama Pajak
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    name="tax_name"
                    value={form.tax_name}
                    onChange={handleChange}
                    disabled={loading || !isAdmin}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="number"
                    name="tax_rate"
                    min="0"
                    step="0.01"
                    value={form.tax_rate}
                    onChange={handleChange}
                    disabled={loading || !isAdmin}
                    className="w-28 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <span className="text-sm text-gray-500 dark:text-slate-400">
                    %
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 px-4 py-3 dark:border-slate-800">
                <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                  Nama Biaya Layanan
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    name="service_fee_name"
                    value={form.service_fee_name}
                    onChange={handleChange}
                    disabled={loading || !isAdmin}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="number"
                    name="service_fee_rate"
                    min="0"
                    step="0.01"
                    value={form.service_fee_rate}
                    onChange={handleChange}
                    disabled={loading || !isAdmin}
                    className="w-28 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <span className="text-sm text-gray-500 dark:text-slate-400">
                    %
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 px-4 py-3 dark:border-slate-800">
                <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                  Diskon Pembelian Global
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    name="purchase_discount_name"
                    value={form.purchase_discount_name}
                    onChange={handleChange}
                    disabled={loading || !isAdmin}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="number"
                    name="purchase_discount_rate"
                    min="0"
                    max="100"
                    step="0.01"
                    value={form.purchase_discount_rate}
                    onChange={handleChange}
                    disabled={loading || !isAdmin}
                    className="w-28 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <span className="text-sm text-gray-500 dark:text-slate-400">
                    %
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">
                {isAdmin
                  ? "Perubahan akan disimpan ke backend dan dipakai sebagai sumber pengaturan toko, pajak, dan diskon pembelian POS."
                  : "Mode baca saja. Hubungi admin untuk mengubah pengaturan toko, pajak, dan diskon."}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Metode Pembayaran
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Kelola metode pembayaran yang tersedia di POS dan order
                  manual.
                </p>
              </div>
              <button
                type="button"
                onClick={resetPaymentForm}
                disabled={!isAdmin}
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Form Baru
              </button>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr,1.3fr]">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {editingPaymentId ? "Edit Metode" : "Tambah Metode"}
                </h3>
                <div className="mt-3 space-y-3">
                  <input
                    type="text"
                    name="name"
                    placeholder="Contoh: QRIS"
                    value={paymentForm.name}
                    onChange={handlePaymentChange}
                    disabled={!isAdmin || savingPayment}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                  <select
                    name="type"
                    value={paymentForm.type}
                    onChange={handlePaymentChange}
                    disabled={!isAdmin || savingPayment}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="CASH">CASH</option>
                    <option value="E-WALLET">E-WALLET</option>
                    <option value="EDC">EDC</option>
                  </select>
                  <input
                    type="text"
                    name="logo"
                    placeholder="URL logo (opsional)"
                    value={paymentForm.logo}
                    onChange={handlePaymentChange}
                    disabled={!isAdmin || savingPayment}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSubmitPayment}
                      disabled={!isAdmin || savingPayment}
                      className="w-full rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingPayment
                        ? "Menyimpan..."
                        : editingPaymentId
                          ? "Update Metode"
                          : "Tambah Metode"}
                    </button>
                    {editingPaymentId && (
                      <button
                        type="button"
                        onClick={resetPaymentForm}
                        className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 dark:border-slate-800">
                <div className="border-b border-gray-100 px-4 py-3 dark:border-slate-800">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Daftar Metode Pembayaran
                  </h3>
                </div>
                <div className="max-h-[420px] overflow-y-auto">
                  {loadingPayments ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-slate-400">
                      Memuat metode pembayaran...
                    </div>
                  ) : payments.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-slate-400">
                      Belum ada metode pembayaran.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-slate-800">
                      {payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                        >
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {payment.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                              {payment.type}
                            </p>
                            {payment.logo ? (
                              <p className="mt-1 text-xs text-cyan-700 dark:text-cyan-300">
                                Logo tersedia
                              </p>
                            ) : null}
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditPayment(payment)}
                              disabled={!isAdmin || savingPayment}
                              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePayment(payment.id)}
                              disabled={!isAdmin || savingPayment}
                              className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Akses Pengguna
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Kelola admin dan kasir yang dapat mengakses aplikasi.
              </p>
            </div>
            <button
              type="button"
              onClick={resetUserForm}
              disabled={!isAdmin}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Form Baru
            </button>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr,1.4fr]">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {editingUserId ? "Edit Pengguna" : "Tambah Pengguna"}
              </h3>
              <div className="mt-3 space-y-3">
                <input
                  type="text"
                  name="name"
                  placeholder="Nama"
                  value={userForm.name}
                  onChange={handleUserChange}
                  disabled={!isAdmin || savingUser}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={userForm.username}
                  onChange={handleUserChange}
                  disabled={!isAdmin || savingUser}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={userForm.email}
                  onChange={handleUserChange}
                  disabled={!isAdmin || savingUser}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
                <input
                  type="password"
                  name="password"
                  placeholder={
                    editingUserId
                      ? "Password baru (opsional)"
                      : "Password minimal 8 karakter"
                  }
                  value={userForm.password}
                  onChange={handleUserChange}
                  disabled={!isAdmin || savingUser}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
                <select
                  name="role"
                  value={userForm.role}
                  onChange={handleUserChange}
                  disabled={!isAdmin || savingUser || isEditingCurrentUser}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="cashier">Kasir</option>
                  <option value="admin">Admin</option>
                </select>
                {isEditingCurrentUser ? (
                  <p className="text-xs text-amber-600 dark:text-amber-300">
                    Role akun yang sedang dipakai tidak dapat diturunkan dari
                    halaman ini.
                  </p>
                ) : null}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSubmitUser}
                    disabled={!isAdmin || savingUser}
                    className="w-full rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingUser
                      ? "Menyimpan..."
                      : editingUserId
                        ? "Update Pengguna"
                        : "Tambah Pengguna"}
                  </button>
                  {editingUserId && (
                    <button
                      type="button"
                      onClick={resetUserForm}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 dark:border-slate-800">
              <div className="border-b border-gray-100 px-4 py-3 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Daftar Pengguna
                </h3>
              </div>
              <div className="max-h-[520px] overflow-y-auto">
                {loadingUsers ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-slate-400">
                    Memuat daftar pengguna...
                  </div>
                ) : users.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-slate-400">
                    Belum ada pengguna.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-slate-800">
                    {users.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                      >
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">
                            @{item.username} • {item.email}
                          </p>
                          <p className="mt-1 text-xs">
                            <span
                              className={`rounded-full px-2 py-1 font-semibold ${
                                item.role === "admin"
                                  ? "bg-cyan-50 text-cyan-700"
                                  : "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-200"
                              }`}
                            >
                              {item.role === "admin" ? "Admin" : "Kasir"}
                            </span>
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditUser(item)}
                            disabled={!isAdmin || savingUser}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(item.id)}
                            disabled={
                              !isAdmin || savingUser || item.id === user?.id
                            }
                            className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Settings;
