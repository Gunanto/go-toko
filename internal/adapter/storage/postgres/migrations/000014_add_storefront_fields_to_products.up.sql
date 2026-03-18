ALTER TABLE products
  ADD COLUMN IF NOT EXISTS slug varchar,
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS gallery_images text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status varchar NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS promo_label varchar NOT NULL DEFAULT '';

UPDATE products
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

CREATE UNIQUE INDEX IF NOT EXISTS products_slug_unique
  ON products (slug);
