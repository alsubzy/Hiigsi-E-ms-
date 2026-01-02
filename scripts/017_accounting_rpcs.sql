-- ACCOUNTING RPC FUNCTIONS
-- Used by the frontend/backend for real-time stats and reports

BEGIN;

-- 1. Get Trial Balance
CREATE OR REPLACE FUNCTION get_trial_balance()
RETURNS TABLE (
    account_id UUID,
    account_code TEXT,
    account_name TEXT,
    account_type TEXT,
    total_debit DECIMAL(15, 2),
    total_credit DECIMAL(15, 2),
    balance DECIMAL(15, 2)
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.code,
        a.name,
        a.type,
        COALESCE(SUM(je.debit), 0) as total_debit,
        COALESCE(SUM(je.credit), 0) as total_credit,
        CASE 
            WHEN a.type IN ('asset', 'expense') THEN COALESCE(SUM(je.debit), 0) - COALESCE(SUM(je.credit), 0)
            ELSE COALESCE(SUM(je.credit), 0) - COALESCE(SUM(je.debit), 0)
        END as balance
    FROM accounts a
    LEFT JOIN journal_entries je ON a.id = je.account_id
    GROUP BY a.id, a.code, a.name, a.type
    ORDER BY a.code;
END;
$$;

-- 2. Get Total Revenue (Current Month)
CREATE OR REPLACE FUNCTION get_total_revenue()
RETURNS DECIMAL(15, 2) LANGUAGE plpgsql AS $$
DECLARE
    total_rev DECIMAL(15, 2);
BEGIN
    SELECT COALESCE(SUM(credit) - SUM(debit), 0) INTO total_rev
    FROM journal_entries je
    JOIN accounts a ON je.account_id = a.id
    JOIN transactions t ON je.transaction_id = t.id
    WHERE a.type = 'income'
    AND t.date >= date_trunc('month', CURRENT_DATE);
    
    RETURN total_rev;
END;
$$;

-- 3. Get Total Receivables
CREATE OR REPLACE FUNCTION get_total_receivables()
RETURNS DECIMAL(15, 2) LANGUAGE plpgsql AS $$
DECLARE
    total_rec DECIMAL(15, 2);
BEGIN
    -- Code 1200 is Accounts Receivable
    SELECT COALESCE(SUM(debit) - SUM(credit), 0) INTO total_rec
    FROM journal_entries je
    JOIN accounts a ON je.account_id = a.id
    WHERE a.code = '1200';
    
    RETURN total_rec;
END;
$$;

-- 4. Get Cash/Bank Balance
CREATE OR REPLACE FUNCTION get_cash_balance()
RETURNS DECIMAL(15, 2) LANGUAGE plpgsql AS $$
DECLARE
    total_cash DECIMAL(15, 2);
BEGIN
    -- Type 'asset' and code starting with 11 (Cash/Bank)
    SELECT COALESCE(SUM(debit) - SUM(credit), 0) INTO total_cash
    FROM journal_entries je
    JOIN accounts a ON je.account_id = a.id
    WHERE a.type = 'asset' AND a.code LIKE '11%';
    
    RETURN total_cash;
END;
$$;

COMMIT;
