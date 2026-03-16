import PageHeader from "../components/PageHeader";

const reports = [
  { title: "Laporan Penjualan Harian", period: "Hari ini", status: "Siap" },
  { title: "Laporan Cashflow", period: "Mingguan", status: "Diproses" },
  { title: "Analisis Produk Terlaris", period: "Bulanan", status: "Siap" },
];

function Reports() {
  return (
    <>
      <PageHeader
        title="Laporan"
        subtitle="Generate laporan keuangan dan performa toko."
        actions={
          <button className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-soft-xl hover:bg-cyan-700">
            Buat Laporan Baru
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {reports.map((report) => (
          <div
            key={report.title}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft-xl"
          >
            <p className="text-sm font-semibold text-gray-900">{report.title}</p>
            <p className="text-xs text-gray-500">Periode: {report.period}</p>
            <span
              className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                report.status === "Siap"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              {report.status}
            </span>
            <button className="mt-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
              Unduh
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

export default Reports;
