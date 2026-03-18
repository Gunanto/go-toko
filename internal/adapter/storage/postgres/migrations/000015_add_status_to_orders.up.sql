ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS status varchar NOT NULL DEFAULT 'paid';

UPDATE orders
SET status = CASE
  WHEN total_paid >= total_price THEN 'paid'
  ELSE 'pending'
END
WHERE status IS NULL OR status = '';
