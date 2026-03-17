import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";

const quickActions = [
  { label: "Buka Kasir", note: "Shift pagi • Rp 12.450.000" },
  { label: "Tambah Produk", note: "Stok baru minggu ini" },
  { label: "Buat PO", note: "Supplier utama" },
  { label: "Cetak Laporan", note: "Ringkas harian" },
];

const transactions = [
  { id: "#TRX-4012", customer: "Nadia R", time: "09:32", amount: "Rp 285.000" },
  {
    id: "#TRX-4011",
    customer: "TOKO RAYA",
    time: "09:11",
    amount: "Rp 1.250.000",
  },
  { id: "#TRX-4010", customer: "Rani A", time: "08:57", amount: "Rp 78.000" },
  { id: "#TRX-4009", customer: "Dadan Y", time: "08:40", amount: "Rp 512.000" },
];

const lowStock = [
  { name: "Kopi Arabica 1kg", stock: 6, status: "Kritis" },
  { name: "Susu Oat 1L", stock: 12, status: "Menipis" },
  { name: "Gula Aren 500g", stock: 9, status: "Kritis" },
];

function Dashboard() {
  return (
    <>
      <PageHeader
        title="Ringkasan Toko"
        subtitle="Pantau penjualan, stok, dan performa toko hari ini."
        actions={
          <>
            <button className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
              Export
            </button>
            <button className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-soft-xl hover:bg-cyan-700">
              Buat Transaksi
            </button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Penjualan Hari Ini"
          value="Rp 18,4 jt"
          change="12.5%"
          trend="up"
        />
        <StatCard
          label="Jumlah Transaksi"
          value="128"
          change="4.2%"
          trend="up"
        />
        <StatCard label="Margin Kotor" value="18.4%" change="1.1%" trend="up" />
        <StatCard
          label="Produk Menipis"
          value="14"
          change="2.3%"
          trend="down"
        />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Transaksi Terbaru
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Daftar transaksi 60 menit terakhir.
              </p>
            </div>
            <button className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              Lihat semua
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                <tr>
                  <th className="py-3">ID</th>
                  <th>Pelanggan</th>
                  <th>Waktu</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {transactions.map((trx) => (
                  <tr
                    key={trx.id}
                    className="text-gray-700 dark:text-slate-200"
                  >
                    <td className="py-3 font-semibold text-gray-900 dark:text-white">
                      {trx.id}
                    </td>
                    <td>{trx.customer}</td>
                    <td>{trx.time}</td>
                    <td className="text-right font-semibold text-gray-900 dark:text-white">
                      {trx.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quick Actions
            </h2>
            <div className="mt-4 space-y-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:border-cyan-200 hover:bg-cyan-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <p>{action.label}</p>
                  <p className="text-xs font-normal text-gray-500 dark:text-slate-400">
                    {action.note}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Stok Menipis
            </h2>
            <div className="mt-4 space-y-3">
              {lowStock.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2 dark:border-slate-800"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Sisa {item.stock} unit
                    </p>
                  </div>
                  <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Dashboard;
