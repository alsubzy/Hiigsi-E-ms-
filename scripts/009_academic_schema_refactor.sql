-- Rename existing classes table to preserve data (if any)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'classes') THEN
    ALTER TABLE classes RENAME TO classes_legacy;
  END IF;
END $$;

-- Create normalized Classes table (Grade Levels)
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE, -- e.g., "Grade 1"
  level INTEGER NOT NULL, -- e.g., 1
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for classes
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read classes" ON classes;
CREATE POLICY "Public read classes" ON classes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin manage classes" ON classes;
CREATE POLICY "Admin manage classes" ON classes FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Create Sections table
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL, -- e.g., "A", "Blue"
  capacity INTEGER DEFAULT 30,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, name)
);

-- Enable RLS for sections
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read sections" ON sections;
CREATE POLICY "Public read sections" ON sections FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin manage sections" ON sections;
CREATE POLICY "Admin manage sections" ON sections FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Terms Management
CREATE TABLE IF NOT EXISTS terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL, -- e.g., "Term 1"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for terms
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read terms" ON terms;
CREATE POLICY "Public read terms" ON terms FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin manage terms" ON terms;
CREATE POLICY "Admin manage terms" ON terms FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Update Subjects table
-- Add class_id to link subjects to a specific grade level
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;

-- Subject Allocations (Teacher -> Subject -> Section)
CREATE TABLE IF NOT EXISTS subject_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(subject_id, section_id, academic_year_id)
);

-- Enable RLS for subject_teachers
ALTER TABLE subject_teachers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read subject_teachers" ON subject_teachers;
CREATE POLICY "Public read subject_teachers" ON subject_teachers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin manage subject_teachers" ON subject_teachers FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Update Timetable
-- Drop column class_id if it exists, add section_id
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'timetable' AND column_name = 'class_id') THEN
    ALTER TABLE timetable DROP COLUMN class_id;
  END IF;
END $$;

ALTER TABLE timetable ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES sections(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sections_class_id ON sections(class_id);
CREATE INDEX IF NOT EXISTS idx_terms_academic_year_id ON terms(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_subjects_class_id ON subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_subject_teachers_section ON subject_teachers(section_id);
CREATE INDEX IF NOT EXISTS idx_subject_teachers_teacher ON subject_teachers(teacher_id);
