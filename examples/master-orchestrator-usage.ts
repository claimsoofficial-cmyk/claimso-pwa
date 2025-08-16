// ==============================================================================
// MASTER ORCHESTRATOR USAGE EXAMPLE
// ==============================================================================
// This example shows how to use the new master orchestrator system
// to coordinate all agents intelligently

// Example API calls to the master orchestrator
async function masterOrchestratorExamples() {
  console.log('🤖 Master Orchestrator Examples\n');

  // Example 1: Purchase Detection Request
  await examplePurchaseDetection();

  // Example 2: Product Enrichment Request
  await exampleProductEnrichment();

  // Example 3: Warranty Research Request
  await exampleWarrantyResearch();

  // Example 4: Value Optimization Request
  await exampleValueOptimization();

  // Example 5: User Query Request
  await exampleUserQuery();

  // Example 6: System Health Check
  await exampleHealthCheck();
}

// Example 1: Purchase Detection
async function examplePurchaseDetection() {
  console.log('📧 Example 1: Purchase Detection Request');
  
  const request = {
    userId: 'user-123',
    intent: {
      type: 'purchase_detection',
      action: 'detect_purchase',
      parameters: {
        text: 'I just bought an iPhone 15 Pro from Apple Store',
        source: 'pwa',
        entities: [
          { type: 'product', value: 'iPhone 15 Pro', confidence: 0.9 },
          { type: 'retailer', value: 'Apple Store', confidence: 0.95 }
        ]
      },
      confidence: 0.85,
      entities: []
    },
    context: {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      ipAddress: '192.168.1.100',
      deviceInfo: {
        type: 'mobile',
        platform: 'iOS',
        browser: 'Safari'
      }
    },
    priority: 'high',
    source: 'pwa'
  };

  console.log('Request:', JSON.stringify(request, null, 2));
  console.log('Expected Workflow:');
  console.log('  1. Email Monitoring Agent - Detect purchase emails');
  console.log('  2. Duplicate Detection Agent - Check for duplicates');
  console.log('  3. Product Intelligence Agent - Enrich product data');
  console.log('  4. Warranty Intelligence Agent - Research warranty');
  console.log('✅ Purchase detection workflow created\n');
}

// Example 2: Product Enrichment
async function exampleProductEnrichment() {
  console.log('🔍 Example 2: Product Enrichment Request');
  
  const request = {
    userId: 'user-456',
    intent: {
      type: 'product_enrichment',
      action: 'enrich_product',
      parameters: {
        text: 'Get more details about my MacBook Pro',
        entities: [
          { type: 'product', value: 'MacBook Pro', confidence: 0.8 }
        ]
      },
      confidence: 0.80,
      entities: []
    },
    context: {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      ipAddress: '192.168.1.101',
      deviceInfo: {
        type: 'desktop',
        platform: 'macOS',
        browser: 'Chrome'
      }
    },
    priority: 'medium',
    source: 'pwa'
  };

  console.log('Request:', JSON.stringify(request, null, 2));
  console.log('Expected Workflow:');
  console.log('  1. Product Intelligence Agent - Get existing products');
  console.log('  2. Product Intelligence Agent - Enrich product data');
  console.log('✅ Product enrichment workflow created\n');
}

// Example 3: Warranty Research
async function exampleWarrantyResearch() {
  console.log('🛡️ Example 3: Warranty Research Request');
  
  const request = {
    userId: 'user-789',
    intent: {
      type: 'warranty_research',
      action: 'research_warranty',
      parameters: {
        text: 'Check warranty coverage for my Samsung TV',
        entities: [
          { type: 'product', value: 'Samsung TV', confidence: 0.85 }
        ]
      },
      confidence: 0.90,
      entities: []
    },
    context: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      ipAddress: '192.168.1.102',
      deviceInfo: {
        type: 'desktop',
        platform: 'Windows',
        browser: 'Firefox'
      }
    },
    priority: 'medium',
    source: 'pwa'
  };

  console.log('Request:', JSON.stringify(request, null, 2));
  console.log('Expected Workflow:');
  console.log('  1. Warranty Intelligence Agent - Get products for warranty research');
  console.log('  2. Warranty Intelligence Agent - Research warranties');
  console.log('✅ Warranty research workflow created\n');
}

