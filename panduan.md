# Panduan Menu Go Toko

Panduan ini merangkum penggunaan seluruh menu yang saat ini tersedia di aplikasi Go Toko, baik untuk admin/kasir maupun pelanggan storefront.

Base URL lokal frontend:
- admin: `http://localhost:5175`
- storefront: `http://localhost:5175/store`

## A. Menu Admin

### 1. Login Admin
URL: `http://localhost:5175/login`

#### Langkah-langkah
1. Buka halaman login admin.
2. Isi `Username`.
3. Isi `Password`.
4. Klik `Masuk`.
5. Setelah berhasil, pengguna akan diarahkan ke dashboard atau halaman terakhir yang diminta.

#### Catatan
- Halaman admin lain memerlukan login terlebih dulu.
- Jika token tidak valid atau kedaluwarsa, aplikasi akan meminta login ulang.

### 2. Dashboard
URL: `http://localhost:5175/dashboard`

#### Langkah-langkah
1. Buka halaman dashboard setelah login.
2. Lihat ringkasan utama seperti pesanan hari ini, pelanggan, dan produk.
3. Cek kartu statistik untuk memantau performa toko.
4. Gunakan daftar atau shortcut yang tersedia untuk masuk ke halaman detail seperti `Orders`, `Products`, atau `Customers`.

#### Catatan
- Data dashboard mengambil ringkasan dari order, customer, dan produk.
- Ringkasan harian mengikuti tanggal lokal browser.

### 3. POS
URL: `http://localhost:5175/pos`

#### Langkah-langkah
1. Buka halaman POS.
2. Klik `Buka Shift` untuk memulai sesi kasir.
3. Tambahkan produk ke keranjang dengan mengklik kartu produk.
4. Atur jumlah barang:
   - klik `+` untuk menambah qty
   - klik `-` untuk mengurangi qty
5. Pilih pelanggan jika diperlukan.
6. Pilih metode pembayaran.
7. Isi nominal pembayaran bila diperlukan.
8. Klik `Bayar Sekarang` untuk menyelesaikan transaksi.
9. Opsional: gunakan `Simpan Draft`, `Pulihkan`, atau `Hapus` untuk draft transaksi.
10. Klik `Tutup Shift` saat sesi kasir selesai.

#### Catatan
- `Buka Shift` wajib sebelum checkout.
- Draft POS disimpan di browser dan hanya tersedia di perangkat yang sama.
- Transaksi berhasil akan masuk ke data `orders`.
- Jika stok tidak cukup, transaksi akan ditolak.

### 4. Produk
URL: `http://localhost:5175/products`

#### Langkah-langkah
1. Buka halaman Produk.
2. Untuk menambah produk:
   1. Klik `Tambah Produk`.
   2. Isi form seperti nama, SKU, kategori, stok, harga, dan field pendukung lain yang tersedia.
   3. Klik `Simpan Produk`.
3. Untuk import CSV:
   1. Klik `Import CSV`.
   2. Pilih file CSV dari komputer.
   3. Sistem akan memproses dan memasukkan data ke daftar produk.
4. Gunakan kolom pencarian untuk mencari produk.
5. Klik salah satu produk untuk melihat detail dan mengubah data lebih lengkap.

#### Format CSV yang didukung
Header minimal: `name` atau `nama`.

Contoh:
```csv
name,sku,stock,price,category
Kopi Susu 1L,SKU-100,20,78000,Minuman
Croissant Almond,SKU-200,10,42000,Bakery
```

#### Catatan
- Hanya admin yang dapat menambah, mengubah, menghapus, atau import produk.
- Perubahan produk langsung mempengaruhi POS, storefront, dan stok.

### 5. Detail Produk
URL: `http://localhost:5175/products/:id`

#### Langkah-langkah
1. Masuk ke halaman produk.
2. Klik salah satu produk.
3. Tinjau data detail seperti nama, harga, stok, kategori, gambar, dan informasi storefront.
4. Ubah field yang diperlukan.
5. Simpan perubahan.

#### Catatan
- Halaman ini dipakai untuk pengelolaan produk yang lebih detail dibanding daftar utama.

### 6. Orders
URL: `http://localhost:5175/orders`

#### Langkah-langkah
1. Buka halaman Orders.
2. Gunakan filter status dan tanggal untuk menyaring data.
3. Lihat daftar order dari POS maupun storefront.
4. Klik salah satu order untuk melihat detail.
5. Jika perlu input order manual:
   1. buka dialog tambah order
   2. pilih pelanggan, produk, qty, dan metode pembayaran
   3. simpan order
6. Untuk order pending, lanjutkan pembayaran dari daftar atau detail order.

