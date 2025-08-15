-- ==============================================================================
-- DATABASE SCHEMA FIXES FOR CLAIMSO PWA
-- ==============================================================================

-- 1. Add missing fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS capture_method VARCHAR(50) DEFAULT 'manual_upload';

-- 2. Create claims table
CREATE TABLE IF NOT EXISTS claims (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    issue_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    preferred_contact_method VARCHAR(20) DEFAULT 'email',
    urgency_level VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'submitted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create claim_statuses table
CREATE TABLE IF NOT EXISTS claim_statuses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create quote_requests table
CREATE TABLE IF NOT EXISTS quote_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    brand VARCHAR(100),
    condition VARCHAR(20),
    purchase_price DECIMAL(10,2),
    quotes_generated INTEGER DEFAULT 0,
    best_quote_amount DECIMAL(10,2),
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create cart table
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    category VARCHAR(100),
    purchase_price DECIMAL(10,2),
    purchase_location VARCHAR(255),
    retailer_url TEXT,
    quantity INTEGER DEFAULT 1,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create RLS policies for new tables
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Claims policies
CREATE POLICY "Users can view their own claims" ON claims
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own claims" ON claims
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own claims" ON claims
    FOR UPDATE USING (auth.uid() = user_id);

-- Claim statuses policies
CREATE POLICY "Users can view their claim statuses" ON claim_statuses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM claims 
            WHERE claims.id = claim_statuses.claim_id 
            AND claims.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert claim statuses" ON claim_statuses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM claims 
            WHERE claims.id = claim_statuses.claim_id 
            AND claims.user_id = auth.uid()
        )
    );

-- Quote requests policies
CREATE POLICY "Users can view their own quote requests" ON quote_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quote requests" ON quote_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Cart items policies
CREATE POLICY "Users can view their own cart items" ON cart_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart items" ON cart_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart items" ON cart_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart items" ON cart_items
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_claims_user_id ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_product_id ON claims(product_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claim_statuses_claim_id ON claim_statuses(claim_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_user_id ON quote_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- 8. Create storage bucket for claim files
-- Note: This needs to be done through Supabase dashboard or API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('claim-files', 'claim-files', false);

-- 9. Create storage policies for claim files
-- CREATE POLICY "Users can upload claim files" ON storage.objects
--     FOR INSERT WITH CHECK (
--         bucket_id = 'claim-files' AND 
--         auth.uid()::text = (storage.foldername(name))[1]
--     );

-- CREATE POLICY "Users can view their claim files" ON storage.objects
--     FOR SELECT USING (
--         bucket_id = 'claim-files' AND 
--         auth.uid()::text = (storage.foldername(name))[1]
--     );

-- 10. Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
