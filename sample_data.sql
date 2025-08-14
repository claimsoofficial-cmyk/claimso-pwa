-- ==============================================================================
-- COMPREHENSIVE SAMPLE DATA FOR CLAIMSO DASHBOARD
-- ==============================================================================
-- This script creates realistic sample data with various warranty scenarios

-- Clear existing data for user
DELETE FROM warranties WHERE user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca';
DELETE FROM products WHERE user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca';

-- ==============================================================================
-- ELECTRONICS (High-value items with various warranty scenarios)
-- ==============================================================================

-- iPhone 15 Pro (Active warranty, expiring soon)
INSERT INTO products (id, user_id, product_name, brand, category, purchase_date, purchase_price, currency, serial_number, condition, notes, created_at, updated_at, is_archived, payment_method, purchase_location) VALUES
('prod-iphone-15-pro', '5cbd0756-963e-4777-96d7-629edf66e0ca', 'iPhone 15 Pro', 'Apple', 'Electronics', '2024-01-15', 999.00, 'USD', 'IP15P123456789', 'new', '256GB, Natural Titanium', NOW(), NOW(), false, 'credit_card', 'Apple Store');

INSERT INTO warranties (id, product_id, user_id, warranty_type, warranty_start_date, warranty_end_date, warranty_duration_months, coverage_details, claim_process, contact_info, snapshot_data, ai_confidence_score, last_analyzed_at, created_at, updated_at) VALUES
('warr-iphone-15-pro-1', 'prod-iphone-15-pro', '5cbd0756-963e-4777-96d7-629edf66e0ca', 'manufacturer', '2024-01-15', '2025-01-15', 12, 'Hardware defects, manufacturing issues', 'Contact Apple Support or visit Apple Store', '1-800-APL-CARE', '{"covers": ["Hardware defects", "Manufacturing issues"], "does_not_cover": ["Water damage", "Physical damage"], "key_terms": ["1 year limited warranty", "90 days phone support"]}', 0.95, NOW(), NOW(), NOW());

-- MacBook Air M2 (Active warranty, long duration)
INSERT INTO products (id, user_id, product_name, brand, category, purchase_date, purchase_price, currency, serial_number, condition, new, notes, created_at, updated_at, is_archived, payment_method, purchase_location) VALUES
('prod-macbook-air-m2', '5cbd0756-963e-4777-96d7-629edf66e0ca', 'MacBook Air M2', 'Apple', 'Electronics', '2023-06-10', 1199.00, 'USD', 'MBA-M2-987654321', 'new', '13-inch, 8GB RAM, 256GB SSD', NOW(), NOW(), false, 'apple_pay', 'Apple Store');

INSERT INTO warranties (id, product_id, user_id, warranty_type, warranty_start_date, warranty_end_date, warranty_duration_months, coverage_details, claim_process, contact_info, snapshot_data, ai_confidence_score, last_analyzed_at, created_at, updated_at) VALUES
('warr-macbook-air-m2-1', 'prod-macbook-air-m2', '5cbd0756-963e-4777-96d7-629edf66e0ca', 'manufacturer', '2023-06-10', '2025-06-10', 24, 'Hardware defects, battery issues', 'Contact Apple Support or visit Apple Store', '1-800-APL-CARE', '{"covers": ["Hardware defects", "Battery issues"], "does_not_cover": ["Accidental damage", "Software issues"], "key_terms": ["2 year limited warranty"]}', 0.95, NOW(), NOW(), NOW());

-- Samsung TV (Expired warranty)
INSERT INTO products (id, user_id, product_name, brand, category, purchase_date, purchase_price, currency, serial_number, condition, notes, created_at, updated_at, is_archived, payment_method, purchase_location) VALUES
('prod-samsung-tv-65', '5cbd0756-963e-4777-96d7-629edf66e0ca', 'Samsung 65" QLED 4K TV', 'Samsung', 'Electronics', '2022-03-20', 1299.00, 'USD', 'SAM-TV-65-456789', 'new', '65-inch, QLED, 4K resolution', NOW(), NOW(), false, 'credit_card', 'Best Buy');

