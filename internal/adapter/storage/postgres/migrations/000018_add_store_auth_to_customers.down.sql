ALTER TABLE customers
  DROP COLUMN IF EXISTS last_login_at,
  DROP COLUMN IF EXISTS auth_provider,
  DROP COLUMN IF EXISTS password;
