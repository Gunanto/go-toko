import PageHeader from "../components/PageHeader";

function Settings() {
  return (
    <>
      <PageHeader
        title="Pengaturan"
        subtitle="Kelola toko, pajak, dan akses pengguna."
        actions={
          <button className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-soft-xl hover:bg-cyan-700">
            Simpan Perubahan
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Profil Toko
          </h2>
          <div className="mt-4 space-y-3">
            <input
              type="text"
              placeholder="Nama toko"
              defaultValue="Go Toko Flagship"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
            <input
              type="text"
              placeholder="Alamat"
              defaultValue="Jl. Merdeka No. 45, Bandung"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
            <input
              type="text"
              placeholder="Nomor kontak"
              defaultValue="+62 812 3344 2211"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pengaturan Pajak
          </h2>
          <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-slate-400">
            <div className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-3 dark:border-slate-800">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  PPN
                </p>
                <p>10% otomatis pada semua transaksi</p>
              </div>
              <button className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-slate-700 dark:text-slate-200">
                Edit
              </button>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-3 dark:border-slate-800">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  Biaya Layanan
                </p>
                <p>2% untuk pembayaran non-tunai</p>
              </div>
              <button className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-slate-700 dark:text-slate-200">
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Settings;
