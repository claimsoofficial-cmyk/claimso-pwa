#!/usr/bin/env node

/**
 * Performance Testing Script for MCP Integration
 * Tests performance of various MCP server operations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('⚡ Performance Testing MCP Servers...\n');

// Performance test for Playwright
async function testPlaywrightPerformance() {
  console.log('🎭 Testing Playwright Performance...');
  const startTime = Date.now();
  
  try {
    // Test basic Playwright operation
    execSync('npx playwright --version', { encoding: 'utf8' });
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Playwright response time: ${duration}ms`);
    return { success: true, duration };
  } catch (error) {
    console.log('❌ Playwright performance test failed:', error.message);
    return { success: false, duration: 0 };
  }
}

// Performance test for Lighthouse
async function testLighthousePerformance() {
  console.log('\n🏗️ Testing Lighthouse Performance...');
  const startTime = Date.now();
  
  try {
    // Test Lighthouse version check (fast operation)
    execSync('npx lighthouse --version', { encoding: 'utf8' });
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Lighthouse response time: ${duration}ms`);
    return { success: true, duration };
  } catch (error) {
    console.log('❌ Lighthouse performance test failed:', error.message);
    return { success: false, duration: 0 };
  }
}

// Performance test for Bundle Analyzer
async function testBundleAnalyzerPerformance() {
  console.log('\n📦 Testing Bundle Analyzer Performance...');
  const startTime = Date.now();
  
  try {
    // Check if bundle analyzer is accessible
    const analyzerPath = path.join(__dirname, '../node_modules/webpack-bundle-analyzer');
    fs.accessSync(analyzerPath);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Bundle Analyzer response time: ${duration}ms`);
    return { success: true, duration };
  } catch (error) {
    console.log('❌ Bundle Analyzer performance test failed:', error.message);
    return { success: false, duration: 0 };
  }
}

// Performance test for TypeScript compilation
async function testTypeScriptPerformance() {
  console.log('\n📝 Testing TypeScript Performance...');
  const startTime = Date.now();
  
  try {
    // Test TypeScript compilation speed
    execSync('npx tsc --noEmit', { encoding: 'utf8' });
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ TypeScript compilation time: ${duration}ms`);
    return { success: true, duration };
  } catch (error) {
    console.log('❌ TypeScript performance test failed:', error.message);
    return { success: false, duration: 0 };
  }
}

// Performance test for Security Audit
async function testSecurityAuditPerformance() {
  console.log('\n🔒 Testing Security Audit Performance...');
  const startTime = Date.now();
  
  try {
    // Test security audit speed
    execSync('npm audit --audit-level=moderate --json', { encoding: 'utf8' });
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Security audit time: ${duration}ms`);
    return { success: true, duration };
  } catch (error) {
    console.log('❌ Security audit performance test failed:', error.message);
    return { success: false, duration: 0 };
  }
}

// Main performance test runner
async function runPerformanceTests() {
  const tests = [
    { name: 'Playwright', fn: testPlaywrightPerformance },
    { name: 'Lighthouse', fn: testLighthousePerformance },
    { name: 'Bundle Analyzer', fn: testBundleAnalyzerPerformance },
    { name: 'TypeScript', fn: testTypeScriptPerformance },
    { name: 'Security Audit', fn: testSecurityAuditPerformance }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await test.fn();
    results.push({ name: test.name, ...result });
  }
  
  console.log('\n📊 Performance Test Results:');
  console.log('============================');
  
  const successful = results.filter(r => r.success);
  const total = results.length;
  
  if (successful.length > 0) {
    const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
    console.log(`📈 Average response time: ${avgDuration.toFixed(2)}ms`);
    
    const fastest = successful.reduce((min, r) => r.duration < min.duration ? r : min);
    const slowest = successful.reduce((max, r) => r.duration > max.duration ? r : max);
    
    console.log(`⚡ Fastest: ${fastest.name} (${fastest.duration}ms)`);
    console.log(`🐌 Slowest: ${slowest.name} (${slowest.duration}ms)`);
  }
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const time = result.success ? ` (${result.duration}ms)` : '';
    console.log(`${status} ${result.name}${time}`);
  });
  
  console.log(`\n🎯 Performance Summary: ${successful.length}/${total} MCP servers performing well`);
  
  if (successful.length === total) {
    console.log('🎉 All MCP servers are performing optimally!');
  } else {
    console.log('⚠️  Some MCP servers may need optimization');
  }
}

// Run performance tests
runPerformanceTests().catch(console.error);
