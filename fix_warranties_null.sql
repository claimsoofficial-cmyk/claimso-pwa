-- ==============================================================================
-- FIX WARRANTIES NULL ISSUE
-- ==============================================================================
-- This script fixes the issue where products without warranties return null

-- First, let's see the current situation
SELECT 'Current situation:' as info;
SELECT 
    'Products with warranties:' as type, COUNT(*)::TEXT as count
FROM products p
WHERE p.user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca'
AND EXISTS (SELECT 1 FROM warranties w WHERE w.product_id = p.id)

UNION ALL

SELECT 
    'Products without warranties:' as type, COUNT(*)::TEXT as count
FROM products p
WHERE p.user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca'
AND NOT EXISTS (SELECT 1 FROM warranties w WHERE w.product_id = p.id);

-- Now let's add empty warranties for products that don't have any
-- This ensures every product has at least an empty warranty array

INSERT INTO warranties (
    id,
    product_id,
    user_id,
    warranty_start_date,
    warranty_end_date,
    warranty_duration_months,
    warranty_type,
    coverage_details,
    claim_process,
    contact_info,
    snapshot_data,
    ai_confidence_score,
    last_analyzed_at,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    p.id,
    p.user_id,
    p.purchase_date,
    p.purchase_date + INTERVAL '1 day',
    0,
    'store',
    'No warranty coverage available',
    'No warranty process available',
    'No contact info available',
    '{"covers": [], "does_not_cover": [], "key_terms": [], "claim_requirements": []}'::jsonb,
    0.0,
    NOW(),
    NOW(),
    NOW()
FROM products p
WHERE p.user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca'
AND NOT EXISTS (
    SELECT 1 FROM warranties w WHERE w.product_id = p.id
);

-- Verify the fix
SELECT 'After fix:' as info;
SELECT 
    'Products with warranties:' as type, COUNT(*)::TEXT as count
FROM products p
WHERE p.user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca'
AND EXISTS (SELECT 1 FROM warranties w WHERE w.product_id = p.id)

UNION ALL

SELECT 
    'Products without warranties:' as type, COUNT(*)::TEXT as count
FROM products p
WHERE p.user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca'
AND NOT EXISTS (SELECT 1 FROM warranties w WHERE w.product_id = p.id);

-- Show total warranties now
SELECT 'Total warranties:' as type, COUNT(*)::TEXT as count
FROM warranties 
WHERE user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca';
