-- COMPREHENSIVE FIX FOR ACCOUNTING SETUP
-- Ensures all required system accounts and bank accounts exist with correct GL links.

BEGIN;

-- 1. Ensure Top-Level Asset Category exists
INSERT INTO accounts (code, name, type, is_system, description)
VALUES ('1000', 'Assets', 'asset', true, 'System Assets')
ON CONFLICT (code) DO NOTHING;

-- 2. Ensure Cash & Bank Parent exists
INSERT INTO accounts (code, name, type, is_system, parent_id)
VALUES ('1100', 'Cash & Bank', 'asset', true, (SELECT id FROM accounts WHERE code = '1000'))
ON CONFLICT (code) DO NOTHING;

-- 3. Ensure Receivable Parent exists
INSERT INTO accounts (code, name, type, is_system, parent_id)
VALUES ('1200', 'Accounts Receivable', 'asset', true, (SELECT id FROM accounts WHERE code = '1000'))
ON CONFLICT (code) DO NOTHING;

-- 4. Ensure Main Cash (Code 1110) exists
INSERT INTO accounts (code, name, type, is_system, parent_id, description)
VALUES ('1110', 'Main Cash Account', 'asset', true, (SELECT id FROM accounts WHERE code = '1100'), 'Primary cash collection account')
ON CONFLICT (code) DO UPDATE SET is_system = true, parent_id = EXCLUDED.parent_id;

-- 5. Ensure Income Category & Student Fees exists
INSERT INTO accounts (code, name, type, is_system, description)
VALUES ('4000', 'Income', 'income', true, 'School Income Categories')
ON CONFLICT (code) DO NOTHING;

INSERT INTO accounts (code, name, type, is_system, parent_id, description)
VALUES ('4100', 'Tuition Fee Income', 'income', true, (SELECT id FROM accounts WHERE code = '4000'), 'Standard fee revenue')
ON CONFLICT (code) DO UPDATE SET is_system = true;

-- 6. Ensure Bank Specific Accounts exist
INSERT INTO accounts (code, name, type, is_system, parent_id, description)
VALUES 
('1120', 'Premier Bank Account', 'asset', false, (SELECT id FROM accounts WHERE code = '1100'), 'School main bank account'),
('1130', 'EVC Plus / Mobile Money', 'asset', false, (SELECT id FROM accounts WHERE code = '1100'), 'Mobile money collection account')
ON CONFLICT (code) DO UPDATE SET parent_id = EXCLUDED.parent_id;

-- 7. Sync bank_accounts table with GL accounts
-- First, clear duplicates or stale mappings if any (optional based on your state)
DELETE FROM bank_accounts;

INSERT INTO bank_accounts (account_name, account_no, bank_name, gl_account_id, is_active)
VALUES 
('Main School Account', '123456789', 'Premier Bank', (SELECT id FROM accounts WHERE code = '1120'), true),
('Mobile Collection', '061XXXXXXX', 'EVC Plus', (SELECT id FROM accounts WHERE code = '1130'), true);

COMMIT;
