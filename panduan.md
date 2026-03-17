# Panduan Menu Go Toko

Panduan ini berisi langkah-langkah penggunaan untuk menu POS dan Produk.

## 1. Menu POS
URL: `http://localhost:5175/pos`

### Langkah-langkah
1. Buka halaman POS melalui URL di atas.
2. Klik `Buka Shift` untuk memulai sesi kasir.
3. Tambahkan produk ke keranjang dengan mengklik kartu produk pada daftar.
4. Atur jumlah barang:
   - Klik tombol `+` untuk menambah qty.
   - Klik tombol `-` untuk mengurangi qty (item akan hilang jika qty menjadi 0).
5. Periksa ringkasan transaksi (Subtotal, Diskon, Total) di panel keranjang.
6. Opsional: klik `Simpan Draft` untuk menyimpan keranjang sementara.
7. Jika ada draft tersimpan, gunakan `Pulihkan` untuk memuatnya kembali atau `Hapus` untuk membuangnya.
8. Klik `Bayar Sekarang` untuk menyelesaikan transaksi.
9. Klik `Tutup Shift` jika ingin mengakhiri sesi kasir.

### Catatan
- `Buka Shift` wajib sebelum melakukan pembayaran.
- Draft disimpan di browser (localStorage) dan hanya berlaku di perangkat yang sama.
- Transaksi akan tersimpan ke `orders` dan menjadi sumber data laporan setelah pembayaran berhasil.
- Jika stok produk tidak cukup, transaksi akan ditolak.

## 2. Menu Produk
URL: `http://localhost:5175/products`

### Langkah-langkah
1. Buka halaman Produk melalui URL di atas.
2. Untuk menambah produk baru:
   1. Klik `Tambah Produk`.
   2. Isi form (Nama Produk, SKU, Kategori, Stok, Harga).
   3. Klik `Simpan Produk`.
3. Untuk import produk dari CSV:
   1. Klik `Import CSV`.
   2. Pilih file CSV dari komputer.
   3. Data akan langsung masuk ke tabel produk.
4. Gunakan kolom pencarian untuk menemukan produk berdasarkan nama, SKU, atau kategori.

### Format CSV yang didukung
Header minimal: `name` (atau `nama`).

Contoh:
```
name,sku,stock,price,category
Kopi Susu 1L,SKU-100,20,78000,Minuman
Croissant Almond,SKU-200,10,42000,Bakery
```

### Catatan
- Hanya pengguna dengan role **Admin** yang dapat menambah, mengubah, menghapus, atau import produk.
- Perubahan produk tersimpan di backend dan langsung mempengaruhi stok serta data di POS.
