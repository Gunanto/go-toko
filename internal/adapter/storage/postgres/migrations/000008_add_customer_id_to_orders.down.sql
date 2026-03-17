ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS fk_orders_customer;

DROP INDEX IF EXISTS idx_orders_customer_id;

ALTER TABLE orders
  DROP COLUMN IF EXISTS customer_id;
