ALTER TABLE "users" ADD COLUMN "username" varchar;

UPDATE "users" SET "username" = "email" WHERE "username" IS NULL;

ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX "username" ON "users" ("username");
