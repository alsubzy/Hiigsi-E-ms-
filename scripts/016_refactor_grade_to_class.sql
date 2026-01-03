-- Migration Script: Refactor Grade to Class
-- This script renames 'grade' to 'class' or 'class_name' and 'grades' table to 'class_marks'.

-- ============================================================
-- STEP 1: Students Table - Rename grade column to class_name
-- ============================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'students' 
        AND column_name = 'grade'
    ) THEN
        ALTER TABLE public.students RENAME COLUMN grade TO class_name;
        DROP INDEX IF EXISTS idx_students_grade;
        CREATE INDEX idx_students_class_name ON public.students(class_name);
    END IF;
END $$;

-- ============================================================
-- STEP 2: Subjects Table - Handle grade column if it exists
-- ============================================================
-- Note: Subjects may have 'grade' column (old schema) or 'class_id' (new schema)
-- We'll rename 'grade' to 'class_name' only if 'class_id' doesn't exist
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'subjects' 
        AND column_name = 'grade'
    ) AND NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'subjects' 
        AND column_name = 'class_id'
    ) THEN
        ALTER TABLE public.subjects RENAME COLUMN grade TO class_name;
    END IF;
END $$;

-- ============================================================
-- STEP 3: Grades Table - Rename to class_marks
-- ============================================================
DO $$
BEGIN
    -- Rename table 'grades' to 'class_marks'
    IF EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'grades'
    ) THEN
        ALTER TABLE public.grades RENAME TO class_marks;
        
        -- Drop old indexes
        DROP INDEX IF EXISTS idx_grades_student_id;
        DROP INDEX IF EXISTS idx_grades_term;
        
        -- Create new indexes with updated names
        CREATE INDEX idx_class_marks_student_id ON public.class_marks(student_id);
        CREATE INDEX idx_class_marks_term ON public.class_marks(term);
    END IF;

    -- Rename 'grade' column (evaluation result) to 'result' in class_marks table
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'class_marks' 
        AND column_name = 'grade'
    ) THEN
        ALTER TABLE public.class_marks RENAME COLUMN grade TO result;
    END IF;
END $$;

-- ============================================================
-- STEP 4: Fee Structures Table - Rename grade to class_name
-- ============================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'fee_structures' 
        AND column_name = 'grade'
    ) THEN
        ALTER TABLE public.fee_structures RENAME COLUMN grade TO class_name;
    END IF;
END $$;

-- ============================================================
-- STEP 5: Fee Structure Table (singular) - Handle if it exists
-- ============================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'fee_structure' 
        AND column_name = 'grade'
    ) THEN
        ALTER TABLE public.fee_structure RENAME COLUMN grade TO class_name;
    END IF;
END $$;

-- ============================================================
-- VERIFICATION QUERIES (You can run these after migration)
-- ============================================================
-- Uncomment to verify the changes:

-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND (column_name LIKE '%class%' OR column_name LIKE '%grade%' OR column_name = 'result')
-- ORDER BY table_name, column_name;

-- SELECT tablename FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename LIKE '%mark%'
-- ORDER BY tablename;
