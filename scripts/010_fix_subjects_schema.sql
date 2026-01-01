-- Fix for Subjects table schema to resolve legacy conflicts
-- 1. Check if legacy 'grade' column exists and make it nullable or drop it if safe
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subjects' AND column_name = 'grade') THEN
    ALTER TABLE IF EXISTS subjects ALTER COLUMN grade DROP NOT NULL;
  END IF;
END $$;

-- 2. Ensure credits and is_active have defaults if they were added later
ALTER TABLE IF EXISTS subjects ALTER COLUMN credits SET DEFAULT 1;
ALTER TABLE IF EXISTS subjects ALTER COLUMN is_active SET DEFAULT true;

-- 3. Add teacher_id to subjects table IF the user expects a 1-to-1 or default teacher link
-- Note: Our system uses subject_teachers for 1-to-Many (Section based), 
-- but we can add application-level defaults if requested.
-- For now, we stick to the normalized schema but ensure no NOT NULL constraints block creation.

-- 4. Verify RLS policies (already set in 009, but ensuring they are fresh)
DROP POLICY IF EXISTS "Allow admin to manage subjects" ON subjects;
CREATE POLICY "Allow admin to manage subjects"
  ON subjects FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
