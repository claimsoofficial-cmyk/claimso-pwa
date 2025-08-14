-- ==============================================================================
-- CLAIMSO DATABASE MIGRATION SCRIPT
-- ==============================================================================
-- This script adds missing columns to the products table
-- Run this BEFORE running the sample_data.sql script

-- Add missing columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS purchase_location TEXT,
ADD COLUMN IF NOT EXISTS retailer_url TEXT,
ADD COLUMN IF NOT EXISTS affiliate_id TEXT;

-- Create maintenance_records table if it doesn't exist
CREATE TABLE IF NOT EXISTS maintenance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    service_type TEXT NOT NULL CHECK (service_type IN ('routine', 'repair', 'upgrade', 'cleaning', 'inspection')),
    provider_name TEXT NOT NULL,
    provider_contact TEXT,
    cost DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    description TEXT NOT NULL,
    next_service_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_connections table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    retailer TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'connected',
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, retailer)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_payment_method ON products(payment_method);
CREATE INDEX IF NOT EXISTS idx_products_purchase_location ON products(purchase_location);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_product_id ON maintenance_records(product_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_service_date ON maintenance_records(service_date);
CREATE INDEX IF NOT EXISTS idx_user_connections_user_id ON user_connections(user_id);

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('payment_method', 'purchase_location', 'retailer_url', 'affiliate_id')
ORDER BY column_name;

-- Show table structure
\d products;
