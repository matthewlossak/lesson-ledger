-- Add subjects array column
ALTER TABLE "Student" ADD COLUMN "subjects" TEXT[] NOT NULL DEFAULT '{}';

-- Migrate existing data: wrap each subject string into a single-element array
UPDATE "Student" SET "subjects" = ARRAY["subject"];

-- Remove the temporary default now that data is populated
ALTER TABLE "Student" ALTER COLUMN "subjects" DROP DEFAULT;

-- Drop the old single-value column
ALTER TABLE "Student" DROP COLUMN "subject";