INSERT INTO warranties (id, product_id, user_id, warranty_type, warranty_start_date, warranty_end_date, warranty_duration_months, coverage_details, claim_process, contact_info, snapshot_data, ai_confidence_score, last_analyzed_at, created_at, updated_at) VALUES
('warr-samsung-tv-65-1', 'prod-samsung-tv-65', '5cbd0756-963e-4777-96d7-629edf66e0ca', 'manufacturer', '2022-03-20', '2023-03-20', 12, 'Hardware defects, panel issues', 'Contact Samsung Support', '1-800-SAMSUNG', '{"covers": ["Hardware defects", "Panel issues"], "does_not_cover": ["Physical damage", "Burn-in"], "key_terms": ["1 year limited warranty"]}', 0.90, NOW(), NOW(), NOW());

-- Sony Headphones (No warranty)
INSERT INTO products (id, user_id, product_name, brand, category, purchase_date, purchase_price, currency, serial_number, condition, notes, created_at, updated_at, is_archived, payment_method, purchase_location) VALUES
('prod-sony-headphones', '5cbd0756-963e-4777-96d7-629edf66e0ca', 'Sony WH-1000XM5 Headphones', 'Sony', 'Electronics', '2024-02-28', 349.99, 'USD', 'SONY-WH-1000XM5-123', 'new', 'Wireless noise-canceling headphones', NOW(), NOW(), false, 'debit_card', 'Amazon');

-- ==============================================================================
-- HOME & GARDEN (Mixed warranty scenarios)
-- ==============================================================================

-- Dyson Vacuum (Extended warranty, expiring soon)
INSERT INTO products (id, user_id, product_name, brand, category, purchase_date, purchase_price, currency, serial_number, condition, notes, created_at, updated_at, is_archived, payment_method, purchase_location) VALUES
('prod-dyson-vacuum', '5cbd0756-963e-4777-96d7-629edf66e0ca', 'Dyson V15 Detect', 'Dyson', 'Home & Garden', '2023-08-15', 699.99, 'USD', 'DYSON-V15-789456', 'new', 'Cordless vacuum with laser detection', NOW(), NOW(), false, 'credit_card', 'Target');

INSERT INTO warranties (id, product_id, user_id, warranty_type, warranty_start_date, warranty_end_date, warranty_duration_months, coverage_details, claim_process, contact_info, snapshot_data, ai_confidence_score, last_analyzed_at, created_at, updated_at) VALUES
('warr-dyson-vacuum-1', 'prod-dyson-vacuum', '5cbd0756-963e-4777-96d7-629edf66e0ca', 'extended', '2023-08-15', '2024-11-15', 15, 'Parts and labor, motor coverage', 'Contact Dyson Support', '1-866-DYSON-US', '{"covers": ["Parts and labor", "Motor coverage"], "does_not_cover": ["Normal wear and tear", "Battery"], "key_terms": ["Extended warranty", "15 months coverage"]}', 0.88, NOW(), NOW(), NOW());

-- KitchenAid Mixer (Store warranty)
INSERT INTO products (id, user_id, product_name, brand, category, purchase_date, purchase_price, currency, serial_number, condition, notes, created_at, updated_at, is_archived, payment_method, purchase_location) VALUES
('prod-kitchenaid-mixer', '5cbd0756-963e-4777-96d7-629edf66e0ca', 'KitchenAid Stand Mixer', 'KitchenAid', 'Home & Garden', '2023-12-01', 449.99, 'USD', 'KA-MIXER-456123', 'new', 'Professional 5-quart stand mixer, red', NOW(), NOW(), false, 'credit_card', 'Williams-Sonoma');

