ALTER TABLE settings
  DROP COLUMN IF EXISTS storefront_badge,
  DROP COLUMN IF EXISTS storefront_hero_title,
  DROP COLUMN IF EXISTS storefront_hero_body,
  DROP COLUMN IF EXISTS storefront_feature_title,
  DROP COLUMN IF EXISTS storefront_feature_item_1,
  DROP COLUMN IF EXISTS storefront_feature_item_2,
  DROP COLUMN IF EXISTS storefront_feature_item_3;
