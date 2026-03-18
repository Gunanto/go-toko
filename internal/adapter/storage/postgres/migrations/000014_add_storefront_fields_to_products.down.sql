DROP INDEX IF EXISTS products_slug_unique;

ALTER TABLE products
  DROP COLUMN IF EXISTS promo_label,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS gallery_images,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS slug;
