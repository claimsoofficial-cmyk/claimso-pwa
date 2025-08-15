const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fryifnzncbfeodmuziut.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyeWlmbnpuY2JmZW9kbXV6aXV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDcyMDAzNCwiZXhwIjoyMDcwMjk2MDM0fQ.NRbzUfpPUSwfgY_QmSUoS93bTzSLXUBhzebDLz7AIoQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupDatabase() {
  console.log('=== CLEANING UP TEST DATA ===\n');
  
  // Show what we're about to delete
  const { data: testProducts, error: testError } = await supabase
    .from('products')
    .select('*')
    .in('user_id', ['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002']);
  
  if (testError) {
    console.error('Error fetching test products:', testError);
    return;
  }
  
  console.log(`Test products to be deleted: ${testProducts?.length || 0}`);
  
  // Show real user products that will be kept
  const { data: realProducts, error: realError } = await supabase
    .from('products')
    .select('*')
    .not('user_id', 'eq', '00000000-0000-0000-0000-000000000001')
    .not('user_id', 'eq', '00000000-0000-0000-0000-000000000002');
  
  if (realError) {
    console.error('Error fetching real products:', realError);
    return;
  }
  
  console.log(`Real user products to keep: ${realProducts?.length || 0}`);
  
  // Group real products by user
  const productsByUser = {};
  realProducts?.forEach(product => {
    if (!productsByUser[product.user_id]) {
      productsByUser[product.user_id] = [];
    }
    productsByUser[product.user_id].push(product);
  });
  
  console.log('\n=== REAL USER PRODUCTS ===');
  Object.keys(productsByUser).forEach(userId => {
    console.log(`User ID: ${userId} - ${productsByUser[userId].length} products`);
    productsByUser[userId].forEach(product => {
      console.log(`  - ${product.product_name} ($${product.purchase_price}) - ${product.retailer}`);
    });
  });
  
  // Delete test data
  const { error: deleteError } = await supabase
    .from('products')
    .delete()
    .in('user_id', ['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002']);
  
  if (deleteError) {
    console.error('Error deleting test products:', deleteError);
    return;
  }
  
  console.log('\n✅ Test data deleted successfully!');
  
  // Verify cleanup
  const { data: remainingProducts, error: remainingError } = await supabase
    .from('products')
    .select('*');
  
  if (remainingError) {
    console.error('Error fetching remaining products:', remainingError);
    return;
  }
  
  console.log(`\n=== AFTER CLEANUP ===`);
  console.log(`Total products remaining: ${remainingProducts?.length || 0}`);
  
  // Group remaining products by user
  const remainingByUser = {};
  remainingProducts?.forEach(product => {
    if (!remainingByUser[product.user_id]) {
      remainingByUser[product.user_id] = [];
    }
    remainingByUser[product.user_id].push(product);
  });
  
  Object.keys(remainingByUser).forEach(userId => {
    console.log(`User ID: ${userId} - ${remainingByUser[userId].length} products`);
  });
}

cleanupDatabase().catch(console.error);
