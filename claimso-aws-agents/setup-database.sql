-- ==============================================================================
-- CLAIMSO AGENTS DATABASE SETUP
-- ==============================================================================
-- This script creates the required tables for the AWS agents to work

-- Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    purchase_date TIMESTAMP WITH TIME ZONE NOT NULL,
    purchase_price DECIMAL(10,2) NOT NULL,
    retailer TEXT NOT NULL,
    order_number TEXT,
    warranty_info JSONB DEFAULT '{}',
    market_value DECIMAL(10,2),
    payment_method TEXT,
    purchase_location TEXT,
    retailer_url TEXT,
    affiliate_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create warranties table if it doesn't exist
CREATE TABLE IF NOT EXISTS warranties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    warranty_type TEXT NOT NULL,
    provider TEXT NOT NULL,
    warranty_start_date DATE NOT NULL,
    warranty_end_date DATE,
    coverage_details JSONB DEFAULT '{}',
    claim_process TEXT,
    contact_info JSONB DEFAULT '{}',
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

-- Create documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    document_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_purchase_date ON products(purchase_date);
CREATE INDEX IF NOT EXISTS idx_products_retailer ON products(retailer);
CREATE INDEX IF NOT EXISTS idx_warranties_product_id ON warranties(product_id);
CREATE INDEX IF NOT EXISTS idx_warranties_user_id ON warranties(user_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_user_id ON user_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_product_id ON maintenance_records(product_id);
CREATE INDEX IF NOT EXISTS idx_documents_product_id ON documents(product_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for products table
DROP POLICY IF EXISTS "Users can view own products" ON products;
CREATE POLICY "Users can view own products" ON products
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own products" ON products;
CREATE POLICY "Users can insert own products" ON products
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own products" ON products;
CREATE POLICY "Users can update own products" ON products
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own products" ON products;
CREATE POLICY "Users can delete own products" ON products
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for warranties table
DROP POLICY IF EXISTS "Users can view own warranties" ON warranties;
CREATE POLICY "Users can view own warranties" ON warranties
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own warranties" ON warranties;
CREATE POLICY "Users can insert own warranties" ON warranties
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own warranties" ON warranties;
CREATE POLICY "Users can update own warranties" ON warranties
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own warranties" ON warranties;
CREATE POLICY "Users can delete own warranties" ON warranties
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_connections table
DROP POLICY IF EXISTS "Users can view own connections" ON user_connections;
CREATE POLICY "Users can view own connections" ON user_connections
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own connections" ON user_connections;
CREATE POLICY "Users can insert own connections" ON user_connections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own connections" ON user_connections;
CREATE POLICY "Users can update own connections" ON user_connections
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for maintenance_records table
DROP POLICY IF EXISTS "Users can view own maintenance records" ON maintenance_records;
CREATE POLICY "Users can view own maintenance records" ON maintenance_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = maintenance_records.product_id 
            AND products.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert own maintenance records" ON maintenance_records;
CREATE POLICY "Users can insert own maintenance records" ON maintenance_records
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = maintenance_records.product_id 
            AND products.user_id = auth.uid()
        )
    );

-- Create RLS policies for documents table
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
CREATE POLICY "Users can view own documents" ON documents
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
CREATE POLICY "Users can insert own documents" ON documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Verify the setup
SELECT 
    'Database setup complete' as status,
    COUNT(*) as tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('products', 'warranties', 'user_connections', 'maintenance_records', 'documents');
