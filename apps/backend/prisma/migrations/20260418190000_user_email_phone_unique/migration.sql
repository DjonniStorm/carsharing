-- Align DB with schema: @@unique([email]), @@unique([phone]).
-- Remove duplicate rows so unique indexes can be created (keeps lexicographically smaller id).

DELETE FROM "user" AS u1
USING "user" AS u2
WHERE u1.email = u2.email AND u1.id > u2.id;

DELETE FROM "user" AS u1
USING "user" AS u2
WHERE u1.phone = u2.phone AND u1.id > u2.id;

DROP INDEX IF EXISTS "user_email_idx";

CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

CREATE UNIQUE INDEX "user_phone_key" ON "user"("phone");
