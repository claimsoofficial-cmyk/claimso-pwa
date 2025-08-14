-- ==============================================================================
-- SIMPLE DIAGNOSTIC SCRIPT
-- ==============================================================================
-- This script checks the data structure without complex type operations

-- Check if products exist
SELECT 'Products count:' as check_type, COUNT(*)::TEXT as result 
FROM products 
WHERE user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca';

-- Check if warranties exist
SELECT 'Warranties count:' as check_type, COUNT(*)::TEXT as result 
FROM warranties 
WHERE user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca';

-- Check warranty structure - look for missing fields
SELECT 'Warranties with missing fields:' as check_type, COUNT(*)::TEXT as result
FROM warranties 
WHERE user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca'
AND (
    snapshot_data IS NULL OR 
    ai_confidence_score IS NULL OR 
    last_analyzed_at IS NULL
);

-- Show sample warranty data
SELECT 'Sample warranty data:' as check_type, 
       id, 
       product_id,
       warranty_type,
       CASE 
           WHEN snapshot_data IS NULL THEN 'Missing snapshot_data'
           ELSE 'Has snapshot_data'
       END as snapshot_status,
       CASE 
           WHEN ai_confidence_score IS NULL THEN 'Missing ai_confidence_score'
           ELSE 'Has ai_confidence_score: ' || ai_confidence_score::TEXT
       END as ai_status,
       CASE 
           WHEN last_analyzed_at IS NULL THEN 'Missing last_analyzed_at'
           ELSE 'Has last_analyzed_at'
       END as analyzed_status
FROM warranties 
WHERE user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca'
LIMIT 5;

-- Check products with warranties
SELECT 'Products with warranties:' as check_type, COUNT(*)::TEXT as result
FROM products p
WHERE p.user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca'
AND EXISTS (
    SELECT 1 FROM warranties w WHERE w.product_id = p.id
);

-- Check products without warranties
SELECT 'Products without warranties:' as check_type, COUNT(*)::TEXT as result
FROM products p
WHERE p.user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca'
AND NOT EXISTS (
    SELECT 1 FROM warranties w WHERE w.product_id = p.id
);
