import PageHeader from "../components/PageHeader";

const products = [
  { name: "Kopi Susu 1L", sku: "SKU-001", stock: 48, price: "Rp 78.000" },
  { name: "Cold Brew 500ml", sku: "SKU-007", stock: 32, price: "Rp 55.000" },
  { name: "Croissant Almond", sku: "SKU-014", stock: 18, price: "Rp 42.000" },
  { name: "Matcha Latte", sku: "SKU-021", stock: 26, price: "Rp 49.000" },
];

function Products() {
  return (
    <>
      <PageHeader
        title="Produk"
        subtitle="Kelola katalog, harga, dan stok produk."
        actions={
          <>
            <button className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Import CSV
            </button>
            <button className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-soft-xl hover:bg-cyan-700">
              Tambah Produk
            </button>
          </>
        }
      />

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            type="search"
            placeholder="Cari produk, SKU, kategori..."
            className="w-72 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700">
              Filter
            </button>
            <button className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700">
              Sortir
            </button>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="py-3">Produk</th>
                <th>SKU</th>
                <th>Stok</th>
                <th>Harga</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product.sku} className="text-gray-700">
                  <td className="py-3 font-semibold text-gray-900">{product.name}</td>
                  <td>{product.sku}</td>
                  <td>{product.stock} unit</td>
                  <td>{product.price}</td>
                  <td className="text-right">
                    <button className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default Products;
