-- ==============================================================================
-- CLEANUP SAMPLE DATA SCRIPT
-- ==============================================================================
-- Run this first to clear existing problematic data

-- Delete maintenance records for the user's products
DELETE FROM maintenance_records 
WHERE product_id IN (
    SELECT id FROM products WHERE user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca'
);

-- Delete warranties for the user
DELETE FROM warranties 
WHERE user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca';

-- Delete user connections
DELETE FROM user_connections 
WHERE user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca';

-- Delete products for the user
DELETE FROM products 
WHERE user_id = '5cbd0756-963e-4777-96d7-629edf66e0ca';

-- Verify cleanup
SELECT 'Cleanup completed' as status;