INSERT INTO warranties (id, product_id, user_id, warranty_type, warranty_start_date, warranty_end_date, warranty_duration_months, coverage_details, claim_process, contact_info, snapshot_data, ai_confidence_score, last_analyzed_at, created_at, updated_at) VALUES
('warr-kitchenaid-mixer-1', 'prod-kitchenaid-mixer', '5cbd0756-963e-4777-96d7-629edf66e0ca', 'store', '2023-12-01', '2024-12-01', 12, 'Parts and labor, motor coverage', 'Contact Williams-Sonoma', '1-877-812-6235', '{"covers": ["Parts and labor", "Motor coverage"], "does_not_cover": ["Normal wear and tear", "Attachments"], "key_terms": ["Store warranty", "1 year coverage"]}', 0.85, NOW(), NOW(), NOW());

-- Tide Laundry Detergent (No warranty - consumable)
INSERT INTO products (id, user_id, product_name, brand, category, purchase_date, purchase_price, currency, serial_number, condition, notes, created_at, updated_at, is_archived, payment_method, purchase_location) VALUES
('prod-tide-detergent', '5cbd0756-963e-4777-96d7-629edf66e0ca', 'Tide Original Laundry Detergent', 'Tide', 'Home & Garden', '2024-01-10', 12.99, 'USD', NULL, 'new', '150 oz bottle, original scent', NOW(), NOW(), false, 'cash', 'Walmart');

-- ==============================================================================
-- CLOTHING & ACCESSORIES (Various scenarios)
-- ==============================================================================

-- Nike Running Shoes (No warranty)
INSERT INTO products (id, user_id, product_name, brand, category, purchase_date, purchase_price, currency, serial_number, condition, notes, created_at, updated_at, is_archived, payment_method, purchase_location) VALUES
('prod-nike-shoes', '5cbd0756-963e-4777-96d7-629edf66e0ca', 'Nike Air Zoom Pegasus 40', 'Nike', 'Clothing & Accessories', '2024-02-15', 129.99, 'USD', NULL, 'new', 'Running shoes, size 10, blue', NOW(), NOW(), false, 'credit_card', 'Nike Store');

-- Gold Chain (High value, no warranty)
INSERT INTO products (id, user_id, product_name, brand, category, purchase_date, purchase_price, currency, serial_number, condition, notes, created_at, updated_at, is_archived, payment_method, purchase_location) VALUES
('prod-gold-chain', '5cbd0756-963e-4777-96d7-629edf66e0ca', '18K Gold Chain Necklace', 'Generic', 'Clothing & Accessories', '2023-11-20', 2500.00, 'USD', 'GC-18K-789123', 'new', '24-inch chain, 18K gold, 5mm width', NOW(), NOW(), false, 'bank_transfer', 'Local Jewelry Store');

-- ==============================================================================
-- AUTOMOTIVE (Insurance-based warranties)
-- ==============================================================================

-- Car Battery (Insurance warranty)
INSERT INTO products (id, user_id, product_name, brand, category, purchase_date, purchase_price, currency, serial_number, condition, notes, created_at, updated_at, is_archived, payment_method, purchase_location) VALUES
('prod-car-battery', '5cbd0756-963e-4777-96d7-629edf66e0ca', 'Optima RedTop Battery', 'Optima', 'Automotive', '2023-09-05', 299.99, 'USD', 'OPT-RED-456789', 'new', 'Group 34/78, 800 CCA', NOW(), NOW(), false, 'credit_card', 'AutoZone');

INSERT INTO warranties (id, product_id, user_id, warranty_type, warranty_start_date, warranty_end_date, warranty_duration_months, coverage_details, claim_process, contact_info, snapshot_data, ai_confidence_score, last_analyzed_at, created_at, updated_at) VALUES
('warr-car-battery-1', 'prod-car-battery', '5cbd0756-963e-4777-96d7-629edf66e0ca', 'insurance', '2023-09-05', '2026-09-05', 36, 'Free replacement, pro-rated after 18 months', 'Return to AutoZone with receipt', '1-800-OPTIMA-1', '{"covers": ["Free replacement", "Pro-rated coverage"], "does_not_cover": ["Physical damage", "Improper installation"], "key_terms": ["3 year warranty", "18 months free replacement"]}', 0.92, NOW(), NOW(), NOW());