#### Catatan
- Channel order dapat berasal dari `pos`, `manual`, atau `storefront`.
- Order dari storefront juga akan muncul di sini.

### 7. Detail Order
URL: `http://localhost:5175/orders/:id`

#### Langkah-langkah
1. Buka detail dari halaman Orders.
2. Tinjau informasi pelanggan, item, total, status, channel, dan metode pembayaran.
3. Jika order masih pending, isi nominal pembayaran.
4. Klik aksi pembayaran untuk mengubah status order menjadi paid.

#### Catatan
- Halaman ini berguna untuk follow-up order storefront yang belum selesai dibayar.

### 8. Customers
URL: `http://localhost:5175/customers`

#### Langkah-langkah
1. Buka halaman Customers.
2. Gunakan pencarian, filter status, atau filter tier.
3. Untuk menambah pelanggan:
   1. klik tombol tambah pelanggan
   2. isi nama, kontak, tier, dan catatan
   3. simpan data
4. Untuk mengubah pelanggan:
   1. buka form edit dari daftar
   2. ubah data yang diperlukan
   3. simpan perubahan
5. Untuk reset password pelanggan store auth:
   1. buka aksi reset password
   2. isi password baru atau generate password sementara
   3. simpan
6. Klik salah satu pelanggan untuk melihat detail.

#### Catatan
- Halaman ini mencakup customer umum dan customer storefront.
- Admin dapat mengelola data serta reset password akun pelanggan.

### 9. Detail Customer
URL: `http://localhost:5175/customers/:id`

#### Langkah-langkah
1. Buka salah satu customer dari daftar.
2. Tinjau profil pelanggan.
3. Lihat order yang terkait dengan customer tersebut.
4. Gunakan halaman ini untuk memahami histori belanja customer.

#### Catatan
- Relasi order ditampilkan berdasarkan `customer_id` atau kecocokan data customer yang tersedia.

### 10. Inventory
URL: `http://localhost:5175/inventory`

#### Langkah-langkah
1. Buka halaman Inventory.
2. Gunakan filter kategori, pencarian produk, atau kondisi stok.
3. Pilih produk yang akan dikoreksi.
4. Isi `stok akhir`.
5. Tambahkan catatan koreksi jika diperlukan.
6. Simpan koreksi stok.

#### Catatan
- Inventory berfokus pada koreksi stok cepat.
- Perubahan stok langsung mempengaruhi POS dan storefront.

### 11. Reports
URL: `http://localhost:5175/reports`

#### Langkah-langkah
1. Buka halaman Reports.
2. Pilih range tanggal atau filter yang tersedia.
3. Tinjau ringkasan penjualan, performa produk, dan data transaksi.
4. Gunakan fitur ekspor atau cetak jika tersedia di halaman.

#### Catatan
- Laporan mengambil data dari `orders` dan data turunannya.
- Akurasi laporan bergantung pada transaksi yang sudah berhasil tersimpan.

### 12. Settings
URL: `http://localhost:5175/settings`

#### Langkah-langkah
1. Buka halaman Settings.
2. Ubah identitas toko seperti nama, alamat, dan kontak.
3. Atur komponen biaya seperti pajak dan service fee.
4. Simpan pengaturan.

#### Catatan
- Pengaturan ini dipakai juga oleh storefront.
- Kontak toko dapat dipakai pelanggan untuk follow-up pembayaran atau pertanyaan.

### 13. Chat Inbox
URL: `http://localhost:5175/chat`

#### Langkah-langkah
1. Buka halaman Chat Inbox sebagai admin.
2. Pilih percakapan di panel kiri.
3. Baca isi pesan customer di panel kanan.
4. Tulis balasan di kolom chat.
5. Klik `Kirim balasan`.
6. Unread admin akan berkurang saat thread dibuka.

#### Catatan
- Hanya admin yang dapat membuka menu ini.
- Chat memakai polling, belum WebSocket realtime.
- Percakapan tersimpan di database.

## B. Menu Storefront / Pelanggan

### 1. Storefront / Katalog
URL: `http://localhost:5175/store`

#### Langkah-langkah
1. Buka halaman storefront.
2. Gunakan pencarian produk atau filter kategori.
3. Lihat daftar produk yang tersedia.
4. Klik produk untuk melihat detail.
5. Klik `Tambah ke Keranjang` dari daftar jika ingin checkout cepat.

#### Catatan
- Halaman ini adalah pintu masuk utama pelanggan.
- Beberapa elemen seperti cart count dan akses akun ditampilkan di header.

### 2. Detail Produk Store
URL: `http://localhost:5175/store/:slug`

