DROP INDEX IF EXISTS customers_google_id_key;

ALTER TABLE customers
DROP COLUMN IF EXISTS avatar_url,
DROP COLUMN IF EXISTS google_id;