-- ==============================================================================
-- SPORTS & OUTDOORS (Mixed scenarios)
-- ==============================================================================

-- Peloton Bike (Extended warranty, active)
INSERT INTO products (id, user_id, product_name, brand, category, purchase_date, purchase_price, currency, serial_number, condition, notes, created_at, updated_at, is_archived, payment_method, purchase_location) VALUES
('prod-peloton-bike', '5cbd0756-963e-4777-96d7-629edf66e0ca', 'Peloton Bike+', 'Peloton', 'Sports & Outdoors', '2023-10-12', 2495.00, 'USD', 'PEL-BIKE-123456', 'new', 'Premium bike with rotating HD touchscreen', NOW(), NOW(), false, 'credit_card', 'Peloton');

INSERT INTO warranties (id, product_id, user_id, warranty_type, warranty_start_date, warranty_end_date, warranty_duration_months, coverage_details, claim_process, contact_info, snapshot_data, ai_confidence_score, last_analyzed_at, created_at, updated_at) VALUES
('warr-peloton-bike-1', 'prod-peloton-bike', '5cbd0756-963e-4777-96d7-629edf66e0ca', 'extended', '2023-10-12', '2026-10-12', 36, 'Frame, electronics, and labor', 'Contact Peloton Support', '1-866-679-9129', '{"covers": ["Frame", "Electronics", "Labor"], "does_not_cover": ["Normal wear and tear", "Software issues"], "key_terms": ["3 year extended warranty"]}', 0.94, NOW(), NOW(), NOW());

-- Yoga Mat (No warranty)
INSERT INTO products (id, user_id, product_name, brand, category, purchase_date, purchase_price, currency, serial_number, condition, notes, created_at, updated_at, is_archived, payment_method, purchase_location) VALUES
('prod-yoga-mat', '5cbd0756-963e-4777-96d7-629edf66e0ca', 'Lululemon Reversible Mat', 'Lululemon', 'Sports & Outdoors', '2024-01-05', 98.00, 'USD', NULL, 'new', '5mm thick, reversible, black/charcoal', NOW(), NOW(), false, 'credit_card', 'Lululemon');

-- ==============================================================================
-- BOOKS & MEDIA (No warranty items)
-- ==============================================================================

-- Kindle Paperwhite (Manufacturer warranty, expired)
INSERT INTO products (id, user_id, product_name, brand, category, purchase_date, purchase_price, currency, serial_number, condition, notes, created_at, updated_at, is_archived, payment_method, purchase_location) VALUES
('prod-kindle-paperwhite', '5cbd0756-963e-4777-96d7-629edf66e0ca', 'Kindle Paperwhite', 'Amazon', 'Books & Media', '2022-05-15', 139.99, 'USD', 'KINDLE-PW-789123', 'new', '8GB, waterproof, 6.8-inch display', NOW(), NOW(), false, 'amazon_pay', 'Amazon');

INSERT INTO warranties (id, product_id, user_id, warranty_type, warranty_start_date, warranty_end_date, warranty_duration_months, coverage_details, claim_process, contact_info, snapshot_data, ai_confidence_score, last_analyzed_at, created_at, updated_at) VALUES
('warr-kindle-paperwhite-1', 'prod-kindle-paperwhite', '5cbd0756-963e-4777-96d7-629edf66e0ca', 'manufacturer', '2022-05-15', '2023-05-15', 12, 'Hardware defects, battery issues', 'Contact Amazon Support', '1-888-280-4331', '{"covers": ["Hardware defects", "Battery issues"], "does_not_cover": ["Physical damage", "Water damage"], "key_terms": ["1 year limited warranty"]}', 0.87, NOW(), NOW(), NOW());

