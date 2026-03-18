ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS password text,
  ADD COLUMN IF NOT EXISTS auth_provider text NOT NULL DEFAULT 'guest',
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

UPDATE customers
SET auth_provider = 'password'
WHERE password IS NOT NULL
  AND auth_provider = 'guest';
