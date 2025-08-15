-- ==============================================================================
-- CLEANUP TEST DATA
-- ==============================================================================
-- This script removes test data and keeps only real user products

-- Show what we're about to delete
SELECT 
    'Products to be deleted' as action,
    user_id || ' - ' || COUNT(*) || ' products' as details
FROM products 
WHERE user_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
GROUP BY user_id;

-- Show real user products that will be kept
SELECT 
    'Real user products to keep' as action,
    user_id || ' - ' || COUNT(*) || ' products' as details
FROM products 
WHERE user_id NOT IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
GROUP BY user_id;

-- Delete test data
DELETE FROM products 
WHERE user_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

-- Verify cleanup
SELECT 
    'After cleanup' as status,
    user_id || ' - ' || COUNT(*) || ' products' as details
FROM products 
GROUP BY user_id
ORDER BY COUNT(*) DESC;
