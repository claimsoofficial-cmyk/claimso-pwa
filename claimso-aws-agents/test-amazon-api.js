#!/usr/bin/env node

/**
 * Test script for Amazon API integration
 * Run with: node test-amazon-api.js
 */

const { AmazonAPIClient } = require('./dist/handlers/amazon-api-client');

async function testAmazonAPI() {
  console.log('🧪 Testing Amazon API Integration...\n');

  // Test with mock token (replace with real token for actual testing)
  const mockToken = 'mock_access_token';
  const client = new AmazonAPIClient(mockToken);

  try {
    console.log('✅ AmazonAPIClient created successfully');
    console.log('✅ Ready to test with real Amazon credentials\n');

    console.log('📋 To test with real credentials:');
    console.log('1. Set AMAZON_CLIENT_ID and AMAZON_CLIENT_SECRET in .env');
    console.log('2. Get real access token from OAuth flow');
    console.log('3. Replace mockToken with real token');
    console.log('4. Run this test again\n');

    console.log('🔧 Next steps:');
    console.log('- Deploy updated agents: npm run build && serverless deploy');
    console.log('- Test OAuth flow in the PWA');
    console.log('- Monitor agent logs for real data');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAmazonAPI().catch(console.error);
