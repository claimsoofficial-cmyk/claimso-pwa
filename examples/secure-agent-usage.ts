// ==============================================================================
// SECURE AGENT USAGE EXAMPLE
// ==============================================================================
// This example shows how to use the new secure agent database system
// instead of the vulnerable service role key approach

import { createAgentDatabase } from '@/lib/services/secure-agent-database';

// Example: Email Monitoring Agent
async function emailMonitoringAgentExample() {
  console.log('📧 Email Monitoring Agent Example');
  
  try {
    // Create secure database instance for email monitoring agent
    const agentDb = createAgentDatabase('email-monitoring', 'user-123');
    
    // Initialize the secure connection
    await agentDb.initialize();
    
    console.log('✅ Agent initialized with JWT token');
    console.log('🔐 Agent info:', agentDb.getAgentInfo());
    
    // Example: Process email and create product
    const emailData = {
      user_id: 'user-123',
      product_name: 'iPhone 15 Pro',
      brand: 'Apple',
      category: 'Electronics',
      purchase_date: new Date().toISOString(),
      purchase_price: 999.99,
      retailer: 'Amazon',
      source: 'email-monitoring'
    };
    
    // Create product using secure database
    const newProduct = await agentDb.createProduct(emailData);
    console.log('✅ Product created securely:', newProduct.id);
    
    // Example: Get user connections for email processing
    const userConnections = await agentDb.getUserConnections('user-123');
    console.log('✅ Retrieved user connections:', userConnections.length);
    
  } catch (error) {
    console.error('❌ Agent error:', error);
  }
}

// Example: Product Intelligence Agent
async function productIntelligenceAgentExample() {
  console.log('\n🤖 Product Intelligence Agent Example');
  
  try {
    // Create secure database instance for product intelligence agent
    const agentDb = createAgentDatabase('product-intelligence');
    
    // Initialize the secure connection
    await agentDb.initialize();
    
    console.log('✅ Agent initialized with JWT token');
    
    // Example: Get products for enrichment
    const products = await agentDb.getProducts();
    console.log('✅ Retrieved products for enrichment:', products.length);
    
    // Example: Update product with enriched data
    if (products.length > 0) {
      const productId = products[0].id;
      const enrichedData = {
        market_value: 850.00,
        depreciation_rate: 0.15,
        last_updated: new Date().toISOString(),
        ai_enrichment_score: 0.95
      };
      
      const updatedProduct = await agentDb.updateProduct(productId as string, enrichedData);
      console.log('✅ Product enriched securely:', updatedProduct.id);
    }
    
  } catch (error) {
    console.error('❌ Agent error:', error);
  }
}

// Example: Warranty Intelligence Agent
async function warrantyIntelligenceAgentExample() {
  console.log('\n🛡️ Warranty Intelligence Agent Example');
  
  try {
    // Create secure database instance for warranty intelligence agent
    const agentDb = createAgentDatabase('warranty-intelligence');
    
    // Initialize the secure connection
    await agentDb.initialize();
    
    console.log('✅ Agent initialized with JWT token');
    
    // Example: Get products for warranty research
    const products = await agentDb.getProducts();
    console.log('✅ Retrieved products for warranty research:', products.length);
    
    // Example: Create warranty information
    if (products.length > 0) {
      const warrantyData = {
        product_id: products[0].id,
        warranty_type: 'manufacturer',
        coverage_period_months: 12,
        coverage_details: {
          covers: ['Hardware defects', 'Manufacturing faults'],
          does_not_cover: ['Water damage', 'Physical damage'],
          key_terms: ['Valid for 12 months from purchase date']
        },
        ai_confidence_score: 0.92,
        source: 'warranty-intelligence-agent'
      };
      
      const newWarranty = await agentDb.createWarranty(warrantyData);
      console.log('✅ Warranty created securely:', newWarranty.id);
    }
    
  } catch (error) {
    console.error('❌ Agent error:', error);
  }
}

// Example: Mobile App Agent
async function mobileAppAgentExample() {
  console.log('\n📱 Mobile App Agent Example');
  
  try {
    // Create secure database instance for mobile app agent
    const agentDb = createAgentDatabase('mobile-app', 'user-456');
    
    // Initialize the secure connection
    await agentDb.initialize();
    
    console.log('✅ Agent initialized with JWT token');
    
    // Example: Process receipt upload
    const receiptData = {
      user_id: 'user-456',
      product_name: 'Samsung Galaxy S24',
      brand: 'Samsung',
      category: 'Electronics',
      purchase_date: new Date().toISOString(),
      purchase_price: 899.99,
      retailer: 'Best Buy',
      source: 'mobile-app-upload'
    };
    
    // Create product from receipt
    const newProduct = await agentDb.createProduct(receiptData);
    console.log('✅ Product created from receipt:', newProduct.id);
    
    // Example: Create document record for receipt
    const documentData = {
      product_id: newProduct.id,
      file_url: 'https://storage.example.com/receipts/receipt-123.pdf',
      document_type: 'receipt',
      is_primary: true,
      uploaded_at: new Date().toISOString()
    };
    
    const newDocument = await agentDb.createDocument(documentData);
    console.log('✅ Document created securely:', newDocument.id);
    
  } catch (error) {
    console.error('❌ Agent error:', error);
  }
}

// Example: Permission checking
async function permissionCheckingExample() {
  console.log('\n🔐 Permission Checking Example');
  
  try {
    // Create different agent types
    const emailAgent = createAgentDatabase('email-monitoring');
    const warrantyAgent = createAgentDatabase('warranty-intelligence');
    const mobileAgent = createAgentDatabase('mobile-app');
    
    // Initialize agents
    await emailAgent.initialize();
    await warrantyAgent.initialize();
    await mobileAgent.initialize();
    
    // Check permissions
    console.log('📧 Email Agent permissions:');
    console.log('   Can read products:', emailAgent.hasPermission('read:products'));
    console.log('   Can write products:', emailAgent.hasPermission('write:products'));
    console.log('   Can read warranties:', emailAgent.hasPermission('read:warranties'));
    
    console.log('\n🛡️ Warranty Agent permissions:');
    console.log('   Can read products:', warrantyAgent.hasPermission('read:products'));
    console.log('   Can write warranties:', warrantyAgent.hasPermission('write:warranties'));
    console.log('   Can write documents:', warrantyAgent.hasPermission('write:documents'));
    
    console.log('\n📱 Mobile Agent permissions:');
    console.log('   Can write products:', mobileAgent.hasPermission('write:products'));
    console.log('   Can write documents:', mobileAgent.hasPermission('write:documents'));
    console.log('   Can read warranties:', mobileAgent.hasPermission('read:warranties'));
    
  } catch (error) {
    console.error('❌ Permission checking error:', error);
  }
}

// Run all examples
async function runAllExamples() {
  console.log('🚀 Running Secure Agent Examples\n');
  
  await emailMonitoringAgentExample();
  await productIntelligenceAgentExample();
  await warrantyIntelligenceAgentExample();
  await mobileAppAgentExample();
  await permissionCheckingExample();
  
  console.log('\n🎉 All examples completed successfully!');
  console.log('\n🔐 Security benefits achieved:');
  console.log('   • No more service role key usage');
  console.log('   • JWT-based authentication');
  console.log('   • Permission-based access control');
  console.log('   • Row-level security enforcement');
  console.log('   • Principle-of-least-privilege access');
}

// Export for use in other files
export {
  emailMonitoringAgentExample,
  productIntelligenceAgentExample,
  warrantyIntelligenceAgentExample,
  mobileAppAgentExample,
  permissionCheckingExample,
  runAllExamples
};

// Run if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
