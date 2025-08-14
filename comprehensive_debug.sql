-- ==============================================================================
-- COMPREHENSIVE DEBUG SCRIPT
-- ==============================================================================
-- This script checks all tables and identifies potential issues

-- Check all tables that exist
SELECT 
    'All tables' as check_type,
    table_name as result
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if all required tables exist
SELECT 
    'Required tables check' as check_type,
    table_name || ': ' || 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t.table_name) 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as result
FROM (VALUES 
    ('products'),
    ('warranties'), 
    ('profiles'),
    ('user_connections'),
    ('maintenance_records'),
    ('documents')
) AS t(table_name);

-- Check warranties table structure
SELECT 
    'warranties table columns' as check_type,
    column_name || ' (' || data_type || ')' as result
FROM information_schema.columns 
WHERE table_name = 'warranties' 
ORDER BY ordinal_position;

-- Check if there are any products with warranties
SELECT 
    'Products with warranties' as check_type,
    COUNT(*)::TEXT as result
FROM products p
JOIN warranties w ON p.id = w.product_id
WHERE p.user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca'::UUID;

-- Check if there are any products without warranties
SELECT 
    'Products without warranties' as check_type,
    COUNT(*)::TEXT as result
FROM products p
LEFT JOIN warranties w ON p.id = w.product_id
WHERE p.user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca'::UUID
AND w.id IS NULL;

-- Check for any NULL values in critical fields
SELECT 
    'Products with NULL user_id' as check_type,
    COUNT(*)::TEXT as result
FROM products 
WHERE user_id IS NULL;

SELECT 
    'Warranties with NULL user_id' as check_type,
    COUNT(*)::TEXT as result
FROM warranties 
WHERE user_id IS NULL;

-- Check for any invalid warranty dates
SELECT 
    'Warranties with invalid dates' as check_type,
    COUNT(*)::TEXT as result
FROM warranties 
WHERE warranty_end_date IS NOT NULL 
AND warranty_end_date < warranty_start_date;

-- Test the exact query that LivingCard is trying to run
SELECT 
    'Test LivingCard query' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM products p
            LEFT JOIN warranties w ON p.id = w.product_id
            LEFT JOIN documents d ON p.id = d.product_id
            WHERE p.user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca'::UUID
            LIMIT 1
        ) THEN 'QUERY WORKS'
        ELSE 'QUERY FAILS'
    END as result;
