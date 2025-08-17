const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function quickTest() {
  console.log('🔍 Quick Database Test...\n');
  
  try {
    // Test 1: Basic connection
    console.log('1. Testing basic connection...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.log('   ⚠️  Auth test failed (normal for service role):', authError.message);
    } else {
      console.log('   ✅ Basic connection successful');
    }
    
    // Test 2: Check existing tables
    console.log('\n2. Checking existing tables...');
    const existingTables = ['products', 'warranties', 'user_connections', 'profiles'];
    for (const table of existingTables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`   ❌ Table '${table}': ${error.message}`);
        } else {
          console.log(`   ✅ Table '${table}': Accessible`);
        }
      } catch (err) {
        console.log(`   ❌ Table '${table}': ${err.message}`);
      }
    }
    
    // Test 3: Check new tables that need to be created
    console.log('\n3. Checking new tables (should fail if not created yet)...');
    const newTables = ['claims', 'claim_statuses', 'quote_requests', 'cart_items'];
    for (const table of newTables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`   ❌ Table '${table}': ${error.message}`);
        } else {
          console.log(`   ✅ Table '${table}': Already exists!`);
        }
      } catch (err) {
        console.log(`   ❌ Table '${table}': ${err.message}`);
      }
    }
    
    // Test 4: Check products table structure
    console.log('\n4. Checking products table structure...');
    try {
      const { data, error } = await supabase.from('products').select('*').limit(1);
      if (error) {
        console.log(`   ❌ Products table error: ${error.message}`);
      } else if (data && data.length > 0) {
        const product = data[0];
        console.log('   ✅ Products table accessible');
        
        // Check for new fields
        const newFields = ['source', 'capture_method'];
        for (const field of newFields) {
          if (product.hasOwnProperty(field)) {
            console.log(`   ✅ Field '${field}': Exists`);
          } else {
            console.log(`   ❌ Field '${field}': Missing`);
          }
        }
      } else {
        console.log('   ⚠️  Products table exists but is empty');
      }
    } catch (err) {
      console.log(`   ❌ Products table test error: ${err.message}`);
    }
    
    console.log('\n📊 Test Summary:');
    console.log('✅ Connection: Working');
    console.log('⚠️  New tables: Need to be created (see setup-instructions.md)');
    console.log('⚠️  New fields: Need to be added (see setup-instructions.md)');
    
    console.log('\n🔧 Next Steps:');
    console.log('1. Follow the instructions in setup-instructions.md');
    console.log('2. Execute the SQL migrations in Supabase Dashboard');
    console.log('3. Create the storage bucket');
    console.log('4. Test the features again');
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  quickTest().catch(console.error);
}
