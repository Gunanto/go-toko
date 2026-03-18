ALTER TABLE order_products
  ADD COLUMN IF NOT EXISTS cost_at_sale decimal(18, 2) NOT NULL DEFAULT 0;
