-- Fix missing is_current columns in academic_years and terms
-- These are required by the accounting auto-posting triggers

BEGIN;

-- 1. Update academic_years
ALTER TABLE academic_years 
ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT false;

-- 2. Update terms
ALTER TABLE terms 
ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT false;

-- 3. Optional: Sync is_active to is_current for academic_years if data exists
UPDATE academic_years SET is_current = is_active WHERE is_current IS FALSE AND is_active IS TRUE;

-- 4. Optional: Set a default current term if none exists to avoid trigger failures
-- This is a heuristic: pick the latest term by start_date
UPDATE terms SET is_current = true 
WHERE id = (SELECT id FROM terms ORDER BY start_date DESC LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM terms WHERE is_current = true);

COMMIT;
