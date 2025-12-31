-- User Management & RBAC Schema
-- This extends the existing profiles table with comprehensive user management

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (name IN ('admin', 'teacher', 'accountant', 'staff')),
  display_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  module TEXT NOT NULL, -- students, attendance, grading, accounting, academic, teachers, reports, settings, users
  action TEXT NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete', 'manage')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create role_permissions mapping table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Extend profiles table with additional user management fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create staff table
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE,
  department TEXT,
  designation TEXT,
  qualification TEXT,
  experience_years INTEGER,
  date_of_joining DATE,
  employment_status TEXT NOT NULL DEFAULT 'active' CHECK (employment_status IN ('active', 'suspended', 'terminated', 'resigned')),
  salary DECIMAL(10, 2),
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_employment_status ON staff(employment_status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Insert default roles
INSERT INTO roles (name, display_name, description) VALUES
  ('admin', 'Administrator', 'Full system access and management'),
  ('teacher', 'Teacher', 'Access to academic and grading modules'),
  ('accountant', 'Accountant', 'Access to financial and accounting modules'),
  ('staff', 'Staff', 'Limited access to basic modules')
ON CONFLICT (name) DO NOTHING;

-- Insert permissions for all modules
INSERT INTO permissions (name, module, action, description) VALUES
  -- Students
  ('students.create', 'students', 'create', 'Create new students'),
  ('students.read', 'students', 'read', 'View student information'),
  ('students.update', 'students', 'update', 'Update student information'),
  ('students.delete', 'students', 'delete', 'Delete students'),
  -- Attendance
  ('attendance.create', 'attendance', 'create', 'Mark attendance'),
  ('attendance.read', 'attendance', 'read', 'View attendance records'),
  ('attendance.update', 'attendance', 'update', 'Update attendance'),
  ('attendance.delete', 'attendance', 'delete', 'Delete attendance records'),
  -- Grading
  ('grading.create', 'grading', 'create', 'Enter grades'),
  ('grading.read', 'grading', 'read', 'View grades'),
  ('grading.update', 'grading', 'update', 'Update grades'),
  ('grading.delete', 'grading', 'delete', 'Delete grades'),
  -- Accounting
  ('accounting.create', 'accounting', 'create', 'Create financial records'),
  ('accounting.read', 'accounting', 'read', 'View financial information'),
  ('accounting.update', 'accounting', 'update', 'Update financial records'),
  ('accounting.delete', 'accounting', 'delete', 'Delete financial records'),
  -- Academic
  ('academic.create', 'academic', 'create', 'Create academic records'),
  ('academic.read', 'academic', 'read', 'View academic information'),
  ('academic.update', 'academic', 'update', 'Update academic records'),
  ('academic.delete', 'academic', 'delete', 'Delete academic records'),
  -- Teachers
  ('teachers.create', 'teachers', 'create', 'Add teachers'),
  ('teachers.read', 'teachers', 'read', 'View teacher information'),
  ('teachers.update', 'teachers', 'update', 'Update teacher information'),
  ('teachers.delete', 'teachers', 'delete', 'Remove teachers'),
  -- Reports
  ('reports.read', 'reports', 'read', 'View reports and analytics'),
  -- Settings
  ('settings.read', 'settings', 'read', 'View settings'),
  ('settings.update', 'settings', 'update', 'Update settings'),
  -- Users (User Management)
  ('users.manage', 'users', 'manage', 'Full user management access')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'teacher' AND p.module IN ('students', 'attendance', 'grading', 'academic', 'reports')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'accountant' AND p.module IN ('students', 'accounting', 'reports')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'staff' AND p.module IN ('students', 'attendance') AND p.action = 'read'
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles (read-only for all authenticated users)
CREATE POLICY "Allow read roles" ON roles FOR SELECT TO authenticated USING (true);

-- RLS Policies for permissions (read-only for all authenticated users)
CREATE POLICY "Allow read permissions" ON permissions FOR SELECT TO authenticated USING (true);

-- RLS Policies for role_permissions (read-only for all authenticated users)
CREATE POLICY "Allow read role_permissions" ON role_permissions FOR SELECT TO authenticated USING (true);

-- RLS Policies for staff
CREATE POLICY "Allow read own staff" ON staff FOR SELECT TO authenticated 
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Allow admin manage staff" ON staff FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for audit_logs (admin only)
CREATE POLICY "Allow admin read audit_logs" ON audit_logs FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Allow all insert audit_logs" ON audit_logs FOR INSERT TO authenticated 
WITH CHECK (true);

-- Function to log user actions
CREATE OR REPLACE FUNCTION log_user_action()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, module, record_id, old_data, new_data)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to important tables
CREATE TRIGGER audit_profiles_changes
AFTER INSERT OR UPDATE OR DELETE ON profiles
FOR EACH ROW EXECUTE FUNCTION log_user_action();

CREATE TRIGGER audit_students_changes
AFTER INSERT OR UPDATE OR DELETE ON students
FOR EACH ROW EXECUTE FUNCTION log_user_action();

CREATE TRIGGER audit_staff_changes
AFTER INSERT OR UPDATE OR DELETE ON staff
FOR EACH ROW EXECUTE FUNCTION log_user_action();

-- Function to update last_login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET last_login = NOW() WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER set_staff_updated_at BEFORE UPDATE ON staff
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_roles_updated_at BEFORE UPDATE ON roles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
