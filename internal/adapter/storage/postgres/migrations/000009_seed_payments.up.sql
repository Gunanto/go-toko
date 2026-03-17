INSERT INTO "payments" ("name", "type", "logo")
VALUES ('Tunai', 'CASH', NULL)
ON CONFLICT ("name") DO NOTHING;
