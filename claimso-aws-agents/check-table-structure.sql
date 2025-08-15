-- ==============================================================================
-- CHECK EXISTING TABLE STRUCTURE
-- ==============================================================================
-- This script checks what columns actually exist in the products table

-- Check if products table exists
SELECT 
    'products table exists' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') 
        THEN 'YES' 
        ELSE 'NO' 
    END as result;

-- Show all columns in products table
SELECT 
    'products table columns' as check_type,
    column_name || ' (' || data_type || ')' as result
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- Check if specific columns exist
SELECT 
    'column check' as check_type,
    column_name || ': ' || 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = c.column_name
        ) 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as result
FROM (VALUES 
    ('user_id'),
    ('name'),
    ('description'),
    ('purchase_date'),
    ('purchase_price'),
    ('retailer'),
    ('order_number'),
    ('warranty_info'),
    ('market_value')
) AS c(column_name);
