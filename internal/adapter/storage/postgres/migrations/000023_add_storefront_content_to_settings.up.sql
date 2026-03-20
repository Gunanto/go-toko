ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS storefront_badge TEXT NOT NULL DEFAULT 'Etalase Resmi GEZY Commerce',
  ADD COLUMN IF NOT EXISTS storefront_hero_title TEXT NOT NULL DEFAULT 'Temukan produk pilihan dan nikmati pengalaman belanja yang cepat, praktis, dan nyaman.',
  ADD COLUMN IF NOT EXISTS storefront_hero_body TEXT NOT NULL DEFAULT 'Selamat datang di etalase resmi kami, tempat produk pilihan siap Anda pesan tanpa ribet.',
  ADD COLUMN IF NOT EXISTS storefront_feature_title TEXT NOT NULL DEFAULT 'Belanja Lebih Mudah',
  ADD COLUMN IF NOT EXISTS storefront_feature_item_1 TEXT NOT NULL DEFAULT 'Temukan produk favoritmu lewat pencarian atau kategori pilihan.',
  ADD COLUMN IF NOT EXISTS storefront_feature_item_2 TEXT NOT NULL DEFAULT 'Masukkan ke keranjang dalam beberapa klik dari etalase atau halaman detail.',
  ADD COLUMN IF NOT EXISTS storefront_feature_item_3 TEXT NOT NULL DEFAULT 'Selesaikan pembayaran dengan cepat lalu pantau status pesananmu dengan mudah.';
