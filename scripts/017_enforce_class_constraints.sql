-- Migration Script 017: Enforce Strict Class-Based Architecture
-- This script converts text-based class_name to UUID-based class_id foreign keys
-- Strategy: Archive orphaned records, RESTRICT class deletion

-- ============================================================
-- PHASE 1: ANALYSIS - Identify orphaned records
-- ============================================================

-- Check for students with class_name not matching any class
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM students s
    LEFT JOIN classes c ON LOWER(TRIM(s.class_name)) = LOWER(TRIM(c.name))
    WHERE c.id IS NULL;
    
    RAISE NOTICE 'Found % students with orphaned class_name values', orphaned_count;
END $$;

-- ============================================================
-- PHASE 2: STUDENTS TABLE - Add class_id and migrate data
-- ============================================================

DO $$
BEGIN
    -- Step 1: Add class_id column (nullable initially)
    ALTER TABLE students ADD COLUMN IF NOT EXISTS class_id UUID;

    -- Step 2: Migrate valid class_name to class_id
    UPDATE students s
    SET class_id = c.id
    FROM classes c
    WHERE LOWER(TRIM(s.class_name)) = LOWER(TRIM(c.name))
      AND s.class_id IS NULL;

    -- Step 3: Archive students with orphaned class_name
    UPDATE students
    SET status = 'inactive'
    WHERE class_id IS NULL
      AND status = 'active';

    -- Step 4: Add foreign key constraint with RESTRICT
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_students_class_id'
    ) THEN
        ALTER TABLE students 
          ADD CONSTRAINT fk_students_class_id 
          FOREIGN KEY (class_id) 
          REFERENCES classes(id) 
          ON DELETE RESTRICT;
    END IF;

    -- Step 5: Create index for performance
    CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);

    -- Step 6: Add check constraint for active students
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_active_students_have_class'
    ) THEN
        ALTER TABLE students 
          ADD CONSTRAINT chk_active_students_have_class 
          CHECK (status != 'active' OR class_id IS NOT NULL);
    END IF;

    RAISE NOTICE 'Students table migration complete. Orphaned students set to inactive.';
END $$;

-- ============================================================
-- PHASE 3: FEE_STRUCTURES TABLE - Add class_id
-- ============================================================

DO $$
BEGIN
    -- Handle fee_structures (plural)
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'fee_structures') THEN
        -- Add class_id column
        ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS class_id UUID;
        
        -- Migrate valid class_name to class_id
        UPDATE fee_structures fs
        SET class_id = c.id
        FROM classes c
        WHERE LOWER(TRIM(fs.class_name)) = LOWER(TRIM(c.name))
          AND fs.class_id IS NULL;
        
        -- Archive fee structures with orphaned class_name (if status column exists)
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'fee_structures' AND column_name = 'status'
        ) THEN
            UPDATE fee_structures
            SET status = 'inactive'
            WHERE class_id IS NULL
              AND status = 'active';
        END IF;
        
        -- Add foreign key constraint
        IF NOT EXISTS (
            SELECT FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_fee_structures_class_id'
        ) THEN
            ALTER TABLE fee_structures 
              ADD CONSTRAINT fk_fee_structures_class_id 
              FOREIGN KEY (class_id) 
              REFERENCES classes(id) 
              ON DELETE RESTRICT;
        END IF;
        
        -- Create index
        CREATE INDEX IF NOT EXISTS idx_fee_structures_class_id ON fee_structures(class_id);
        
        RAISE NOTICE 'fee_structures table migration complete';
    END IF;
    
    -- Handle fee_structure (singular) if it exists
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'fee_structure') THEN
        -- Add class_id column
        ALTER TABLE fee_structure ADD COLUMN IF NOT EXISTS class_id UUID;
        
        -- Check which column exists and migrate accordingly
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'fee_structure' AND column_name = 'grade'
        ) THEN
            -- Migrate from 'grade' column
            UPDATE fee_structure fs
            SET class_id = c.id
            FROM classes c
            WHERE LOWER(TRIM(fs.grade)) = LOWER(TRIM(c.name))
              AND fs.class_id IS NULL;
        ELSIF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'fee_structure' AND column_name = 'class_name'
        ) THEN
            -- Migrate from 'class_name' column
            UPDATE fee_structure fs
            SET class_id = c.id
            FROM classes c
            WHERE LOWER(TRIM(fs.class_name)) = LOWER(TRIM(c.name))
              AND fs.class_id IS NULL;
        END IF;
        
        -- Add foreign key constraint
        IF NOT EXISTS (
            SELECT FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_fee_structure_class_id'
        ) THEN
            ALTER TABLE fee_structure 
              ADD CONSTRAINT fk_fee_structure_class_id 
              FOREIGN KEY (class_id) 
              REFERENCES classes(id) 
              ON DELETE RESTRICT;
        END IF;
        
        -- Create index
        CREATE INDEX IF NOT EXISTS idx_fee_structure_class_id ON fee_structure(class_id);
        
        RAISE NOTICE 'fee_structure table migration complete';
    END IF;
