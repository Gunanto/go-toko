import PageHeader from "../components/PageHeader";

const orders = [
  { id: "#ORD-2201", channel: "POS", amount: "Rp 410.000", status: "Selesai" },
  { id: "#ORD-2200", channel: "GoFood", amount: "Rp 182.000", status: "Diproses" },
  { id: "#ORD-2199", channel: "GrabFood", amount: "Rp 235.000", status: "Selesai" },
  { id: "#ORD-2198", channel: "POS", amount: "Rp 95.000", status: "Dibatalkan" },
];

function Orders() {
  return (
    <>
      <PageHeader
        title="Pesanan"
        subtitle="Pantau status order dari POS maupun kanal online."
        actions={
          <button className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-soft-xl hover:bg-cyan-700">
            Buat Order Manual
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft-xl"
          >
            <p className="text-xs uppercase text-gray-500">{order.channel}</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">{order.id}</p>
            <p className="text-sm text-gray-500">{order.amount}</p>
            <span
              className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                order.status === "Selesai"
                  ? "bg-emerald-50 text-emerald-600"
                  : order.status === "Diproses"
                  ? "bg-amber-50 text-amber-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {order.status}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

export default Orders;
