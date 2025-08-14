-- ==============================================================================
-- DEBUG DASHBOARD ISSUES
-- ==============================================================================
-- This script helps debug what might be causing the dashboard to fail

-- Check if the user exists
SELECT 
    'User exists' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE id = '5cbd0756-963e-4777-96d7-629edf66e0ca'::UUID) 
        THEN 'YES' 
        ELSE 'NO' 
    END as result;

-- Check if profile exists
SELECT 
    'Profile exists' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM profiles WHERE id = '5cbd0756-963e-4777-96d7-629edf66e0ca'::UUID) 
        THEN 'YES' 
        ELSE 'NO' 
    END as result;

-- Check products count
SELECT 
    'Products count' as check_type,
    COUNT(*)::TEXT as result
FROM products 
WHERE user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca'::UUID;

-- Check warranties count
SELECT 
    'Warranties count' as check_type,
    COUNT(*)::TEXT as result
FROM warranties 
WHERE user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca'::UUID;

-- Check user connections count
SELECT 
    'User connections count' as check_type,
    COUNT(*)::TEXT as result
FROM user_connections 
WHERE user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca'::UUID;

-- Check maintenance records count
SELECT 
    'Maintenance records count' as check_type,
    COUNT(*)::TEXT as result
FROM maintenance_records mr
JOIN products p ON mr.product_id = p.id
WHERE p.user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca'::UUID;

-- Show sample products
SELECT 
    'Sample products' as check_type,
    product_name || ' - ' || brand as result
FROM products 
WHERE user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca'::UUID
LIMIT 5;

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
