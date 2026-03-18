CREATE TABLE IF NOT EXISTS settings (
  id BIGINT PRIMARY KEY,
  store_name TEXT NOT NULL,
  store_address TEXT NOT NULL,
  store_contact TEXT NOT NULL,
  tax_name TEXT NOT NULL,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  service_fee_name TEXT NOT NULL,
  service_fee_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO settings (
  id,
  store_name,
  store_address,
  store_contact,
  tax_name,
  tax_rate,
  service_fee_name,
  service_fee_rate
) VALUES (
  1,
  'GEZY Commerce',
  'Jl. Merdeka No. 45, Bandung',
  '+62 812 3344 2211',
  'PPN',
  11,
  'Biaya Layanan',
  2
)
ON CONFLICT (id) DO NOTHING;
