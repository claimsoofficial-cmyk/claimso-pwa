-- ==============================================================================
-- DIAGNOSE DATA STRUCTURE
-- ==============================================================================
-- This script checks the actual data structure to identify the issue

-- Check if products exist
SELECT 'Products count:' as check_type, COUNT(*)::TEXT as result 
FROM products 
WHERE user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca';

-- Check if warranties exist
SELECT 'Warranties count:' as check_type, COUNT(*)::TEXT as result 
FROM warranties 
WHERE user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca';

-- Check warranty structure
SELECT 'Warranty structure check:' as check_type, 
       CASE 
           WHEN snapshot_data IS NULL THEN 'Missing snapshot_data'
           WHEN ai_confidence_score IS NULL THEN 'Missing ai_confidence_score'
           WHEN last_analyzed_at IS NULL THEN 'Missing last_analyzed_at'
           ELSE 'Complete warranty data'
       END as result
FROM warranties 
WHERE user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca'
LIMIT 5;

-- Test the exact query the application uses
SELECT 'Testing application query:' as check_type;

WITH product_data AS (
    SELECT 
        p.*,
        COALESCE(
            (SELECT json_agg(w.*) 
             FROM warranties w 
             WHERE w.product_id = p.id), 
            '[]'::json
        ) as warranties
    FROM products p
    WHERE p.user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca'
    LIMIT 3
)
SELECT 
    id,
    product_name,
    CASE 
        WHEN warranties::text = '[]' THEN 'Empty array'
        WHEN warranties IS NULL THEN 'NULL'
        ELSE 'Has warranties: ' || json_array_length(warranties)::TEXT
    END as warranties_status
FROM product_data;

-- Check for any malformed warranty data
SELECT 'Checking for malformed warranties:' as check_type;

SELECT 
    w.id,
    w.product_id,
    CASE 
        WHEN w.snapshot_data IS NULL THEN 'Missing snapshot_data'
        WHEN w.ai_confidence_score IS NULL THEN 'Missing ai_confidence_score'
        WHEN w.last_analyzed_at IS NULL THEN 'Missing last_analyzed_at'
        ELSE 'OK'
    END as issue
FROM warranties w
WHERE w.user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca'
AND (
    w.snapshot_data IS NULL OR 
    w.ai_confidence_score IS NULL OR 
    w.last_analyzed_at IS NULL
)
LIMIT 10;
