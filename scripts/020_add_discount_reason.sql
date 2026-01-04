-- Fix missing discount_reason in student_fees
-- This column is required for Bulk Fee Assignment implementation

BEGIN;

ALTER TABLE student_fees 
ADD COLUMN IF NOT EXISTS discount_reason TEXT;

-- Ensure discount_amount exists as well
ALTER TABLE student_fees 
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(15, 2) DEFAULT 0;

COMMIT;
