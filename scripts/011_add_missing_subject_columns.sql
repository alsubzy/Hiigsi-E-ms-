-- Comprehensive fix for Subjects table missing columns + Schema Cache Reload
-- This ensures the table matches the expectations and forces Supabase to refresh its API cache.

DO $$
BEGIN
    -- 1. Add 'description' column if missing
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'description') THEN
        ALTER TABLE subjects ADD COLUMN description TEXT;
    END IF;

    -- 2. Add 'credits' column if missing
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'credits') THEN
        ALTER TABLE subjects ADD COLUMN credits INTEGER DEFAULT 1;
    END IF;

    -- 3. Add 'is_active' column if missing
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'is_active') THEN
        ALTER TABLE subjects ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- 4. Ensure grade is nullable since we use class_id now
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'grade') THEN
        ALTER TABLE subjects ALTER COLUMN grade DROP NOT NULL;
    END IF;
END $$;

-- 5. FORCE POSTGREST SCHEMA RELOAD
-- This tells the Supabase API to refresh its knowledge of the table structure immediately.
NOTIFY pgrst, 'reload schema';

-- 6. Verify RLS is still active (standard admin policy)
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
