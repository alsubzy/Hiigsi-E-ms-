-- Seed data for Academic Management

-- Insert active academic year
INSERT INTO academic_years (year_name, start_date, end_date, is_active)
VALUES 
  ('2024-2025', '2024-09-01', '2025-06-30', true),
  ('2023-2024', '2023-09-01', '2024-06-30', false)
ON CONFLICT (year_name) DO NOTHING;

-- Get active academic year ID
DO $$
DECLARE
  active_year_id UUID;
BEGIN
  SELECT id INTO active_year_id FROM academic_years WHERE is_active = true LIMIT 1;

  -- Insert subjects
  INSERT INTO subjects (name, code, description, credits)
  VALUES 
    ('Mathematics', 'MATH', 'Core mathematics curriculum', 4),
    ('English', 'ENG', 'English language and literature', 4),
    ('Science', 'SCI', 'General science covering physics, chemistry, biology', 4),
    ('Social Studies', 'SS', 'History, geography, and civics', 3),
    ('Physical Education', 'PE', 'Sports and physical fitness', 2),
    ('Art', 'ART', 'Visual arts and creativity', 2),
    ('Music', 'MUS', 'Music theory and practice', 2),
    ('Computer Science', 'CS', 'Computer programming and IT', 3)
  ON CONFLICT (code) DO NOTHING;

  -- Insert classes for different grades
  INSERT INTO classes (name, grade_level, section, capacity, academic_year_id, room_number)
  VALUES 
    ('Grade 1-A', 1, 'A', 30, active_year_id, '101'),
    ('Grade 1-B', 1, 'B', 30, active_year_id, '102'),
    ('Grade 2-A', 2, 'A', 30, active_year_id, '201'),
    ('Grade 2-B', 2, 'B', 30, active_year_id, '202'),
    ('Grade 3-A', 3, 'A', 30, active_year_id, '301'),
    ('Grade 3-B', 3, 'B', 30, active_year_id, '302'),
    ('Grade 4-A', 4, 'A', 30, active_year_id, '401'),
    ('Grade 4-B', 4, 'B', 30, active_year_id, '402'),
    ('Grade 5-A', 5, 'A', 30, active_year_id, '501'),
    ('Grade 5-B', 5, 'B', 30, active_year_id, '502')
  ON CONFLICT (grade_level, section, academic_year_id) DO NOTHING;

  -- Insert some calendar events
  INSERT INTO calendar_events (title, description, event_type, start_date, end_date, academic_year_id)
  VALUES 
    ('First Day of School', 'Welcome back students!', 'event', '2024-09-01', '2024-09-01', active_year_id),
    ('Thanksgiving Break', 'School closed for Thanksgiving', 'holiday', '2024-11-28', '2024-11-29', active_year_id),
    ('Winter Break', 'Winter holiday break', 'holiday', '2024-12-23', '2025-01-05', active_year_id),
    ('Mid-Term Exams', 'Mid-term examination period', 'exam', '2024-11-15', '2024-11-22', active_year_id),
    ('Spring Break', 'Spring holiday break', 'holiday', '2025-03-24', '2025-03-28', active_year_id),
    ('Final Exams', 'End of year examinations', 'exam', '2025-06-01', '2025-06-15', active_year_id),
    ('Last Day of School', 'End of academic year', 'event', '2025-06-30', '2025-06-30', active_year_id)
  ON CONFLICT DO NOTHING;
END $$;
