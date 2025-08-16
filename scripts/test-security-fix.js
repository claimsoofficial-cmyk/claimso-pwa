const { createClient } = require('@supabase/supabase-js');
const { SignJWT } = require('jose');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const agentJwtSecret = process.env.AGENT_JWT_SECRET || 'your-agent-jwt-secret-change-this';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Agent authentication configuration
const AGENT_JWT_ISSUER = 'claimso-agent-system';
const AGENT_JWT_AUDIENCE = 'claimso-agents';

// Generate JWT token for agent authentication
async function generateAgentToken(agentType, userId) {
  const secret = new TextEncoder().encode(agentJwtSecret);
  
  const permissions = {
    'email-monitoring': ['read:emails', 'create:products', 'read:users'],
    'retailer-api': ['read:retailer_data', 'create:products', 'update:products'],
    'bank-integration': ['read:transactions', 'create:products', 'read:users'],
    'duplicate-detection': ['read:products', 'update:products', 'delete:products'],
    'product-intelligence': ['read:products', 'update:products', 'read:market_data'],
    'warranty-intelligence': ['read:products', 'update:warranties', 'read:warranty_data'],
    'warranty-claim': ['read:products', 'create:claims', 'update:claims'],
    'cash-extraction': ['read:products', 'read:market_data', 'create:offers'],
    'browser-extension': ['create:products', 'read:users'],
    'mobile-app': ['create:products', 'read:users']
  };
  
  const token = await new SignJWT({
    agentId: `${agentType}-${Date.now()}`,
    agentType: agentType,
    permissions: permissions[agentType] || [],
    userId: userId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(AGENT_JWT_ISSUER)
    .setAudience(AGENT_JWT_AUDIENCE)
    .setExpirationTime('1h')
    .sign(secret);
    
  return token;
}

async function testSecurityFix() {
  try {
    console.log('🔒 Testing Security Fix Implementation...\n');
    
    // Test 1: Generate agent token
    console.log('1. Testing JWT token generation...');
    const agentToken = await generateAgentToken('email-monitoring', 'test-user-id');
    console.log('   ✅ Agent token generated successfully');
    console.log(`   📝 Token length: ${agentToken.length} characters`);
    
    // Test 2: Create secure Supabase client
    console.log('\n2. Testing secure Supabase client...');
    const secureSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${agentToken}`,
        },
      },
    });
    console.log('   ✅ Secure Supabase client created');
    
    // Test 3: Test database access with agent token
    console.log('\n3. Testing database access with agent token...');
    try {
      const { data, error } = await secureSupabase
        .from('products')
        .select('id, product_name')
        .limit(1);
      
      if (error) {
        console.log(`   ⚠️  Database access test: ${error.message}`);
        console.log('   💡 This is expected if RLS policies are not yet applied');
      } else {
        console.log('   ✅ Database access successful with agent token');
        console.log(`   📊 Found ${data?.length || 0} products`);
      }
    } catch (err) {
      console.log(`   ⚠️  Database access error: ${err.message}`);
    }
    
    // Test 4: Test without agent token (should fail)
    console.log('\n4. Testing database access without agent token...');
    const regularSupabase = createClient(supabaseUrl, supabaseAnonKey);
    
    try {
      const { data, error } = await regularSupabase
        .from('products')
        .select('id, product_name')
        .limit(1);
      
      if (error) {
        console.log(`   ✅ Expected error without agent token: ${error.message}`);
      } else {
        console.log('   ⚠️  Database access allowed without agent token');
        console.log('   💡 This suggests RLS policies need to be applied');
      }
    } catch (err) {
      console.log(`   ✅ Expected exception without agent token: ${err.message}`);
    }
    
    console.log('\n📊 Security Fix Test Summary:');
    console.log('   ✅ JWT token generation: Working');
    console.log('   ✅ Secure client creation: Working');
    console.log('   ⚠️  RLS policies: Need to be applied manually');
    
    console.log('\n🔧 Next Steps:');
    console.log('   1. Apply RLS policies manually in Supabase Dashboard');
    console.log('   2. Test agent authentication with real data');
    console.log('   3. Deploy updated AWS agents with new authentication');
    
  } catch (error) {
    console.error('❌ Security fix test failed:', error);
    process.exit(1);
  }
}

// Run the test
testSecurityFix();
