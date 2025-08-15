-- ==============================================================================
-- ADD SOURCE COLUMN TO PRODUCTS TABLE
-- ==============================================================================
-- This script adds a source column to track where products were captured from

-- Add source column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'unknown';

-- Add check constraint for valid sources
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_source_check;

ALTER TABLE products 
ADD CONSTRAINT products_source_check 
CHECK (source IN ('email', 'browser', 'mobile', 'bank', 'manual', 'unknown'));

-- Update existing products to have proper source
UPDATE products 
SET source = 'unknown' 
WHERE source IS NULL;

-- Verify the changes
SELECT 
    'Added source column' as check_type,
    column_name || ' (' || data_type || ')' as result
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'source';

-- Show sample of products with sources
SELECT 
    'Sample products with sources' as check_type,
    product_name || ' - Source: ' || source as result
FROM products 
ORDER BY created_at DESC 
LIMIT 5;
