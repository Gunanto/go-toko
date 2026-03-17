import PageHeader from "../components/PageHeader";

const movements = [
  { item: "Kopi Arabica 1kg", type: "Masuk", qty: "+20", note: "PO-0032" },
  { item: "Susu Oat 1L", type: "Keluar", qty: "-6", note: "TRX-4011" },
  { item: "Gula Aren 500g", type: "Masuk", qty: "+40", note: "PO-0033" },
];

function Inventory() {
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
            Mutasi Terbaru
          </h2>
          <div className="mt-4 space-y-3">
            {movements.map((move) => (
              <div
                key={`${move.item}-${move.note}`}
                className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 dark:border-slate-800"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {move.item}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {move.note}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${
                      move.type === "Masuk"
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {move.qty}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {move.type}
                  </p>
                </div>
              </div>
            ))}
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
