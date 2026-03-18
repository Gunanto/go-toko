ALTER TABLE customers
ADD COLUMN google_id TEXT,
ADD COLUMN avatar_url TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS customers_google_id_key
ON customers (google_id)
WHERE google_id IS NOT NULL;
