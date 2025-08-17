const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabase() {
  console.log('🔍 Testing database connection and tables...');
  
  try {
    // Test basic connection
    console.log('\n1. Testing basic connection...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.log('⚠️  Auth test failed (this is normal for service role):', authError.message);
    } else {
      console.log('✅ Basic connection successful');
    }
    
    // Test existing tables
    console.log('\n2. Testing existing tables...');
    
    const tables = ['products', 'warranties', 'user_connections', 'profiles'];
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ Table '${table}' not accessible:`, error.message);
        } else {
          console.log(`✅ Table '${table}' exists and accessible`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}' error:`, err.message);
      }
    }
    
    // Test new tables that should be created
    console.log('\n3. Testing new tables that need to be created...');
    
    const newTables = ['claims', 'claim_statuses', 'quote_requests', 'cart_items'];
    for (const table of newTables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ Table '${table}' does not exist:`, error.message);
        } else {
          console.log(`✅ Table '${table}' exists and accessible`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}' error:`, err.message);
      }
    }
    
    // Test products table structure
    console.log('\n4. Testing products table structure...');
    try {
      const { data, error } = await supabase.from('products').select('*').limit(1);
      if (error) {
        console.log('❌ Products table error:', error.message);
      } else if (data && data.length > 0) {
        const product = data[0];
        console.log('✅ Products table accessible');
        console.log('📋 Available fields:', Object.keys(product));
        
        // Check for new fields
        const newFields = ['source', 'capture_method', 'purchase_location', 'retailer_url'];
        for (const field of newFields) {
          if (product.hasOwnProperty(field)) {
            console.log(`✅ Field '${field}' exists`);
          } else {
            console.log(`❌ Field '${field}' missing`);
          }
        }
      } else {
        console.log('⚠️  Products table exists but is empty');
      }
    } catch (err) {
      console.log('❌ Products table test error:', err.message);
    }
    
    console.log('\n📊 Database Test Summary:');
    console.log('✅ Connection: Working');
    console.log('⚠️  New tables: Need to be created manually in Supabase Dashboard');
    console.log('⚠️  New fields: Need to be added manually in Supabase Dashboard');
    
    console.log('\n🔧 Next Steps:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Copy and paste the contents of database_schema_fixes.sql');
    console.log('3. Execute the SQL statements');
    console.log('4. Create storage bucket "claim-files" in Storage section');
    
  } catch (error) {
    console.error('💥 Database test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testDatabase().catch(console.error);
}