-- ==============================================================================
-- TOOLS & HARDWARE (Store warranties)
-- ==============================================================================

-- DeWalt Drill (Store warranty, active)
INSERT INTO products (id, user_id, product_name, brand, category, purchase_date, purchase_price, currency, serial_number, condition, notes, created_at, updated_at, is_archived, payment_method, purchase_location) VALUES
('prod-dewalt-drill', '5cbd0756-963e-4777-96d7-629edf66e0ca', 'DeWalt 20V Max Drill', 'DeWalt', 'Tools & Hardware', '2023-12-20', 199.99, 'USD', 'DEWALT-DRILL-456', 'new', '20V Max, 1.5Ah battery, charger included', NOW(), NOW(), false, 'credit_card', 'Home Depot');

INSERT INTO warranties (id, product_id, user_id, warranty_type, warranty_start_date, warranty_end_date, warranty_duration_months, coverage_details, claim_process, contact_info, snapshot_data, ai_confidence_score, last_analyzed_at, created_at, updated_at) VALUES
('warr-dewalt-drill-1', 'prod-dewalt-drill', '5cbd0756-963e-4777-96d7-629edf66e0ca', 'store', '2023-12-20', '2024-12-20', 12, 'Parts and labor, battery coverage', 'Return to Home Depot with receipt', '1-800-HOME-DEPOT', '{"covers": ["Parts and labor", "Battery coverage"], "does_not_cover": ["Normal wear and tear", "Accessories"], "key_terms": ["1 year store warranty"]}', 0.89, NOW(), NOW(), NOW());

-- ==============================================================================
-- BEAUTY & PERSONAL CARE (No warranty items)
-- ==============================================================================

-- Dyson Hair Dryer (Extended warranty, expiring soon)
INSERT INTO products (id, user_id, product_name, brand, category, purchase_date, purchase_price, currency, serial_number, condition, notes, created_at, updated_at, is_archived, payment_method, purchase_location) VALUES
('prod-dyson-hair-dryer', '5cbd0756-963e-4777-96d7-629edf66e0ca', 'Dyson Supersonic Hair Dryer', 'Dyson', 'Beauty & Personal Care', '2023-07-08', 429.99, 'USD', 'DYSON-HAIR-789', 'new', 'Supersonic hair dryer with attachments', NOW(), NOW(), false, 'credit_card', 'Sephora');

INSERT INTO warranties (id, product_id, user_id, warranty_type, warranty_start_date, warranty_end_date, warranty_duration_months, coverage_details, claim_process, contact_info, snapshot_data, ai_confidence_score, last_analyzed_at, created_at, updated_at) VALUES
('warr-dyson-hair-dryer-1', 'prod-dyson-hair-dryer', '5cbd0756-963e-4777-96d7-629edf66e0ca', 'extended', '2023-07-08', '2024-10-08', 15, 'Motor and electronics coverage', 'Contact Dyson Support', '1-866-DYSON-US', '{"covers": ["Motor", "Electronics"], "does_not_cover": ["Normal wear and tear", "Attachments"], "key_terms": ["15 month extended warranty"]}', 0.91, NOW(), NOW(), NOW());

-- ==============================================================================
-- FOOD & BEVERAGES (Consumables, no warranty)
-- ==============================================================================

-- Coffee Beans (No warranty - consumable)
INSERT INTO products (id, user_id, product_name, brand, category, purchase_date, purchase_price, currency, serial_number, condition, notes, created_at, updated_at, is_archived, payment_method, purchase_location) VALUES
('prod-coffee-beans', '5cbd0756-963e-4777-96d7-629edf66e0ca', 'Starbucks Pike Place Roast', 'Starbucks', 'Food & Beverages', '2024-02-01', 14.99, 'USD', NULL, 'new', '1lb whole bean coffee, medium roast', NOW(), NOW(), false, 'credit_card', 'Starbucks');

-- ==============================================================================
-- GAMING (Mixed warranty scenarios)
-- ==============================================================================

