ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS address text;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS shipping_address text,
  ADD COLUMN IF NOT EXISTS customer_note text;