// Example 4: Value Optimization
async function exampleValueOptimization() {
  console.log('💰 Example 4: Value Optimization Request');
  
  const request = {
    userId: 'user-123',
    intent: {
      type: 'value_optimization',
      action: 'optimize_value',
      parameters: {
        text: 'Find the best way to sell my old iPhone',
        entities: [
          { type: 'product', value: 'iPhone', confidence: 0.8 }
        ]
      },
      confidence: 0.75,
      entities: []
    },
    context: {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      ipAddress: '192.168.1.100',
      deviceInfo: {
        type: 'mobile',
        platform: 'iOS',
        browser: 'Safari'
      }
    },
    priority: 'high',
    source: 'pwa'
  };

  console.log('Request:', JSON.stringify(request, null, 2));
  console.log('Expected Workflow:');
  console.log('  1. Cash Extraction Agent - Get products for value optimization');
  console.log('  2. Cash Extraction Agent - Find value opportunities');
  console.log('✅ Value optimization workflow created\n');
}

// Example 5: User Query
async function exampleUserQuery() {
  console.log('❓ Example 5: User Query Request');
  
  const request = {
    userId: 'user-456',
    intent: {
      type: 'user_query',
      action: 'answer_query',
      parameters: {
        text: 'What is the current value of my laptop?',
        entities: [
          { type: 'product', value: 'laptop', confidence: 0.7 }
        ]
      },
      confidence: 0.70,
      entities: []
    },
    context: {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      ipAddress: '192.168.1.101',
      deviceInfo: {
        type: 'desktop',
        platform: 'macOS',
        browser: 'Chrome'
      }
    },
    priority: 'medium',
    source: 'pwa'
  };

  console.log('Request:', JSON.stringify(request, null, 2));
  console.log('Expected Workflow:');
  console.log('  1. Product Intelligence Agent - Process query');
  console.log('✅ User query workflow created\n');
}

// Example 6: Health Check
async function exampleHealthCheck() {
  console.log('🏥 Example 6: System Health Check');
  
  const healthCheckRequest = {
    method: 'GET',
    path: '/orchestrator/health',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  console.log('Health Check Request:', JSON.stringify(healthCheckRequest, null, 2));
  console.log('Expected Response:');
  console.log('  - Overall system status');
  console.log('  - Individual agent health');
  console.log('  - Response times and error rates');
  console.log('  - Active workflows count');
  console.log('✅ Health check completed\n');
}

// Example API call function (simulated)
async function callMasterOrchestrator(endpoint: string, data?: any) {
  const baseUrl = 'https://your-api-gateway-url.amazonaws.com/dev';
  const url = `${baseUrl}${endpoint}`;
  
  console.log(`🌐 Calling: ${url}`);
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('📡 Response received');
  return {
    success: true,
    data: {
      workflowId: `workflow-${Date.now()}`,
      status: 'completed',
      executionTime: 2500,
      steps: [
        { name: 'Step 1', status: 'completed', duration: 800 },
        { name: 'Step 2', status: 'completed', duration: 1200 },
        { name: 'Step 3', status: 'completed', duration: 500 }
      ]
    }
  };
}

// Example workflow monitoring
async function monitorWorkflow(workflowId: string) {
  console.log(`📊 Monitoring workflow: ${workflowId}`);
  
  // Simulate real-time monitoring
  const events = [
    { time: '0s', event: 'Workflow started', status: 'running' },
    { time: '0.8s', event: 'Step 1 completed', status: 'running' },
    { time: '2.0s', event: 'Step 2 completed', status: 'running' },
    { time: '2.5s', event: 'Step 3 completed', status: 'completed' }
  ];
  
  for (const event of events) {
    console.log(`  ${event.time}: ${event.event} (${event.status})`);
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('✅ Workflow monitoring completed\n');
}

// Run all examples
async function runAllExamples() {
  console.log('🚀 Running Master Orchestrator Examples\n');
  
  await masterOrchestratorExamples();
  
  console.log('🎉 All examples completed successfully!');
  console.log('\n🔧 Master Orchestrator benefits:');
  console.log('   • Intelligent intent recognition');
  console.log('   • Coordinated workflow execution');
  console.log('   • Real-time event processing');
  console.log('   • Agent health monitoring');
  console.log('   • Error handling and retry logic');
  console.log('   • Performance optimization');
}

// Export for use in other files
export {
  masterOrchestratorExamples,
  examplePurchaseDetection,
  exampleProductEnrichment,
  exampleWarrantyResearch,
  exampleValueOptimization,
  exampleUserQuery,
  exampleHealthCheck,
  callMasterOrchestrator,
  monitorWorkflow,
  runAllExamples
};

// Run if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
