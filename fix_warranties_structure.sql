-- ==============================================================================
-- FIX WARRANTIES DATA STRUCTURE
-- ==============================================================================
-- This script ensures the warranties data is properly structured

-- First, let's see what we have
SELECT 'Current data structure check:' as info;

SELECT 
    p.id,
    p.product_name,
    CASE 
        WHEN p.warranties IS NULL THEN 'NULL'
        WHEN p.warranties = '[]' THEN 'Empty array'
        ELSE 'Has data: ' || p.warranties::text
    END as warranties_status,
    COUNT(w.id) as warranty_count
FROM products p
LEFT JOIN warranties w ON w.product_id = p.id
WHERE p.user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca'
GROUP BY p.id, p.product_name, p.warranties
LIMIT 10;

-- Now let's fix the structure by updating the products table
-- to ensure warranties field is properly populated

-- Update products to have empty array for warranties if null
UPDATE products 
SET warranties = '[]'::jsonb
WHERE user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca' 
AND warranties IS NULL;

-- Verify the fix
SELECT 'After fix - checking structure:' as info;

SELECT 
    p.id,
    p.product_name,
    CASE 
        WHEN p.warranties IS NULL THEN 'NULL'
        WHEN p.warranties = '[]' THEN 'Empty array'
        ELSE 'Has data: ' || p.warranties::text
    END as warranties_status,
    COUNT(w.id) as warranty_count
FROM products p
LEFT JOIN warranties w ON w.product_id = p.id
WHERE p.user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca'
GROUP BY p.id, p.product_name, p.warranties
LIMIT 10;
