-- Patch migration to ensure ExecutionLog has phaseId/taskType/metadata
ALTER TABLE "ExecutionLog" ADD COLUMN IF NOT EXISTS "phaseId" TEXT;
ALTER TABLE "ExecutionLog" ADD COLUMN IF NOT EXISTS "taskType" TEXT;
ALTER TABLE "ExecutionLog" ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}'::jsonb;

-- Backfill existing rows
UPDATE "ExecutionLog" SET "phaseId" = "executionPhaseId" WHERE "phaseId" IS NULL;
UPDATE "ExecutionLog" SET "taskType" = COALESCE("taskType", 'UNKNOWN') WHERE "taskType" IS NULL OR "taskType" = '';
UPDATE "ExecutionLog" SET "metadata" = jsonb_set(COALESCE("metadata", '{}'::jsonb), '{scope}', '"phase"'::jsonb, true) WHERE "metadata" IS NULL OR NOT ("metadata" ? 'scope');

-- Enforce non-null after backfill
ALTER TABLE "ExecutionLog" ALTER COLUMN "phaseId" SET NOT NULL;
ALTER TABLE "ExecutionLog" ALTER COLUMN "taskType" SET NOT NULL;
ALTER TABLE "ExecutionLog" ALTER COLUMN "metadata" SET NOT NULL;