-- PlayStation 5 (Manufacturer warranty, active)
INSERT INTO products (id, user_id, product_name, brand, category, purchase_date, purchase_price, currency, serial_number, condition, notes, created_at, updated_at, is_archived, payment_method, purchase_location) VALUES
('prod-ps5', '5cbd0756-963e-4777-96d7-629edf66e0ca', 'PlayStation 5 Console', 'Sony', 'Gaming', '2023-11-15', 499.99, 'USD', 'PS5-CONSOLE-123', 'new', 'Disc version, 825GB SSD', NOW(), NOW(), false, 'credit_card', 'GameStop');

INSERT INTO warranties (id, product_id, user_id, warranty_type, warranty_start_date, warranty_end_date, warranty_duration_months, coverage_details, claim_process, contact_info, snapshot_data, ai_confidence_score, last_analyzed_at, created_at, updated_at) VALUES
('warr-ps5-1', 'prod-ps5', '5cbd0756-963e-4777-96d7-629edf66e0ca', 'manufacturer', '2023-11-15', '2024-11-15', 12, 'Hardware defects, disc drive issues', 'Contact Sony Support', '1-800-345-SONY', '{"covers": ["Hardware defects", "Disc drive issues"], "does_not_cover": ["Physical damage", "Software issues"], "key_terms": ["1 year limited warranty"]}', 0.93, NOW(), NOW(), NOW());

-- ==============================================================================
-- MUSICAL INSTRUMENTS (High value, extended warranty)
-- ==============================================================================

-- Gibson Guitar (Extended warranty, long duration)
INSERT INTO products (id, user_id, product_name, brand, category, purchase_date, purchase_price, currency, serial_number, condition, notes, created_at, updated_at, is_archived, payment_method, purchase_location) VALUES
('prod-gibson-guitar', '5cbd0756-963e-4777-96d7-629edf66e0ca', 'Gibson Les Paul Standard', 'Gibson', 'Musical Instruments', '2023-05-20', 2499.00, 'USD', 'GIBSON-LP-789', 'new', 'Les Paul Standard, Heritage Cherry Sunburst', NOW(), NOW(), false, 'credit_card', 'Guitar Center');

INSERT INTO warranties (id, product_id, user_id, warranty_type, warranty_start_date, warranty_end_date, warranty_duration_months, coverage_details, claim_process, contact_info, snapshot_data, ai_confidence_score, last_analyzed_at, created_at, updated_at) VALUES
('warr-gibson-guitar-1', 'prod-gibson-guitar', '5cbd0756-963e-4777-96d7-629edf66e0ca', 'extended', '2023-05-20', '2026-05-20', 36, 'Lifetime warranty on neck and body', 'Contact Gibson Support', '1-800-4GIBSON', '{"covers": ["Lifetime neck and body", "Electronics"], "does_not_cover": ["Normal wear and tear", "String replacement"], "key_terms": ["Lifetime warranty", "3 year electronics"]}', 0.96, NOW(), NOW(), NOW());

-- ==============================================================================
-- SUMMARY OF SAMPLE DATA
-- ==============================================================================
-- Total Products: 20
-- Categories: Electronics, Home & Garden, Clothing & Accessories, Automotive, Sports & Outdoors, Books & Media, Tools & Hardware, Beauty & Personal Care, Food & Beverages, Gaming, Musical Instruments
-- Warranty Types: manufacturer, extended, store, insurance, none
-- Price Range: $12.99 - $2,500.00
-- Warranty Status: Active, Expiring Soon, Expired, No Warranty
-- Payment Methods: credit_card, apple_pay, debit_card, cash, bank_transfer, amazon_pay
-- Real-life Products: iPhone, MacBook, Samsung TV, Dyson products, KitchenAid, Tide, Nike shoes, Gold chain, Car battery, Peloton, Yoga mat, Kindle, DeWalt drill, PlayStation 5, Gibson guitar, etc.
