const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fryifnzncbfeodmuziut.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyeWlmbnpuY2JmZW9kbXV6aXV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDcyMDAzNCwiZXhwIjoyMDcwMjk2MDM0fQ.NRbzUfpPUSwfgY_QmSUoS93bTzSLXUBhzebDLz7AIoQ'
);

async function checkDatabaseSchema() {
  try {
    console.log('🔍 Checking database schema...');
    
    // Check if profiles table exists
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (profilesError) {
        console.log('❌ Profiles table error:', profilesError.message);
      } else {
        console.log('✅ Profiles table exists');
      }
    } catch (e) {
      console.log('❌ Profiles table does not exist');
    }

    // Check if products table exists
    try {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .limit(1);
      
      if (productsError) {
        console.log('❌ Products table error:', productsError.message);
      } else {
        console.log('✅ Products table exists');
      }
    } catch (e) {
      console.log('❌ Products table does not exist');
    }

    // Check if warranties table exists
    try {
      const { data: warranties, error: warrantiesError } = await supabase
        .from('warranties')
        .select('*')
        .limit(1);
      
      if (warrantiesError) {
        console.log('❌ Warranties table error:', warrantiesError.message);
      } else {
        console.log('✅ Warranties table exists');
      }
    } catch (e) {
      console.log('❌ Warranties table does not exist');
    }

    // Check if claims table exists
    try {
      const { data: claims, error: claimsError } = await supabase
        .from('claims')
        .select('*')
        .limit(1);
      
      if (claimsError) {
        console.log('❌ Claims table error:', claimsError.message);
      } else {
        console.log('✅ Claims table exists');
      }
    } catch (e) {
      console.log('❌ Claims table does not exist');
    }

    // Test the specific query that was failing
    console.log('\n🔍 Testing the failing query...');
    try {
      const { data: testProducts, error: testError } = await supabase
        .from('products')
        .select('id, warranties(*)')
        .eq('user_id', '5cbd0756-963e-4777-96d7-629edf66e0ca')
        .eq('is_archived', false)
        .limit(1);
      
      if (testError) {
        console.log('❌ Products with warranties query error:', testError.message);
      } else {
        console.log('✅ Products with warranties query works');
        console.log('Sample data:', testProducts);
      }
    } catch (e) {
      console.log('❌ Products with warranties query failed:', e.message);
    }

  } catch (error) {
    console.error('💥 Error checking schema:', error);
  }
}

checkDatabaseSchema();
