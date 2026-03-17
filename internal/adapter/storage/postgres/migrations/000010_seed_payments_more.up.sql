INSERT INTO "payments" ("name", "type", "logo")
VALUES
  ('Transfer', 'E-WALLET', NULL),
  ('QRIS', 'E-WALLET', NULL)
ON CONFLICT ("name") DO NOTHING;
