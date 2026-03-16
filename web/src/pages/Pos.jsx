import PageHeader from "../components/PageHeader";

const cartItems = [
  { name: "Kopi Susu 1L", qty: 2, price: "Rp 78.000" },
  { name: "Croissant Almond", qty: 1, price: "Rp 42.000" },
  { name: "Cold Brew 500ml", qty: 1, price: "Rp 55.000" },
];

function Pos() {
  return (
    <>
      <PageHeader
        title="Kasir (POS)"
        subtitle="Pilih produk, atur diskon, dan selesaikan transaksi."
        actions={
          <button className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-soft-xl hover:bg-cyan-700">
            Buka Shift
          </button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Daftar Produk</h2>
            <input
              type="search"
              placeholder="Cari produk atau barcode"
              className="w-64 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {["Kopi Susu 1L", "Espresso", "Croissant", "Sandwich", "Matcha Latte", "Cookies"].map(
              (item) => (
                <button
                  key={item}
                  className="group rounded-2xl border border-gray-100 bg-gray-50 p-4 text-left hover:border-cyan-200 hover:bg-cyan-50"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">{item}</p>
                    <span className="text-xs font-semibold text-gray-500">Stok 24</span>
                  </div>
                  <p className="mt-3 text-lg font-semibold text-gray-900">Rp 45.000</p>
                  <p className="text-xs text-gray-500">Kategori Minuman</p>
                </button>
              )
            )}
          </div>
        </section>

        <aside className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft-xl">
          <h2 className="text-lg font-semibold text-gray-900">Keranjang</h2>
          <div className="mt-4 space-y-3">
            {cartItems.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">Qty {item.qty}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{item.price}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-2 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>Rp 253.000</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Diskon</span>
              <span>-Rp 12.000</span>
            </div>
            <div className="flex items-center justify-between font-semibold text-gray-900">
              <span>Total</span>
              <span>Rp 241.000</span>
            </div>
          </div>
          <div className="mt-6 grid gap-2">
            <button className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-soft-xl hover:bg-cyan-700">
              Bayar Sekarang
            </button>
            <button className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Simpan Draft
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}

export default Pos;
