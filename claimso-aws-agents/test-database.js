const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fryifnzncbfeodmuziut.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyeWlmbnpuY2JmZW9kbXV6aXV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDcyMDAzNCwiZXhwIjoyMDcwMjk2MDM0fQ.NRbzUfpPUSwfgY_QmSUoS93bTzSLXUBhzebDLz7AIoQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabase() {
  console.log('Testing database connection...');
  
  // Test 1: Get users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  console.log('Auth users:', authUsers?.users?.length || 0);
  if (authError) console.error('Auth error:', authError);
  
  // Test 2: Check if products table exists
  const { data: tables, error: tableError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'products');
  
  console.log('Products table exists:', tables?.length > 0);
  if (tableError) console.error('Table check error:', tableError);
  
  // Test 3: Try to create a test product
  if (authUsers?.users?.length > 0) {
    const testUserId = authUsers.users[0].id;
    console.log('Testing with user ID:', testUserId);
    
    const testProduct = {
      user_id: testUserId,
      product_name: 'Test Product',
      brand: 'Test Brand',
      model: 'Test Model',
      category: 'Electronics',
      purchase_date: new Date().toISOString(),
      purchase_price: 100,
      currency: 'USD',
      purchase_location: 'Online',
      serial_number: '',
      condition: 'new',
      notes: 'Test description',
      is_archived: false,
      warranty_length_months: 12,
      payment_method: 'Credit Card',
      retailer_url: '',
      affiliate_id: '',
      name: 'Test Product',
      description: 'Test description',
      retailer: 'Test Retailer',
      order_number: 'TEST-123',
      warranty_info: {},
      market_value: 100
    };
    
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert([testProduct])
      .select('id')
      .single();
    
    console.log('Product created:', product?.id);
    if (productError) console.error('Product creation error:', productError);
  }
}

testDatabase().catch(console.error);
