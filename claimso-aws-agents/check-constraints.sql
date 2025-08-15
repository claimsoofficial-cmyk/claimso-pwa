-- ==============================================================================
-- CHECK TABLE CONSTRAINTS
-- ==============================================================================
-- This script checks what constraints exist on the products table

-- Check all constraints on products table
SELECT 
    'constraint check' as check_type,
    conname || ' (' || contype || ')' as result
FROM pg_constraint 
WHERE conrelid = 'products'::regclass;

-- Check check constraints specifically
SELECT 
    'check constraint' as check_type,
    conname || ': ' || pg_get_constraintdef(oid) as result
FROM pg_constraint 
WHERE conrelid = 'products'::regclass 
AND contype = 'c';

-- Check what values are allowed for condition column
SELECT 
    'condition values' as check_type,
    'Check constraint: ' || pg_get_constraintdef(oid) as result
FROM pg_constraint 
WHERE conrelid = 'products'::regclass 
AND contype = 'c' 
AND conname LIKE '%condition%';
