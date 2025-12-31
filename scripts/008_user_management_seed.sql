-- Seed data for user management module

-- Create demo staff records for existing demo users
-- Note: You'll need to get the actual user IDs after running the auth signup

-- Insert sample staff data
-- This assumes you have demo users already created via Supabase Auth
-- You would need to update the user_id values with actual auth.users IDs

-- Example: Link existing admin user to staff table
-- INSERT INTO staff (user_id, employee_id, department, designation, qualification, experience_years, date_of_joining, employment_status, salary)
-- SELECT 
--   id as user_id,
--   'EMP001' as employee_id,
--   'Administration' as department,
--   'System Administrator' as designation,
--   'Masters in Computer Science' as qualification,
--   5 as experience_years,
--   '2020-01-01' as date_of_joining,
--   'active' as employment_status,
--   75000.00 as salary
-- FROM profiles WHERE role = 'admin' AND email LIKE '%admin%'
-- ON CONFLICT (user_id) DO NOTHING;

-- Add some sample audit log entries
INSERT INTO audit_logs (action, module, record_id, new_data, created_at) VALUES
  ('INSERT', 'system', gen_random_uuid(), '{"message": "User management module initialized"}', NOW() - INTERVAL '1 day'),
  ('UPDATE', 'system', gen_random_uuid(), '{"message": "Roles and permissions configured"}', NOW() - INTERVAL '1 hour')
ON CONFLICT DO NOTHING;
