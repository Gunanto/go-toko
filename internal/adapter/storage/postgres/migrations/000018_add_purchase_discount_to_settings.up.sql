ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS purchase_discount_name TEXT NOT NULL DEFAULT 'Diskon Pembelian',
  ADD COLUMN IF NOT EXISTS purchase_discount_rate NUMERIC(5,2) NOT NULL DEFAULT 0;
