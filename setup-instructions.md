# 🚨 URGENT: Infrastructure Setup Required

## **Why Your Features Aren't Working**

The main reason your features aren't working is that **the database tables don't exist yet**. Here's what's missing:

### **❌ Missing Database Tables:**
- `claims` table (for claim submission)
- `claim_statuses` table (for claim tracking)
- `quote_requests` table (for quick cash quotes)
- `cart_items` table (for shopping cart)

### **❌ Missing Database Fields:**
- `source` field in products table
- `capture_method` field in products table

### **❌ Missing Storage:**
- `claim-files` storage bucket (for file uploads)

---

## **🔧 STEP-BY-STEP FIX**

### **Step 1: Execute Database Migrations**

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `fryifnzncbfeodmuziut`
3. **Click on "SQL Editor"** in the left sidebar
4. **Copy and paste** this SQL code:

```sql
-- Add missing fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS capture_method VARCHAR(50) DEFAULT 'manual_upload';

-- Create claims table
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

-- Create claim_statuses table
CREATE TABLE IF NOT EXISTS claim_statuses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quote_requests table
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

-- Create cart_items table
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

-- Enable RLS on new tables
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for claims
CREATE POLICY "Users can view their own claims" ON claims
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own claims" ON claims
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own claims" ON claims
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for claim_statuses
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

-- Create RLS policies for quote_requests
CREATE POLICY "Users can view their own quote requests" ON quote_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quote requests" ON quote_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for cart_items
CREATE POLICY "Users can view their own cart items" ON cart_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart items" ON cart_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart items" ON cart_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart items" ON cart_items
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_claims_user_id ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_product_id ON claims(product_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claim_statuses_claim_id ON claim_statuses(claim_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_user_id ON quote_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- Create trigger function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

5. **Click "Run"** to execute the SQL

### **Step 2: Create Storage Bucket**

1. **In Supabase Dashboard**, click on "Storage" in the left sidebar
2. **Click "Create a new bucket"**
3. **Enter these details:**
   - **Name**: `claim-files`
   - **Public bucket**: ❌ **No** (Keep private)
   - **File size limit**: 50MB
4. **Click "Create bucket"**

### **Step 3: Add Storage Policies**

1. **Click on the "claim-files" bucket**
2. **Click on "Policies" tab**
3. **Add these policies one by one:**

**Policy 1: Users can upload claim files**
```sql
CREATE POLICY "Users can upload claim files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'claim-files' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );
```

**Policy 2: Users can view their claim files**
```sql
CREATE POLICY "Users can view their claim files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'claim-files' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );
```

**Policy 3: Users can update their claim files**
```sql
CREATE POLICY "Users can update their claim files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'claim-files' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );
```

**Policy 4: Users can delete their claim files**
```sql
CREATE POLICY "Users can delete their claim files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'claim-files' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );
```

---

## **✅ AFTER SETUP - TEST THESE FEATURES**

### **1. Test Cart Functionality**
- Go to any product card
- Click the "Rebuy" button (shopping cart icon)
- Should show "Added to cart" message
- Go to `/cart` page to see your cart

### **2. Test Claim Submission**
- Go to any product card
- Click "File Claim" button
- Fill out the claim form
- Should submit successfully

### **3. Test Calendar Download**
- Go to any product card
- Click "Download Calendar" button
- Should download a `.ics` file

### **4. Test Edit Product**
- Go to any product card
- Click "Edit" button
- Should take you to edit page

### **5. Test Purchase Source Display**
- Product cards should now show:
  - Purchase location
  - Source (if available)
  - Capture method (if available)

---

## **🚨 IF STILL NOT WORKING**

If any features still don't work after following these steps:

1. **Check the browser console** for error messages
2. **Make sure you're logged in** to the app
3. **Try refreshing the page** after setup
4. **Contact support** with specific error messages

---

## **📞 NEED HELP?**

If you need help with any of these steps:
1. Take screenshots of any error messages
2. Note which specific features aren't working
3. Share the error messages from browser console

The infrastructure setup is the key missing piece - once you complete these steps, everything should work perfectly! 🚀
