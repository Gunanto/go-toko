import PageHeader from "../components/PageHeader";

const customers = [
  { name: "Nadia Rahma", phone: "0812-3344-2211", tier: "Gold" },
  { name: "Dadan Yusuf", phone: "0821-5522-9931", tier: "Silver" },
  { name: "Toko Raya", phone: "0817-1111-9090", tier: "Platinum" },
];

function Customers() {
  return (
    <>
      <PageHeader
        title="Pelanggan"
        subtitle="Kelola data pelanggan dan segmentasi loyalitas."
        actions={
          <button className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-soft-xl hover:bg-cyan-700">
            Tambah Pelanggan
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {customers.map((customer) => (
          <div
            key={customer.phone}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {customer.name}
                </p>
                <p className="text-sm text-gray-500">{customer.phone}</p>
              </div>
              <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                {customer.tier}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <span>Total transaksi</span>
              <span className="font-semibold text-gray-900">Rp 7,4 jt</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
              <span>Terakhir belanja</span>
              <span className="font-semibold text-gray-900">Kemarin</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default Customers;
