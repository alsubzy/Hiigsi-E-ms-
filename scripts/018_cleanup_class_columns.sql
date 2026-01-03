-- Migration Script 018: Cleanup - Remove old class_name columns
-- This script removes the deprecated text-based class_name columns
-- Run this AFTER 017_enforce_class_constraints.sql has been executed

-- ============================================================
-- PHASE 1: STUDENTS TABLE - Drop class_name column
-- ============================================================

DO $$
BEGIN
    -- First, make class_name nullable (in case there are any constraints)
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'class_name'
    ) THEN
        ALTER TABLE students ALTER COLUMN class_name DROP NOT NULL;
        
        -- Then drop the column entirely
        ALTER TABLE students DROP COLUMN class_name;
        
        RAISE NOTICE 'Dropped students.class_name column';
    END IF;
END $$;

-- ============================================================
-- PHASE 2: FEE_STRUCTURES TABLE - Drop class_name column
-- ============================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'fee_structures' AND column_name = 'class_name'
    ) THEN
        ALTER TABLE fee_structures ALTER COLUMN class_name DROP NOT NULL;
        ALTER TABLE fee_structures DROP COLUMN class_name;
        
        RAISE NOTICE 'Dropped fee_structures.class_name column';
    END IF;
END $$;

-- ============================================================
-- PHASE 3: FEE_STRUCTURE TABLE - Drop grade column
-- ============================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'fee_structure' AND column_name = 'grade'
    ) THEN
        ALTER TABLE fee_structure ALTER COLUMN grade DROP NOT NULL;
        ALTER TABLE fee_structure DROP COLUMN grade;
        
        RAISE NOTICE 'Dropped fee_structure.grade column';
    END IF;
    
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'fee_structure' AND column_name = 'class_name'
    ) THEN
        ALTER TABLE fee_structure ALTER COLUMN class_name DROP NOT NULL;
        ALTER TABLE fee_structure DROP COLUMN class_name;
        
        RAISE NOTICE 'Dropped fee_structure.class_name column';
    END IF;
END $$;

-- ============================================================
-- PHASE 4: SUBJECTS TABLE - Drop grade/class_name column
-- ============================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'subjects' AND column_name = 'grade'
    ) THEN
        ALTER TABLE subjects ALTER COLUMN grade DROP NOT NULL;
        ALTER TABLE subjects DROP COLUMN grade;
        
        RAISE NOTICE 'Dropped subjects.grade column';
    END IF;
    
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'subjects' AND column_name = 'class_name'
    ) THEN
        ALTER TABLE subjects ALTER COLUMN class_name DROP NOT NULL;
        ALTER TABLE subjects DROP COLUMN class_name;
        
        RAISE NOTICE 'Dropped subjects.class_name column';
    END IF;
END $$;

-- ============================================================
-- VERIFICATION
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '=== CLEANUP COMPLETE ===';
    RAISE NOTICE 'Old text-based class columns have been removed';
    RAISE NOTICE 'System now uses class_id foreign keys exclusively';
    RAISE NOTICE '========================';
END $$;
