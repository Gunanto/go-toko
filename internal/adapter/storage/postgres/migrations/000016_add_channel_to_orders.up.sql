ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS channel varchar NOT NULL DEFAULT 'pos';

UPDATE orders
SET channel = CASE
  WHEN status = 'pending' THEN 'storefront'
  ELSE 'pos'
END
WHERE channel IS NULL OR channel = '';