#### Langkah-langkah
1. Buka produk dari storefront.
2. Lihat gambar, harga, stok, dan deskripsi produk.
3. Pilih jumlah jika tersedia.
4. Klik `Tambah ke Keranjang`.
5. Lanjutkan ke cart atau kembali belanja.

#### Catatan
- Produk yang tidak aktif atau tidak tersedia tidak bisa dibeli.

### 3. Keranjang / Checkout
URL: `http://localhost:5175/store/cart`

#### Langkah-langkah
1. Buka halaman cart.
2. Periksa item yang dipilih.
3. Ubah qty atau hapus item jika perlu.
4. Isi data pelanggan:
   - nama
   - telepon
   - email
   - alamat / catatan
5. Pilih metode pembayaran.
6. Klik tombol checkout untuk membuat order storefront.
7. Setelah berhasil, simpan atau catat kode receipt untuk pelacakan.

#### Catatan
- Cart storefront sekarang discope per customer.
- Guest memiliki cart sendiri, dan customer login memiliki cart sendiri.
- Saat checkout berhasil, item cart akan dibersihkan.

### 4. Status Pesanan
URL: `http://localhost:5175/store/orders/status`

#### Langkah-langkah
1. Buka halaman status pesanan.
2. Masukkan kode receipt pesanan.
3. Klik cari / submit.
4. Lihat status pembayaran, detail order, item, dan total.
5. Jika pesanan belum dibayar, gunakan bantuan kontak yang tersedia untuk follow-up.
6. Jika ingin beli lagi, gunakan aksi yang memasukkan ulang item ke keranjang.

#### Catatan
- Halaman ini membantu pelanggan menelusuri order tanpa harus login admin.

### 5. Login Pelanggan
URL: `http://localhost:5175/store/login`

#### Langkah-langkah
1. Buka halaman login pelanggan.
2. Isi email atau nomor telepon.
3. Isi password.
4. Klik `Masuk`.
5. Jika login via Google tersedia, gunakan tombol Google Sign-In.

#### Catatan
- Setelah login, pelanggan bisa mengakses akun, chat, dan cart dengan scope customer sendiri.

### 6. Register Pelanggan
URL: `http://localhost:5175/store/register`

#### Langkah-langkah
1. Buka halaman register pelanggan.
2. Isi nama, email, telepon, alamat, dan password.
3. Klik `Daftar`.
4. Jika berhasil, pelanggan akan langsung masuk ke akun.
5. Alternatif: gunakan login Google jika tersedia.

#### Catatan
- Akun customer dipakai untuk store chat dan riwayat order.

### 7. Akun Pelanggan
URL: `http://localhost:5175/store/account`

#### Langkah-langkah
1. Login sebagai pelanggan.
2. Buka halaman akun.
3. Lihat profil dasar seperti nama, email, telepon, alamat, tier, dan metode login.
4. Lihat ringkasan order.
5. Buka riwayat belanja.
6. Gunakan `beli lagi` untuk memasukkan ulang item order lama ke keranjang.
7. Gunakan tombol `Chat Admin` jika ingin bertanya ke toko.

#### Catatan
- Halaman akun menjadi pusat aktivitas pelanggan setelah login.

### 8. Chat Store / Chat Admin
URL: `http://localhost:5175/store/chat`

#### Langkah-langkah
1. Login sebagai pelanggan.
2. Buka halaman chat.
3. Tulis pertanyaan atau kebutuhan pada kolom pesan.
4. Klik `Kirim`.
5. Tunggu balasan admin.
6. Buka kembali halaman chat untuk melihat unread atau pesan baru.

#### Catatan
- Satu customer memiliki satu percakapan utama.
- Pesan tersimpan di backend/database.
- Polling berjalan saat tab aktif.

### 9. Google OAuth Callback
URL: `http://localhost:5175/store/auth/callback`

#### Fungsi
Halaman ini dipakai otomatis setelah login Google.

#### Catatan
- Pengguna biasanya tidak perlu membuka halaman ini secara manual.

## C. Ringkasan Role

### Admin
- akses semua menu admin
- kelola produk, customer, order, pengaturan, dan chat inbox

### Cashier
- akses menu admin umum sesuai izin login
- tidak boleh membuka `Chat Inbox` admin

### Customer Storefront
- akses katalog, cart, status order, akun, dan chat store

## D. Catatan Teknis Singkat

- Menu admin menggunakan token user (`users`).
- Menu storefront pelanggan menggunakan token customer (`customers` / `store_auth`).
- Chat customer-admin memakai backend REST + polling.
- Cart storefront disimpan di browser, tetapi sekarang dipisah per scope customer.
