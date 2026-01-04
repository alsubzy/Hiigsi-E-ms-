-- Add default bank and cash accounts for payment collection
-- Link them to the appropriate GL accounts

BEGIN;

-- 1. Ensure GL Accounts exist for common payment destinations
INSERT INTO accounts (code, name, type, is_system, description) VALUES
('1120', 'Premier Bank Account', 'asset', false, 'School main bank account'),
('1130', 'EVC Plus / Mobile Money', 'asset', false, 'Mobile money collection account')
ON CONFLICT (code) DO NOTHING;

-- Set parents for these assets
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = '1100') WHERE code IN ('1120', '1130');

-- 2. Seed bank_accounts table
INSERT INTO bank_accounts (account_name, account_no, bank_name, gl_account_id, is_active)
VALUES 
('Main School Account', '123456789', 'Premier Bank', (SELECT id FROM accounts WHERE code = '1120'), true),
('Mobile Collection', '061XXXXXXX', 'EVC Plus', (SELECT id FROM accounts WHERE code = '1130'), true)
ON CONFLICT DO NOTHING;

-- 3. Also ensure a default 'Cash' GL account is clearly identifiable for the UI
-- (Already exists in 016 seed as 'Main Cash Account' code 1110)

COMMIT;
