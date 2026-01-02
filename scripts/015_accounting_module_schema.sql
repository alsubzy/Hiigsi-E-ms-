-- ACCOUNTING MODULE SCHEMA
-- Production-ready double-entry system

BEGIN;

-- 1. Academic Years & Terms
CREATE TABLE IF NOT EXISTS academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE, -- e.g. "2025-2026"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS terms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. "Term 1"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(academic_year_id, name)
);

-- 2. Chart of Accounts (COA)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL, -- e.g. "1000", "1100"
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'income', 'expense')),
    parent_id UUID REFERENCES accounts(id),
    is_system BOOLEAN DEFAULT false, -- System accounts cannot be deleted (e.g. Accounts Receivable)
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Transactions & General Ledger
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    reference_no TEXT, -- e.g. Invoice #, Receipt #
    type TEXT NOT NULL, -- e.g. 'fee_assignment', 'payment', 'expense', 'manual', 'other_income'
    academic_year_id UUID REFERENCES academic_years(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id),
    debit DECIMAL(15, 2) DEFAULT 0 CHECK (debit >= 0),
    credit DECIMAL(15, 2) DEFAULT 0 CHECK (credit >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (NOT (debit > 0 AND credit > 0)), -- Cannot have both on one line
    CHECK (debit > 0 OR credit > 0) -- Must have one
);

-- 4. Fee Management
CREATE TABLE IF NOT EXISTS fee_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE, -- e.g. "Tuition", "Transport"
    account_id UUID REFERENCES accounts(id), -- Linked income account
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fee_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fee_category_id UUID REFERENCES fee_categories(id),
    academic_year_id UUID REFERENCES academic_years(id),
    term_id UUID REFERENCES terms(id),
    grade TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    is_mandatory BOOLEAN DEFAULT true,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(fee_category_id, academic_year_id, grade, term_id)
);

CREATE TABLE IF NOT EXISTS student_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    fee_structure_id UUID REFERENCES fee_structures(id),
    amount DECIMAL(15, 2) NOT NULL,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    late_fee_amount DECIMAL(15, 2) DEFAULT 0,
    net_amount DECIMAL(15, 2) GENERATED ALWAYS AS (amount - discount_amount + late_fee_amount) STORED,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'cancelled')),
    academic_year_id UUID REFERENCES academic_years(id),
    term_id UUID REFERENCES terms(id),
    discount_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_no TEXT UNIQUE NOT NULL,
    student_id UUID NOT NULL REFERENCES students(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    total_amount DECIMAL(15, 2) NOT NULL,
    paid_amount DECIMAL(15, 2) DEFAULT 0,
    balance_amount DECIMAL(15, 2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    status TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid', 'overdue', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link student fees to invoices
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    student_fee_id UUID REFERENCES student_fees(id),
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT
);

-- 6. Bank & Cash
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_name TEXT NOT NULL,
    account_no TEXT,
    bank_name TEXT,
    branch TEXT,
    gl_account_id UUID REFERENCES accounts(id), -- Ledger link
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Payments & Receipts
CREATE TABLE IF NOT EXISTS accounting_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_no TEXT UNIQUE NOT NULL,
    invoice_id UUID REFERENCES invoices(id),
    student_id UUID REFERENCES students(id),
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL, -- 'cash', 'bank', 'mobile_money'
    bank_account_id UUID REFERENCES bank_accounts(id),
    reference_no TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_no TEXT UNIQUE NOT NULL,
    account_id UUID REFERENCES accounts(id), -- Expense GL account
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    vendor TEXT,
    payment_method TEXT NOT NULL,
    bank_account_id UUID REFERENCES bank_accounts(id),
    description TEXT,
    status TEXT DEFAULT 'paid' CHECK (status IN ('pending', 'paid', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Other Income (Non-student revenue)
CREATE TABLE IF NOT EXISTS other_incomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    income_no TEXT UNIQUE NOT NULL,
    account_id UUID REFERENCES accounts(id), -- Income GL account
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    source TEXT, -- e.g "Donation", "Registration Fee"
    payment_method TEXT NOT NULL,
    bank_account_id UUID REFERENCES bank_accounts(id),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_journal_entries_account ON journal_entries(account_id);
CREATE INDEX idx_journal_entries_transaction ON journal_entries(transaction_id);
CREATE INDEX idx_student_fees_student ON student_fees(student_id);
CREATE INDEX idx_invoices_student ON invoices(student_id);
CREATE INDEX idx_payments_invoice ON accounting_payments(invoice_id);
CREATE INDEX idx_transactions_date ON transactions(date);

COMMIT;
