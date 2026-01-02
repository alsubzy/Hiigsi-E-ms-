-- SEED DATA for Accounting Module

BEGIN;

-- 1. Default Academic Year
INSERT INTO academic_years (name, start_date, end_date, is_current)
VALUES ('2025-2026', '2025-09-01', '2026-06-30', true)
ON CONFLICT (name) DO NOTHING;

-- 2. Default Terms
DO $$
DECLARE
    ay_id UUID;
BEGIN
    SELECT id INTO ay_id FROM academic_years WHERE name = '2025-2026' LIMIT 1;
    
    INSERT INTO terms (academic_year_id, name, start_date, end_date, is_current)
    VALUES 
        (ay_id, 'Term 1', '2025-09-01', '2025-12-31', true),
        (ay_id, 'Term 2', '2026-01-01', '2026-03-31', false),
        (ay_id, 'Term 3', '2026-04-01', '2026-06-30', false)
    ON CONFLICT (academic_year_id, name) DO NOTHING;
END $$;

-- 3. Standard Chart of Accounts
-- ASSETS (1000)
INSERT INTO accounts (code, name, type, is_system, description) VALUES
('1000', 'Assets', 'asset', true, 'System Root Asset Account'),
('1100', 'Cash & Bank', 'asset', false, 'Liquid holdings'),
('1200', 'Accounts Receivable', 'asset', true, 'Student fees owed to school'),
('1110', 'Main Cash Account', 'asset', false, 'Physical cash on hand')
ON CONFLICT (code) DO NOTHING;

-- Set parents for assets
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '1000') WHERE code IN ('1100', '1200');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '1100') WHERE code = '1110';

-- LIABILITIES (2000)
INSERT INTO accounts (code, name, type, is_system, description) VALUES
('2000', 'Liabilities', 'liability', true, 'School obligations'),
('2100', 'Accounts Payable', 'liability', true, 'Owed to vendors'),
('2200', 'Unearned Revenue', 'liability', false, 'Fees paid in advance')
ON CONFLICT (code) DO NOTHING;

UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '2000') WHERE code IN ('2100', '2200');

-- EQUITY (3000)
INSERT INTO accounts (code, name, type, is_system, description) VALUES
('3000', 'Equity', 'equity', true, 'School ownership interest'),
('3100', 'Retained Earnings', 'equity', true, 'Cumulative profit/loss')
ON CONFLICT (code) DO NOTHING;

UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '3000') WHERE code = '3100';

-- INCOME (4000)
INSERT INTO accounts (code, name, type, is_system, description) VALUES
('4000', 'Income', 'income', true, 'Revenue sources'),
('4100', 'Tuition Fee Income', 'income', false, 'Earnings from tuition'),
('4200', 'Other Fee Income', 'income', false, 'Registration, transport, etc.')
ON CONFLICT (code) DO NOTHING;

UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '4000') WHERE code IN ('4100', '4200');

-- EXPENSES (5000)
INSERT INTO accounts (code, name, type, is_system, description) VALUES
('5000', 'Expenses', 'expense', true, 'Operating costs'),
('5100', 'Salaries & Wages', 'expense', false, 'Staff payroll'),
('5200', 'Utilities', 'expense', false, 'Electricity, water, etc.'),
('5300', 'Maintenance', 'expense', false, 'Building and equipment repairs')
ON CONFLICT (code) DO NOTHING;

UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '5000') WHERE code IN ('5100', '5200', '5300');

-- 4. Default Fee Categories
INSERT INTO fee_categories (name, account_id, description)
VALUES 
    ('Tuition Fee', (SELECT id FROM accounts WHERE code = '4100'), 'Standard academic tuition'),
    ('Registration Fee', (SELECT id FROM accounts WHERE code = '4200'), 'One-time admission fee'),
    ('Transport Fee', (SELECT id FROM accounts WHERE code = '4200'), 'School bus service')
ON CONFLICT (name) DO NOTHING;

COMMIT;
