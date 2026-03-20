ALTER TABLE settings
  DROP COLUMN IF EXISTS purchase_discount_rate,
  DROP COLUMN IF EXISTS purchase_discount_name;
