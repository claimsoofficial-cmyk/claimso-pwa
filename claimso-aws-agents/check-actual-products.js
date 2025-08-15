const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fryifnzncbfeodmuziut.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyeWlmbnpuY2JmZW9kbXV6aXV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDcyMDAzNCwiZXhwIjoyMDcwMjk2MDM0fQ.NRbzUfpPUSwfgY_QmSUoS93bTzSLXUBhzebDLz7AIoQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkActualProducts() {
  console.log('=== CHECKING ACTUAL PRODUCTS IN DATABASE ===\n');
  
  // Get all products
  const { data: allProducts, error: allError } = await supabase
    .from('products')
    .select('*');
  
  if (allError) {
    console.error('Error fetching all products:', allError);
    return;
  }
  
  console.log(`Total products in database: ${allProducts?.length || 0}\n`);
  
  // Group by user
  const productsByUser = {};
  allProducts?.forEach(product => {
    if (!productsByUser[product.user_id]) {
      productsByUser[product.user_id] = [];
    }
    productsByUser[product.user_id].push(product);
  });
  
  console.log('=== PRODUCTS BY USER ===');
  Object.keys(productsByUser).forEach(userId => {
    console.log(`\nUser ID: ${userId}`);
    console.log(`Products: ${productsByUser[userId].length}`);
    
    // Show first few products for this user
    productsByUser[userId].slice(0, 5).forEach(product => {
      console.log(`  - ${product.product_name} ($${product.purchase_price}) - ${product.retailer}`);
    });
    
    if (productsByUser[userId].length > 5) {
      console.log(`  ... and ${productsByUser[userId].length - 5} more`);
    }
  });
  
  // Check for products with different user IDs
  console.log('\n=== UNIQUE USER IDs ===');
  const uniqueUserIds = [...new Set(allProducts?.map(p => p.user_id) || [])];
  uniqueUserIds.forEach(userId => {
    const count = allProducts?.filter(p => p.user_id === userId).length || 0;
    console.log(`User ID: ${userId} - ${count} products`);
  });
  
  // Check sources
  console.log('\n=== SOURCE ANALYSIS ===');
  const sources = {};
  allProducts?.forEach(product => {
    const source = product.source || 'unknown';
    sources[source] = (sources[source] || 0) + 1;
  });
  
  Object.keys(sources).forEach(source => {
    console.log(`${source}: ${sources[source]} products`);
  });
  
  // Check recent products
  console.log('\n=== RECENT PRODUCTS (Last 10) ===');
  const recentProducts = allProducts?.slice(-10) || [];
  recentProducts.forEach(product => {
    console.log(`${product.product_name} - $${product.purchase_price} - ${product.retailer} - User: ${product.user_id}`);
  });
}

checkActualProducts().catch(console.error);
