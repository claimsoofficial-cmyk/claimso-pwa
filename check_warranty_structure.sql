-- ==============================================================================
-- CHECK WARRANTY STRUCTURE
-- ==============================================================================
-- This script checks the actual warranty data structure

-- Check warranty data structure
SELECT 'Warranty structure check:' as check_type;

SELECT 
    w.id,
    w.product_id,
    w.warranty_type,
    w.warranty_start_date,
    w.warranty_end_date,
    w.warranty_duration_months,
    w.coverage_details,
    w.claim_process,
    w.contact_info,
    w.snapshot_data,
    w.ai_confidence_score,
    w.last_analyzed_at,
    p.product_name
FROM warranties w
JOIN products p ON w.product_id = p.id
WHERE w.user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca'
LIMIT 5;

-- Check for any warranty objects that might be malformed
SELECT 'Checking for malformed warranties:' as check_type;

SELECT 
    COUNT(*)::TEXT as count,
    'warranties with null warranty_end_date' as issue
FROM warranties w
WHERE w.user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca' 
AND w.warranty_end_date IS NULL

UNION ALL

SELECT 
    COUNT(*)::TEXT as count,
    'warranties with null warranty_start_date' as issue
FROM warranties w
WHERE w.user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca' 
AND w.warranty_start_date IS NULL

UNION ALL

SELECT 
    COUNT(*)::TEXT as count,
    'warranties with null warranty_duration_months' as issue
FROM warranties w
WHERE w.user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca' 
AND w.warranty_duration_months IS NULL;

-- Test the exact query the application uses
SELECT 'Testing application query:' as check_type;

-- Simulate the exact query the application uses
SELECT 
    p.id,
    p.product_name,
    p.brand,
    p.category,
    p.purchase_price,
    p.condition,
    p.purchase_date,
    p.serial_number,
    p.notes,
    p.created_at,
    p.updated_at,
    p.user_id,
    p.is_archived,
    p.payment_method,
    p.purchase_location,
    p.retailer_url,
    p.affiliate_id,
    w.id as warranty_id,
    w.warranty_start_date,
    w.warranty_end_date,
    w.warranty_duration_months,
    w.warranty_type,
    w.coverage_details,
    w.claim_process,
    w.contact_info,
    w.snapshot_data,
    w.ai_confidence_score,
    w.last_analyzed_at
FROM products p
LEFT JOIN warranties w ON w.product_id = p.id
WHERE p.user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca'
AND p.is_archived = false
ORDER BY p.created_at DESC
LIMIT 3;
