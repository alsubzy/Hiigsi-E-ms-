-- Migration Script 019: Enforce Strict Class + Section Architecture
-- This script converts text-based section to UUID-based section_id foreign keys
-- Strategy: Auto-create missing sections, remove class_id from students

-- ============================================================
-- PHASE 1: ANALYSIS - Report current state
-- ============================================================

DO $$
DECLARE
    students_count INTEGER;
    unique_sections INTEGER;
BEGIN
    SELECT COUNT(*) INTO students_count FROM students WHERE status = 'active';
    
    SELECT COUNT(DISTINCT (class_id, section)) INTO unique_sections
    FROM students 
    WHERE class_id IS NOT NULL AND section IS NOT NULL;
    
    RAISE NOTICE '=== PRE-MIGRATION ANALYSIS ===';
    RAISE NOTICE 'Active students: %', students_count;
    RAISE NOTICE 'Unique Class-Section combinations: %', unique_sections;
    RAISE NOTICE '==============================';
END $$;

-- ============================================================
-- PHASE 2: ENSURE SECTIONS EXIST - Auto-create missing sections
-- ============================================================

DO $$
DECLARE
    sections_created INTEGER := 0;
BEGIN
    -- Create sections for each unique class_id + section combination
    INSERT INTO sections (class_id, name, capacity, status, created_at, updated_at)
    SELECT DISTINCT 
        s.class_id, 
        s.section, 
        30, 
        'active',
        NOW(),
        NOW()
    FROM students s
    WHERE s.class_id IS NOT NULL 
      AND s.section IS NOT NULL
      AND s.section != ''
      AND NOT EXISTS (
        SELECT 1 FROM sections sec 
        WHERE sec.class_id = s.class_id 
        AND sec.name = s.section
      );
    
    GET DIAGNOSTICS sections_created = ROW_COUNT;
    RAISE NOTICE 'Auto-created % sections from student data', sections_created;
END $$;

-- ============================================================
-- PHASE 3: STUDENTS TABLE - Add section_id and migrate data
-- ============================================================

DO $$
BEGIN
    -- Step 1: Add section_id column (nullable initially)
    ALTER TABLE students ADD COLUMN IF NOT EXISTS section_id UUID;
    
    -- Step 2: Update students with matching section_id
    UPDATE students s
    SET section_id = sec.id
    FROM sections sec
    WHERE s.class_id = sec.class_id
      AND s.section = sec.name
      AND s.section_id IS NULL;
    
    -- Step 3: Archive students without valid section (orphaned)
    UPDATE students
    SET status = 'inactive'
    WHERE section_id IS NULL 
      AND status = 'active';
    
    -- Step 4: Add foreign key constraint with RESTRICT
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_students_section_id'
    ) THEN
        ALTER TABLE students 
          ADD CONSTRAINT fk_students_section_id 
          FOREIGN KEY (section_id) 
          REFERENCES sections(id) 
          ON DELETE RESTRICT;
    END IF;
    
    -- Step 5: Add check constraint for active students
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_active_students_have_section'
    ) THEN
        ALTER TABLE students 
          ADD CONSTRAINT chk_active_students_have_section 
          CHECK (status != 'active' OR section_id IS NOT NULL);
    END IF;
    
    -- Step 6: Create index for performance
    CREATE INDEX IF NOT EXISTS idx_students_section_id ON students(section_id);
    
    RAISE NOTICE 'Students migrated to section_id successfully';
END $$;

-- ============================================================
-- PHASE 4: CLEANUP - Remove old columns
-- ============================================================

DO $$
BEGIN
    -- Drop class_id column (now derived from section.class_id)
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'class_id'
    ) THEN
        -- First drop any foreign key constraints on class_id
        ALTER TABLE students DROP CONSTRAINT IF EXISTS fk_students_class_id;
        
        -- Then drop the column
        ALTER TABLE students DROP COLUMN class_id;
        
        RAISE NOTICE 'Dropped students.class_id column (now derived from section)';
    END IF;
    
    -- Drop section text column
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'section'
    ) THEN
        ALTER TABLE students DROP COLUMN section;
        
        RAISE NOTICE 'Dropped students.section text column';
    END IF;
END $$;

-- ============================================================
-- PHASE 5: VERIFICATION
-- ============================================================

DO $$
DECLARE
    active_students_with_section INTEGER;
    inactive_students INTEGER;
    total_sections INTEGER;
    orphaned_students INTEGER;
BEGIN
    -- Count active students with valid section
    SELECT COUNT(*) INTO active_students_with_section
    FROM students 
    WHERE status = 'active' AND section_id IS NOT NULL;
    
    -- Count inactive students
    SELECT COUNT(*) INTO inactive_students
    FROM students 
    WHERE status = 'inactive';
    
    -- Count total sections
    SELECT COUNT(*) INTO total_sections
    FROM sections 
    WHERE status = 'active';
    
    -- Check for orphaned students (should be 0)
    SELECT COUNT(*) INTO orphaned_students
    FROM students s
    LEFT JOIN sections sec ON s.section_id = sec.id
    WHERE s.status = 'active' AND sec.id IS NULL;
    
    RAISE NOTICE '=== MIGRATION SUMMARY ===';
    RAISE NOTICE 'Active students with valid section: %', active_students_with_section;
    RAISE NOTICE 'Inactive/archived students: %', inactive_students;
    RAISE NOTICE 'Total active sections: %', total_sections;
    RAISE NOTICE 'Orphaned students (should be 0): %', orphaned_students;
    RAISE NOTICE '========================';
    
    IF orphaned_students > 0 THEN
        RAISE WARNING 'Found % orphaned students! Check data integrity.', orphaned_students;
    END IF;
END $$;

-- ============================================================
-- OPTIONAL: View migration results
-- ============================================================

-- Uncomment to view student-section-class relationships
-- SELECT 
--     s.id,
--     s.first_name,
--     s.last_name,
--     sec.name as section_name,
--     c.name as class_name,
--     c.level as class_level
-- FROM students s
-- JOIN sections sec ON s.section_id = sec.id
-- JOIN classes c ON sec.class_id = c.id
-- WHERE s.status = 'active'
-- ORDER BY c.level, sec.name, s.last_name;
