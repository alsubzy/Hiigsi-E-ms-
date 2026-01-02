-- AUTOMATIC LEDGER POSTING TRIGGERS
-- Ensures every financial event is reflected in the General Ledger automatically.

BEGIN;

-- 1. Function to handle Fee Invoicing Postings
CREATE OR REPLACE FUNCTION public.fn_post_invoice_to_ledger()
RETURNS TRIGGER AS $$
DECLARE
    rec_account_id UUID;
    inc_account_id UUID;
    ay_id UUID;
BEGIN
    -- Get system accounts
    SELECT id INTO rec_account_id FROM accounts WHERE code = '1200' LIMIT 1; -- Accounts Receivable
    SELECT id INTO inc_account_id FROM accounts WHERE code = '4100' LIMIT 1; -- Tuition Income (Generic)
    
    -- Get current academic year
    SELECT academic_year_id INTO ay_id FROM terms WHERE is_current = true LIMIT 1;

    -- Create Transaction
    INSERT INTO transactions (description, type, reference_no, date, academic_year_id)
    VALUES ('Invoicing for ' || NEW.invoice_no, 'fee_assignment', NEW.invoice_no, NEW.date, ay_id)
    RETURNING id INTO ay_id; -- Reusing variable for tx_id

    -- Debit: Accounts Receivable
    INSERT INTO journal_entries (transaction_id, account_id, debit, credit, notes)
    VALUES (ay_id, rec_account_id, NEW.total_amount, 0, 'Invoice Accrual');

    -- Credit: Income
    INSERT INTO journal_entries (transaction_id, account_id, debit, credit, notes)
    VALUES (ay_id, inc_account_id, 0, NEW.total_amount, 'Standard Fee Income');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function to handle Payment Postings
CREATE OR REPLACE FUNCTION public.fn_post_payment_to_ledger()
RETURNS TRIGGER AS $$
DECLARE
    rec_account_id UUID;
    bank_gl_id UUID;
    cash_gl_id UUID;
    debit_account_id UUID;
    ay_id UUID;
BEGIN
    -- Get system accounts
    SELECT id INTO rec_account_id FROM accounts WHERE code = '1200' LIMIT 1; -- Accounts Receivable
    SELECT id INTO cash_gl_id FROM accounts WHERE code = '1110' LIMIT 1; -- Main Cash
    
    -- Determine Debit Account (Bank or Cash)
    IF NEW.bank_account_id IS NOT NULL THEN
        SELECT gl_account_id INTO bank_gl_id FROM bank_accounts WHERE id = NEW.bank_account_id;
        debit_account_id := bank_gl_id;
    ELSE
        debit_account_id := cash_gl_id;
    END IF;

    -- Get current academic year
    SELECT academic_year_id INTO ay_id FROM terms WHERE is_current = true LIMIT 1;

    -- Create Transaction
    INSERT INTO transactions (description, type, reference_no, date, academic_year_id)
    VALUES ('Payment received: ' || NEW.payment_no, 'payment', NEW.payment_no, NEW.payment_date, ay_id)
    RETURNING id INTO ay_id; -- Reusing variable for tx_id

    -- Debit: Bank/Cash
    INSERT INTO journal_entries (transaction_id, account_id, debit, credit, notes)
    VALUES (ay_id, debit_account_id, NEW.amount, 0, 'Payment Collection');

    -- Credit: Accounts Receivable
    INSERT INTO journal_entries (transaction_id, account_id, debit, credit, notes)
    VALUES (ay_id, rec_account_id, 0, NEW.amount, 'Settlement of Receivable');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function to handle Expense Postings
CREATE OR REPLACE FUNCTION public.fn_post_expense_to_ledger()
RETURNS TRIGGER AS $$
DECLARE
    bank_gl_id UUID;
    cash_gl_id UUID;
    credit_account_id UUID;
    ay_id UUID;
BEGIN
    -- Get Main Cash as fallback
    SELECT id INTO cash_gl_id FROM accounts WHERE code = '1110' LIMIT 1;
    
    -- Determine Credit Account (Bank or Cash)
    IF NEW.bank_account_id IS NOT NULL THEN
        SELECT gl_account_id INTO bank_gl_id FROM bank_accounts WHERE id = NEW.bank_account_id;
        credit_account_id := bank_gl_id;
    ELSE
        credit_account_id := cash_gl_id;
    END IF;

    -- Get current academic year
    SELECT academic_year_id INTO ay_id FROM terms WHERE is_current = true LIMIT 1;

    -- Create Transaction
    INSERT INTO transactions (description, type, reference_no, date, academic_year_id)
    VALUES ('Expense recorded: ' || NEW.expense_no, 'expense', NEW.expense_no, NEW.date, ay_id)
    RETURNING id INTO ay_id; -- Reusing variable for tx_id

    -- Debit: Expense GL Account (From Record)
    INSERT INTO journal_entries (transaction_id, account_id, debit, credit, notes)
    VALUES (ay_id, NEW.account_id, NEW.amount, 0, NEW.description);

    -- Credit: Bank/Cash
    INSERT INTO journal_entries (transaction_id, account_id, debit, credit, notes)
    VALUES (ay_id, credit_account_id, 0, NEW.amount, 'Cash/Bank Outflow');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Apply Triggers
DROP TRIGGER IF EXISTS trg_post_invoice_ledger ON invoices;
CREATE TRIGGER trg_post_invoice_ledger AFTER INSERT ON invoices FOR EACH ROW EXECUTE FUNCTION public.fn_post_invoice_to_ledger();

DROP TRIGGER IF EXISTS trg_post_payment_ledger ON accounting_payments;
CREATE TRIGGER trg_post_payment_ledger AFTER INSERT ON accounting_payments FOR EACH ROW EXECUTE FUNCTION public.fn_post_payment_to_ledger();

DROP TRIGGER IF EXISTS trg_post_expense_ledger ON expenses;
CREATE TRIGGER trg_post_expense_ledger AFTER INSERT ON expenses FOR EACH ROW EXECUTE FUNCTION public.fn_post_expense_to_ledger();

COMMIT;
