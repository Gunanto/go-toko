ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_id BIGINT;

ALTER TABLE orders
  ADD CONSTRAINT fk_orders_customer
  FOREIGN KEY (customer_id) REFERENCES customers(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders (customer_id);
