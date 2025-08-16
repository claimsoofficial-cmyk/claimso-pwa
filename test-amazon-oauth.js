#!/usr/bin/env node

/**
 * Test Amazon OAuth Integration
 * Run with: node test-amazon-oauth.js
 */

const { createClient } = require('@supabase/supabase-js');

async function testAmazonOAuth() {
  console.log('🧪 Testing Amazon OAuth Integration...\n');

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fryifnzncbfeodmuziut.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyeWlmbnpuY2JmZW9kbXV6aXV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE1NDcyMDAzNCwiZXhwIjoyMDcwMjk2MDM0fQ.NRbzUfpPUSwfgY_QmSUoS93bTzSLXUBhzebDLz7AIoQ'
  );

  try {
    // Check if user_connections table exists and has data
    console.log('📊 Checking user_connections table...');
    
    const { data: connections, error } = await supabase
      .from('user_connections')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Error accessing user_connections:', error.message);
      console.log('💡 This might mean:');
      console.log('   - Table doesn\'t exist yet');
      console.log('   - RLS policies are blocking access');
      console.log('   - Need to run OAuth flow first');
    } else {
      console.log(`✅ Found ${connections?.length || 0} user connections`);
      if (connections && connections.length > 0) {
        connections.forEach((conn, index) => {
          console.log(`   ${index + 1}. User: ${conn.user_id}, Provider: ${conn.provider}, Active: ${conn.is_active}`);
        });
      }
    }

    // Check if profiles table has Amazon connection status
    console.log('\n📊 Checking profiles table for Amazon connections...');
    
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, amazon_connected, amazon_connected_at')
      .limit(5);

    if (profileError) {
      console.error('❌ Error accessing profiles:', profileError.message);
    } else {
      console.log(`✅ Found ${profiles?.length || 0} profiles`);
      if (profiles && profiles.length > 0) {
        profiles.forEach((profile, index) => {
          console.log(`   ${index + 1}. User: ${profile.id}, Amazon Connected: ${profile.amazon_connected || false}`);
        });
      }
    }

    console.log('\n🎯 Next Steps:');
    console.log('1. Go to https://claimso-pwa.vercel.app');
    console.log('2. Sign in and complete Amazon OAuth flow');
    console.log('3. Run this test again to see the connection data');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAmazonOAuth().catch(console.error);
