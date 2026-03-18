ALTER TABLE orders
  DROP COLUMN IF EXISTS customer_note,
  DROP COLUMN IF EXISTS shipping_address,
  DROP COLUMN IF EXISTS customer_email,
  DROP COLUMN IF EXISTS customer_phone;

ALTER TABLE customers
  DROP COLUMN IF EXISTS address;
