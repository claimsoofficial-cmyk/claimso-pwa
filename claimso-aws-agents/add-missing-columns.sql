-- ==============================================================================
-- ADD MISSING COLUMNS TO EXISTING PRODUCTS TABLE
-- ==============================================================================
-- This script adds the missing columns that the AWS agents need

-- Add missing columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS retailer TEXT,
ADD COLUMN IF NOT EXISTS order_number TEXT,
ADD COLUMN IF NOT EXISTS warranty_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS market_value DECIMAL(10,2);

-- Verify the changes
SELECT 
    'Added columns' as check_type,
    column_name || ' (' || data_type || ')' as result
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('name', 'description', 'retailer', 'order_number', 'warranty_info', 'market_value')
ORDER BY column_name;

-- Show all columns in products table after changes
SELECT 
    'All columns in products table' as check_type,
    column_name || ' (' || data_type || ')' as result
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;
