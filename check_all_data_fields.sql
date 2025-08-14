-- ==============================================================================
-- CHECK ALL DATA FIELDS
-- ==============================================================================
-- This script checks all data fields that might be causing the find() error

-- Check if documents table exists and has data
SELECT 'Documents table check:' as check_type;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') 
        THEN 'Documents table exists'
        ELSE 'Documents table does not exist'
    END as result;

-- If documents table exists, check for documents
SELECT 'Documents count:' as check_type, 
       CASE 
           WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents')
           THEN (SELECT COUNT(*)::TEXT FROM documents WHERE user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca')
           ELSE 'N/A'
       END as result;

-- Check if any products have documents
SELECT 'Products with documents:' as check_type,
       CASE 
           WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents')
           THEN (SELECT COUNT(DISTINCT p.id)::TEXT 
                 FROM products p 
                 WHERE p.user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca'
                 AND EXISTS (SELECT 1 FROM documents d WHERE d.product_id = p.id))
           ELSE 'N/A'
       END as result;

-- Check maintenance_records
SELECT 'Maintenance records count:' as check_type, COUNT(*)::TEXT as result
FROM maintenance_records mr
JOIN products p ON mr.product_id = p.id
WHERE p.user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca';

-- Check user_connections
SELECT 'User connections count:' as check_type, COUNT(*)::TEXT as result
FROM user_connections
WHERE user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca';

-- Check if any products have null or problematic fields
SELECT 'Products with null fields:' as check_type;
SELECT 
    COUNT(*)::TEXT as count,
    'products with null brand' as field
FROM products 
WHERE user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca' AND brand IS NULL

UNION ALL

SELECT 
    COUNT(*)::TEXT as count,
    'products with null category' as field
FROM products 
WHERE user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca' AND category IS NULL

UNION ALL

SELECT 
    COUNT(*)::TEXT as count,
    'products with null purchase_price' as field
FROM products 
WHERE user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca' AND purchase_price IS NULL;

-- Check warranty data structure
SELECT 'Warranty data structure check:' as check_type;
SELECT 
    COUNT(*)::TEXT as count,
    'warranties with null snapshot_data' as issue
FROM warranties 
WHERE user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca' AND snapshot_data IS NULL

UNION ALL

SELECT 
    COUNT(*)::TEXT as count,
    'warranties with null ai_confidence_score' as issue
FROM warranties 
WHERE user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca' AND ai_confidence_score IS NULL

UNION ALL

SELECT 
    COUNT(*)::TEXT as count,
    'warranties with null last_analyzed_at' as issue
FROM warranties 
WHERE user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca' AND last_analyzed_at IS NULL;

-- Test the exact query structure the application uses
SELECT 'Testing application query structure:' as check_type;

-- Simulate what the application query returns
WITH test_query AS (
    SELECT 
        p.*,
        COALESCE(
            (SELECT json_agg(w.*) 
             FROM warranties w 
             WHERE w.product_id = p.id), 
            '[]'::json
        ) as warranties,
        COALESCE(
            (SELECT json_agg(d.*) 
             FROM documents d 
             WHERE d.product_id = p.id), 
            '[]'::json
        ) as documents
    FROM products p
    WHERE p.user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca'
    LIMIT 3
)
SELECT 
    id,
    product_name,
    CASE 
        WHEN warranties::text = '[]' THEN 'Empty warranties array'
        WHEN warranties IS NULL THEN 'NULL warranties'
        ELSE 'Has warranties: ' || json_array_length(warranties)::TEXT
    END as warranties_status,
    CASE 
        WHEN documents::text = '[]' THEN 'Empty documents array'
        WHEN documents IS NULL THEN 'NULL documents'
        ELSE 'Has documents: ' || json_array_length(documents)::TEXT
    END as documents_status
FROM test_query;
