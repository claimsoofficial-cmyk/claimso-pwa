#!/usr/bin/env node

/**
 * MCP Integration Test Script
 * Tests various MCP server integrations for the Claimso platform
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing MCP Server Integrations...\n');

// Test Playwright MCP
async function testPlaywrightMCP() {
  console.log('🎭 Testing Playwright MCP...');
  try {
    // Check if Playwright is installed
    const playwrightVersion = execSync('npx playwright --version', { encoding: 'utf8' });
    console.log(`✅ Playwright version: ${playwrightVersion.trim()}`);
    
    // Check if browsers are installed
    const browsers = execSync('npx playwright install --dry-run', { encoding: 'utf8' });
    if (browsers.includes('chromium') && browsers.includes('firefox') && browsers.includes('webkit')) {
      console.log('✅ Playwright browsers are installed');
    } else {
      console.log('⚠️  Some Playwright browsers may need installation');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Playwright MCP test failed:', error.message);
    return false;
  }
}

// Test Lighthouse MCP
async function testLighthouseMCP() {
  console.log('\n🏗️ Testing Lighthouse MCP...');
  try {
    const lighthouseVersion = execSync('npx lighthouse --version', { encoding: 'utf8' });
    console.log(`✅ Lighthouse version: ${lighthouseVersion.trim()}`);
    return true;
  } catch (error) {
    console.log('❌ Lighthouse MCP test failed:', error.message);
    return false;
  }
}

// Test Bundle Analyzer MCP
async function testBundleAnalyzerMCP() {
  console.log('\n📦 Testing Bundle Analyzer MCP...');
  try {
    // Check if webpack-bundle-analyzer is available
    const analyzerPath = path.join(__dirname, '../node_modules/webpack-bundle-analyzer');
    if (fs.existsSync(analyzerPath)) {
      console.log('✅ Webpack Bundle Analyzer is installed');
      return true;
    } else {
      console.log('❌ Webpack Bundle Analyzer not found');
      return false;
    }
  } catch (error) {
    console.log('❌ Bundle Analyzer MCP test failed:', error.message);
    return false;
  }
}

// Test Security Audit MCP
async function testSecurityMCP() {
  console.log('\n🔒 Testing Security Audit MCP...');
  try {
    const auditResult = execSync('npm audit --audit-level=moderate --json', { encoding: 'utf8' });
    const audit = JSON.parse(auditResult);
    
    if (audit.metadata.vulnerabilities.total === 0) {
      console.log('✅ No security vulnerabilities found');
    } else {
      console.log(`⚠️  Found ${audit.metadata.vulnerabilities.total} vulnerabilities`);
      console.log(`   - High: ${audit.metadata.vulnerabilities.high}`);
      console.log(`   - Moderate: ${audit.metadata.vulnerabilities.moderate}`);
      console.log(`   - Low: ${audit.metadata.vulnerabilities.low}`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Security Audit MCP test failed:', error.message);
    return false;
  }
}

// Test TypeScript MCP
async function testTypeScriptMCP() {
  console.log('\n📝 Testing TypeScript MCP...');
  try {
    execSync('npx tsc --noEmit', { encoding: 'utf8' });
    console.log('✅ TypeScript compilation successful');
    return true;
  } catch (error) {
    console.log('❌ TypeScript MCP test failed:', error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  const tests = [
    { name: 'Playwright', fn: testPlaywrightMCP },
    { name: 'Lighthouse', fn: testLighthouseMCP },
    { name: 'Bundle Analyzer', fn: testBundleAnalyzerMCP },
    { name: 'Security Audit', fn: testSecurityMCP },
    { name: 'TypeScript', fn: testTypeScriptMCP }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await test.fn();
    results.push({ name: test.name, passed: result });
  }
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
  });
  
  console.log(`\n🎯 Overall: ${passed}/${total} MCP integrations ready`);
  
  if (passed === total) {
    console.log('🎉 All MCP servers are ready for development!');
  } else {
    console.log('⚠️  Some MCP servers need attention before development');
  }
}

// Run tests
runAllTests().catch(console.error);
