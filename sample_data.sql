-- ==============================================================================
-- CLAIMSO SAMPLE DATA SCRIPT FOR SUPABASE
-- ==============================================================================
-- This script creates 1000+ sample products across various categories
-- Run this in your Supabase SQL editor to populate your database

-- First, let's create some sample users if they don't exist
INSERT INTO auth.users (id, email, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'demo@claimso.com', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'test@claimso.com', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- SAMPLE PRODUCTS DATA
-- ==============================================================================

-- Clear existing sample data (optional - comment out if you want to keep existing data)
-- DELETE FROM products WHERE user_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

-- Sample data arrays for generating varied products
DO $$
DECLARE
    -- Car brands and models
    car_brands TEXT[] := ARRAY['Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes', 'Audi', 'Tesla', 'Nissan', 'Hyundai', 'Kia', 'Volkswagen', 'Chevrolet', 'Dodge', 'Jeep', 'Subaru'];
    car_models TEXT[] := ARRAY['Camry', 'Civic', 'F-150', '3 Series', 'C-Class', 'A4', 'Model 3', 'Altima', 'Sonata', 'Optima', 'Golf', 'Malibu', 'Charger', 'Wrangler', 'Outback'];
    
    -- Car parts
    car_parts TEXT[] := ARRAY['Brake Pads', 'Oil Filter', 'Air Filter', 'Spark Plugs', 'Battery', 'Tires', 'Windshield Wipers', 'Headlights', 'Taillights', 'Mirrors', 'Seat Covers', 'Floor Mats', 'Steering Wheel', 'Gear Shift', 'Dashboard'];
    
    -- Phone brands and models
    phone_brands TEXT[] := ARRAY['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Huawei', 'Sony', 'LG', 'Motorola', 'Nokia', 'ASUS', 'OPPO', 'Vivo', 'Realme', 'Nothing'];
    phone_models TEXT[] := ARRAY['iPhone 15 Pro', 'Galaxy S24', 'Pixel 8', 'OnePlus 12', 'Redmi Note 13', 'P50 Pro', 'Xperia 1 V', 'G8 ThinQ', 'Edge 40', 'G50', 'ROG Phone 8', 'Find X7', 'X100 Pro', 'GT Neo 5', 'Phone 2'];
    
    -- Clothing brands and items
    clothing_brands TEXT[] := ARRAY['Nike', 'Adidas', 'Under Armour', 'Puma', 'Reebok', 'New Balance', 'Converse', 'Vans', 'Levi''s', 'Gap', 'H&M', 'Zara', 'Uniqlo', 'Lululemon', 'Patagonia'];
    clothing_items TEXT[] := ARRAY['T-Shirt', 'Hoodie', 'Sweatshirt', 'Jeans', 'Shorts', 'Jacket', 'Sweater', 'Polo Shirt', 'Tank Top', 'Long Sleeve', 'Crop Top', 'Dress Shirt', 'Blazer', 'Cardigan', 'Windbreaker'];
    
    -- Electronics
    electronics TEXT[] := ARRAY['Laptop', 'Tablet', 'Smartwatch', 'Headphones', 'Speaker', 'Camera', 'Gaming Console', 'TV', 'Monitor', 'Keyboard', 'Mouse', 'Webcam', 'Microphone', 'Router', 'Power Bank'];
    electronics_brands TEXT[] := ARRAY['Apple', 'Samsung', 'Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'Sony', 'LG', 'Bose', 'JBL', 'Canon', 'Nikon', 'Microsoft', 'Logitech'];
    
    -- Home & Garden
    home_items TEXT[] := ARRAY['Coffee Maker', 'Blender', 'Toaster', 'Microwave', 'Refrigerator', 'Dishwasher', 'Washing Machine', 'Dryer', 'Vacuum Cleaner', 'Air Purifier', 'Fan', 'Heater', 'Garden Tools', 'Grill', 'Furniture'];
    home_brands TEXT[] := ARRAY['KitchenAid', 'Ninja', 'Cuisinart', 'Breville', 'Samsung', 'LG', 'Whirlpool', 'Maytag', 'Dyson', 'Shark', 'Honeywell', 'DeLonghi', 'Black+Decker', 'Weber', 'IKEA'];
    
    -- Sports & Fitness
    sports_items TEXT[] := ARRAY['Treadmill', 'Exercise Bike', 'Dumbbells', 'Yoga Mat', 'Resistance Bands', 'Foam Roller', 'Jump Rope', 'Medicine Ball', 'Kettlebell', 'Bench Press', 'Pull-up Bar', 'Tennis Racket', 'Golf Clubs', 'Basketball', 'Soccer Ball'];
    sports_brands TEXT[] := ARRAY['Bowflex', 'Peloton', 'NordicTrack', 'Life Fitness', 'Precor', 'Concept2', 'Rogue Fitness', 'CAP Barbell', 'Lululemon', 'Manduka', 'TriggerPoint', 'Crossrope', 'Wilson', 'Callaway', 'Spalding'];
    
    -- Payment methods
    payment_methods TEXT[] := ARRAY['credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay', 'amazon_pay', 'cash', 'bank_transfer'];
    
    -- Retailers
    retailers TEXT[] := ARRAY['Amazon', 'Best Buy', 'Walmart', 'Target', 'Home Depot', 'Lowes', 'Costco', 'Sam''s Club', 'Apple Store', 'Samsung Store', 'Nike Store', 'Adidas Store', 'Car Dealership', 'AutoZone', 'O''Reilly'];
    
    -- Conditions
    conditions TEXT[] := ARRAY['new', 'used', 'refurbished', 'damaged'];
    
    -- Categories
    categories TEXT[] := ARRAY['Automotive', 'Electronics', 'Clothing', 'Home & Garden', 'Sports & Fitness', 'Books', 'Toys', 'Health & Beauty', 'Food & Beverage', 'Tools'];
    
    i INTEGER;
    current_product_name TEXT;
    brand TEXT;
    category TEXT;
    purchase_price DECIMAL(10,2);
    condition TEXT;
    payment_method TEXT;
    retailer TEXT;
    serial_number TEXT;
    purchase_date DATE;
    warranty_count INTEGER;
    current_user_id UUID;
    
BEGIN
    -- Generate 1000+ sample products
    FOR i IN 1..1000 LOOP
        -- Randomly select user
        current_user_id := CASE WHEN i % 2 = 0 THEN 
            '00000000-0000-0000-0000-000000000001'::UUID 
        ELSE 
            '00000000-0000-0000-0000-000000000002'::UUID 
        END;
        
        -- Generate product based on category
        CASE (i % 10)
            WHEN 0 THEN -- Cars (10%)
                brand := car_brands[1 + (i % array_length(car_brands, 1))];
                current_product_name := brand || ' ' || car_models[1 + (i % array_length(car_models, 1))];
                category := 'Automotive';
                purchase_price := 15000 + (i % 50000);
                condition := conditions[1 + (i % array_length(conditions, 1))];
                
            WHEN 1 THEN -- Car Parts (10%)
                brand := car_brands[1 + (i % array_length(car_brands, 1))];
                current_product_name := brand || ' ' || car_parts[1 + (i % array_length(car_parts, 1))];
                category := 'Automotive';
                purchase_price := 50 + (i % 500);
                condition := conditions[1 + (i % array_length(conditions, 1))];
                
            WHEN 2 THEN -- Phones (10%)
                brand := phone_brands[1 + (i % array_length(phone_brands, 1))];
                current_product_name := brand || ' ' || phone_models[1 + (i % array_length(phone_models, 1))];
                category := 'Electronics';
                purchase_price := 500 + (i % 1500);
                condition := conditions[1 + (i % array_length(conditions, 1))];
                
            WHEN 3 THEN -- Clothing (10%)
                brand := clothing_brands[1 + (i % array_length(clothing_brands, 1))];
                current_product_name := brand || ' ' || clothing_items[1 + (i % array_length(clothing_items, 1))];
                category := 'Clothing';
                purchase_price := 20 + (i % 200);
                condition := conditions[1 + (i % array_length(conditions, 1))];
                
            WHEN 4 THEN -- Electronics (10%)
                brand := electronics_brands[1 + (i % array_length(electronics_brands, 1))];
                current_product_name := brand || ' ' || electronics[1 + (i % array_length(electronics, 1))];
                category := 'Electronics';
                purchase_price := 100 + (i % 2000);
                condition := conditions[1 + (i % array_length(conditions, 1))];
                
            WHEN 5 THEN -- Home & Garden (10%)
                brand := home_brands[1 + (i % array_length(home_brands, 1))];
                current_product_name := brand || ' ' || home_items[1 + (i % array_length(home_items, 1))];
                category := 'Home & Garden';
                purchase_price := 50 + (i % 1000);
                condition := conditions[1 + (i % array_length(conditions, 1))];
                
            WHEN 6 THEN -- Sports & Fitness (10%)
                brand := sports_brands[1 + (i % array_length(sports_brands, 1))];
                current_product_name := brand || ' ' || sports_items[1 + (i % array_length(sports_items, 1))];
                category := 'Sports & Fitness';
                purchase_price := 30 + (i % 800);
                condition := conditions[1 + (i % array_length(conditions, 1))];
                
            WHEN 7 THEN -- Mixed Electronics (10%)
                brand := electronics_brands[1 + (i % array_length(electronics_brands, 1))];
                current_product_name := brand || ' ' || electronics[1 + (i % array_length(electronics, 1))] || ' Pro';
                category := 'Electronics';
                purchase_price := 200 + (i % 3000);
                condition := conditions[1 + (i % array_length(conditions, 1))];
                
            WHEN 8 THEN -- Premium Clothing (10%)
                brand := clothing_brands[1 + (i % array_length(clothing_brands, 1))];
                current_product_name := brand || ' Premium ' || clothing_items[1 + (i % array_length(clothing_items, 1))];
                category := 'Clothing';
                purchase_price := 50 + (i % 300);
                condition := conditions[1 + (i % array_length(conditions, 1))];
                
            ELSE -- Mixed Categories (10%)
                brand := CASE (i % 4)
                    WHEN 0 THEN car_brands[1 + (i % array_length(car_brands, 1))]
                    WHEN 1 THEN phone_brands[1 + (i % array_length(phone_brands, 1))]
                    WHEN 2 THEN clothing_brands[1 + (i % array_length(clothing_brands, 1))]
                    ELSE electronics_brands[1 + (i % array_length(electronics_brands, 1))]
                END;
                current_product_name := brand || ' Special Edition Product ' || i;
                category := categories[1 + (i % array_length(categories, 1))];
                purchase_price := 25 + (i % 1000);
                condition := conditions[1 + (i % array_length(conditions, 1))];
        END CASE;
        
        -- Generate other random data
        payment_method := payment_methods[1 + (i % array_length(payment_methods, 1))];
        retailer := retailers[1 + (i % array_length(retailers, 1))];
        serial_number := 'SN' || LPAD(i::TEXT, 6, '0') || '-' || brand;
        purchase_date := CURRENT_DATE - INTERVAL '1 day' * (i % 365);
        warranty_count := (i % 3) + 1;
        
        -- Insert the product
        INSERT INTO products (
            id,
            user_id,
            product_name,
            brand,
            category,
            purchase_date,
            purchase_price,
            currency,
            serial_number,
            condition,
            notes,
            created_at,
            updated_at,
            is_archived,
            payment_method,
            purchase_location,
            retailer_url,
            affiliate_id
        ) VALUES (
            gen_random_uuid(),
            current_user_id,
            current_product_name,
            brand,
            category,
            purchase_date,
            purchase_price,
            'USD',
            serial_number,
            condition,
            'Sample product for testing - ' || current_product_name,
            NOW() - INTERVAL '1 day' * (i % 30),
            NOW(),
            FALSE,
            payment_method,
            retailer,
            'https://www.' || LOWER(REPLACE(retailer, ' ', '')) || '.com',
            'claimso-' || (i % 20 + 1)
        );
        
        -- Add warranties for some products (only if no warranty exists)
        IF warranty_count > 0 THEN
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
                created_at,
                updated_at
            )
            SELECT 
                gen_random_uuid(),
                p.id,
                p.user_id,
                p.purchase_date,
                p.purchase_date + INTERVAL '1 year',
                12,
                CASE (i % 4)
                    WHEN 0 THEN 'manufacturer'
                    WHEN 1 THEN 'extended'
                    WHEN 2 THEN 'store'
                    ELSE 'insurance'
                END,
                'Standard warranty coverage for ' || p.product_name,
                'Contact manufacturer or retailer for claims',
                'support@' || LOWER(REPLACE(p.brand, ' ', '')) || '.com',
                NOW(),
                NOW()
            FROM products p 
            WHERE p.product_name = current_product_name 
            AND p.user_id = current_user_id
            AND NOT EXISTS (
                SELECT 1 FROM warranties w WHERE w.product_id = p.id
            )
            LIMIT 1;
        END IF;
        
    END LOOP;
    
    RAISE NOTICE 'Generated 1000 sample products successfully!';
END $$;

-- ==============================================================================
-- SAMPLE MAINTENANCE RECORDS
-- ==============================================================================

-- Add some maintenance records for automotive products
INSERT INTO maintenance_records (
    id,
    product_id,
    service_date,
    service_type,
    provider_name,
    provider_contact,
    cost,
    currency,
    description,
    next_service_date,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    p.id,
    p.purchase_date + INTERVAL '6 months',
    CASE (ROW_NUMBER() OVER (ORDER BY p.id) % 5)
        WHEN 0 THEN 'routine'
        WHEN 1 THEN 'repair'
        WHEN 2 THEN 'upgrade'
        WHEN 3 THEN 'cleaning'
        ELSE 'inspection'
    END,
    CASE (ROW_NUMBER() OVER (ORDER BY p.id) % 3)
        WHEN 0 THEN 'AutoCare Pro'
        WHEN 1 THEN 'QuickFix Mobile'
        ELSE 'Premium Service Center'
    END,
    '(555) ' || LPAD((ROW_NUMBER() OVER (ORDER BY p.id) % 999)::TEXT, 3, '0') || '-' || LPAD((ROW_NUMBER() OVER (ORDER BY p.id) % 9999)::TEXT, 4, '0'),
    50 + (ROW_NUMBER() OVER (ORDER BY p.id) % 300),
    'USD',
    'Regular maintenance service for ' || p.product_name,
    p.purchase_date + INTERVAL '12 months',
    NOW(),
    NOW()
FROM products p 
WHERE p.category = 'Automotive' 
LIMIT 100;

-- ==============================================================================
-- SAMPLE USER CONNECTIONS
-- ==============================================================================

INSERT INTO user_connections (
    user_id,
    retailer,
    status,
    last_synced_at,
    created_at,
    updated_at
)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'amazon', 'connected', NOW(), NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000001', 'best buy', 'connected', NOW(), NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000001', 'walmart', 'connected', NOW(), NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000002', 'amazon', 'connected', NOW(), NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000002', 'target', 'connected', NOW(), NOW(), NOW())
ON CONFLICT (user_id, retailer) DO NOTHING;

-- ==============================================================================
-- VERIFICATION QUERIES
-- ==============================================================================

-- Check the data
SELECT 
    'Total Products' as metric,
    COUNT(*)::TEXT as count
FROM products
UNION ALL
SELECT 
    'Products by Category' as metric,
    category || ': ' || COUNT(*)::TEXT as count
FROM products 
GROUP BY category
UNION ALL
SELECT 
    'Products by Brand' as metric,
    brand || ': ' || COUNT(*)::TEXT as count
FROM products 
GROUP BY brand
ORDER BY metric, count DESC;

-- Show sample products
SELECT 
    product_name,
    brand,
    category,
    purchase_price,
    condition,
    payment_method,
    purchase_location
FROM products 
ORDER BY created_at DESC 
LIMIT 10;
