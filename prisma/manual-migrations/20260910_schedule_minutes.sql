-- Additive migration for the existing db-push managed database.
-- Preserve all existing deadlines; legacy hours receive minute 00.
ALTER TABLE "Setting" ADD COLUMN IF NOT EXISTS "submitMinute" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Setting" ADD COLUMN IF NOT EXISTS "proofMinute" INTEGER NOT NULL DEFAULT 0;