END $$;

-- ============================================================
-- PHASE 4: SUBJECTS TABLE - Ensure class_id foreign key
-- ============================================================

DO $$
BEGIN
    -- If subjects has class_id already, just ensure constraint exists
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'subjects' AND column_name = 'class_id'
    ) THEN
        -- Ensure foreign key constraint exists
        IF NOT EXISTS (
            SELECT FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_subjects_class_id'
        ) THEN
            ALTER TABLE subjects 
              ADD CONSTRAINT fk_subjects_class_id 
              FOREIGN KEY (class_id) 
              REFERENCES classes(id) 
              ON DELETE RESTRICT;
        END IF;
        
        -- Create index if missing
        CREATE INDEX IF NOT EXISTS idx_subjects_class_id ON subjects(class_id);
        
        RAISE NOTICE 'subjects.class_id foreign key enforced';
    
    -- If subjects still has 'grade' column, migrate it
    ELSIF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'subjects' AND column_name = 'grade'
    ) THEN
        -- Add class_id column
        ALTER TABLE subjects ADD COLUMN IF NOT EXISTS class_id UUID;
        
        -- Migrate grade to class_id
        UPDATE subjects s
        SET class_id = c.id
        FROM classes c
        WHERE LOWER(TRIM(s.grade)) = LOWER(TRIM(c.name))
          AND s.class_id IS NULL;
        
        -- Add foreign key constraint
        IF NOT EXISTS (
            SELECT FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_subjects_class_id'
        ) THEN
            ALTER TABLE subjects 
              ADD CONSTRAINT fk_subjects_class_id 
              FOREIGN KEY (class_id) 
              REFERENCES classes(id) 
              ON DELETE RESTRICT;
        END IF;
        
        -- Create index
        CREATE INDEX IF NOT EXISTS idx_subjects_class_id ON subjects(class_id);
        
        RAISE NOTICE 'subjects table migrated from grade to class_id';
    END IF;
END $$;

-- ============================================================
-- PHASE 5: VERIFICATION QUERIES
-- ============================================================

-- Report migration results
DO $$
DECLARE
    active_students_with_class INTEGER;
    inactive_students INTEGER;
    total_classes INTEGER;
BEGIN
    SELECT COUNT(*) INTO active_students_with_class
    FROM students WHERE status = 'active' AND class_id IS NOT NULL;
    
    SELECT COUNT(*) INTO inactive_students
    FROM students WHERE status = 'inactive';
    
    SELECT COUNT(*) INTO total_classes
    FROM classes WHERE status = 'active';
    
    RAISE NOTICE '=== MIGRATION SUMMARY ===';
    RAISE NOTICE 'Active students with valid class: %', active_students_with_class;
    RAISE NOTICE 'Inactive/archived students: %', inactive_students;
    RAISE NOTICE 'Total active classes: %', total_classes;
    RAISE NOTICE '========================';
END $$;

-- ============================================================
-- OPTIONAL: Uncomment to view orphaned records before cleanup
-- ============================================================

-- SELECT 'Orphaned Students' as record_type, id, first_name, last_name, class_name, status
-- FROM students 
-- WHERE class_id IS NULL;

-- SELECT 'Orphaned Fee Structures' as record_type, id, class_name, fee_type, status
-- FROM fee_structures 
-- WHERE class_id IS NULL;
