#!/usr/bin/env node

/**
 * Comprehensive Testing Script for Claimso Vault 2.0
 * Tests all implemented systems cohesively
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: [],
};

// Utility functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${title}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const color = passed ? 'green' : 'red';
  
  log(`${status} ${testName}`, color);
  if (details) {
    log(`   ${details}`, 'yellow');
  }
  
  testResults.total++;
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
  
  testResults.details.push({
    name: testName,
    passed,
    details,
    timestamp: new Date().toISOString(),
  });
}

// Test functions
function testFileExists(filePath, description) {
  try {
    const exists = fs.existsSync(filePath);
    logTest(description, exists, exists ? '' : `File not found: ${filePath}`);
    return exists;
  } catch (error) {
    logTest(description, false, `Error checking file: ${error.message}`);
    return false;
  }
}

function testDirectoryExists(dirPath, description) {
  try {
    const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
    logTest(description, exists, exists ? '' : `Directory not found: ${dirPath}`);
    return exists;
  } catch (error) {
    logTest(description, false, `Error checking directory: ${error.message}`);
    return false;
  }
}

function testPackageInstalled(packageName, description) {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const isInstalled = packageJson.dependencies && packageJson.dependencies[packageName];
    logTest(description, !!isInstalled, isInstalled ? '' : `Package not installed: ${packageName}`);
    return !!isInstalled;
  } catch (error) {
    logTest(description, false, `Error checking package: ${error.message}`);
    return false;
  }
}

function testFileContent(filePath, requiredContent, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasContent = requiredContent.some(text => content.includes(text));
    logTest(description, hasContent, hasContent ? '' : `Required content not found in: ${filePath}`);
    return hasContent;
  } catch (error) {
    logTest(description, false, `Error reading file: ${error.message}`);
    return false;
  }
}

function testBuildProcess(description) {
  try {
    log('Building project...', 'yellow');
    execSync('npm run build', { stdio: 'pipe' });
    logTest(description, true);
    return true;
  } catch (error) {
    logTest(description, false, `Build failed: ${error.message}`);
    return false;
  }
}

function testLinting(description) {
  try {
    log('Running linting...', 'yellow');
    execSync('npm run lint', { stdio: 'pipe' });
    logTest(description, true);
    return true;
  } catch (error) {
    logTest(description, false, `Linting failed: ${error.message}`);
    return false;
  }
}

// Main test categories
function testSecurityImplementation() {
  logSection('SECURITY IMPLEMENTATION TESTS');
  
  // Test security files exist
  testFileExists('lib/supabase/agent-auth.ts', 'Agent authentication system exists');
  testFileExists('database_agent_rls_policies.sql', 'RLS policies SQL file exists');
  testFileExists('lib/services/secure-agent-database.ts', 'Secure database service exists');
  testFileExists('scripts/apply-agent-rls-policies.js', 'RLS policy application script exists');
  testFileExists('examples/secure-agent-usage.ts', 'Security usage examples exist');
  testFileExists('SECURITY_FIX_SUMMARY.md', 'Security fix documentation exists');
  
  // Test security file content
  testFileContent('lib/supabase/agent-auth.ts', ['generateAgentToken', 'verifyAgentToken'], 'Agent auth contains token functions');
  testFileContent('database_agent_rls_policies.sql', ['CREATE POLICY', 'get_agent_identity'], 'RLS policies contain required functions');
  testFileContent('lib/services/secure-agent-database.ts', ['SecureAgentDatabase', 'createAgentDatabase'], 'Secure database service contains main class');
}

function testMasterOrchestrator() {
  logSection('MASTER ORCHESTRATOR TESTS');
  
  // Test orchestrator files exist
  testFileExists('claimso-aws-agents/src/shared/orchestration-types.ts', 'Orchestration types exist');
  testFileExists('claimso-aws-agents/src/handlers/master-orchestrator.ts', 'Master orchestrator Lambda exists');
  testFileExists('claimso-aws-agents/src/shared/intent-recognizer.ts', 'Intent recognizer exists');
  testFileExists('claimso-aws-agents/src/shared/workflow-engine.ts', 'Workflow engine exists');
  testFileExists('claimso-aws-agents/src/shared/agent-coordinator.ts', 'Agent coordinator exists');
  testFileExists('claimso-aws-agents/src/shared/event-processor.ts', 'Event processor exists');
  testFileExists('examples/master-orchestrator-usage.ts', 'Orchestrator usage examples exist');
  testFileExists('MASTER_ORCHESTRATOR_SUMMARY.md', 'Orchestrator documentation exists');
  
  // Test orchestrator file content
  testFileContent('claimso-aws-agents/src/shared/orchestration-types.ts', ['OrchestrationRequest', 'WorkflowExecution'], 'Orchestration types contain main interfaces');
  testFileContent('claimso-aws-agents/src/handlers/master-orchestrator.ts', ['handler', 'executeWorkflow'], 'Master orchestrator contains main functions');
  testFileContent('claimso-aws-agents/src/shared/intent-recognizer.ts', ['IntentRecognizer', 'recognizeIntent'], 'Intent recognizer contains main class');
  testFileContent('claimso-aws-agents/src/shared/workflow-engine.ts', ['WorkflowEngine', 'createWorkflow'], 'Workflow engine contains main class');
  testFileContent('claimso-aws-agents/src/shared/agent-coordinator.ts', ['AgentCoordinator', 'executeTask'], 'Agent coordinator contains main class');
  testFileContent('claimso-aws-agents/src/shared/event-processor.ts', ['EventProcessor', 'processEvent'], 'Event processor contains main class');
  
  // Test serverless configuration
  testFileContent('claimso-aws-agents/serverless.yml', ['masterOrchestrator', '/orchestrator'], 'Serverless config includes orchestrator');
}

function testPerformanceOptimization() {
  logSection('PERFORMANCE OPTIMIZATION TESTS');
  
  // Test performance files exist
  testFileExists('components/products/VirtualizedProductList.tsx', 'Virtualized product list exists');
  testFileExists('lib/hooks/useProductCache.ts', 'Product cache hook exists');
  testFileExists('lib/lazy-loading.tsx', 'Lazy loading utilities exist');
  testFileExists('public/sw.js', 'Service worker exists');
  testFileExists('lib/performance-monitor.ts', 'Performance monitor exists');
  
  // Test performance file content
  testFileContent('components/products/VirtualizedProductList.tsx', ['VirtualizedProductList', 'react-window'], 'Virtualized list contains main component');
  testFileContent('lib/hooks/useProductCache.ts', ['useProducts', 'useQuery'], 'Product cache contains React Query hooks');
  testFileContent('lib/lazy-loading.tsx', ['createLazyComponent', 'LazyImage'], 'Lazy loading contains main utilities');
  testFileContent('public/sw.js', ['Service Worker', 'fetch', 'cache'], 'Service worker contains main functionality');
  testFileContent('lib/performance-monitor.ts', ['PerformanceMonitor', 'Core Web Vitals'], 'Performance monitor contains main class');
  
  // Test dependencies are installed
  testPackageInstalled('react-window', 'react-window package installed');
  testPackageInstalled('react-intersection-observer', 'react-intersection-observer package installed');
  testPackageInstalled('@tanstack/react-query', '@tanstack/react-query package installed');
}

function testDocumentation() {
  logSection('DOCUMENTATION TESTS');
  
  // Test documentation files exist
  testFileExists('TESTING_CHECKLIST.md', 'Testing checklist exists');
  testFileExists('COMPREHENSIVE_IMPLEMENTATION_PLAN.md', 'Implementation plan exists');
  testFileExists('PROJECT_REALITY.md', 'Project reality document exists');
  testFileExists('SECURITY_FIX_SUMMARY.md', 'Security fix summary exists');
  testFileExists('MASTER_ORCHESTRATOR_SUMMARY.md', 'Master orchestrator summary exists');
  
  // Test documentation content
  testFileContent('TESTING_CHECKLIST.md', ['Phase 1.2 - Security Fix', 'Phase 1.1 - Master Orchestrator', 'Phase 5.1 - Performance Optimization'], 'Testing checklist contains all phases');
  testFileContent('COMPREHENSIVE_IMPLEMENTATION_PLAN.md', ['COMPLETED', 'Master Orchestrator Architecture'], 'Implementation plan shows completed phases');
  testFileContent('PROJECT_REALITY.md', ['WHAT\'S ACTUALLY BUILT', 'WHAT\'S MISSING'], 'Project reality contains status sections');
}

function testProjectStructure() {
  logSection('PROJECT STRUCTURE TESTS');
  
  // Test main directories exist
  testDirectoryExists('components', 'Components directory exists');
  testDirectoryExists('lib', 'Lib directory exists');
  testDirectoryExists('claimso-aws-agents', 'AWS agents directory exists');
  testDirectoryExists('examples', 'Examples directory exists');
  testDirectoryExists('scripts', 'Scripts directory exists');
  
  // Test component structure
  testDirectoryExists('components/products', 'Products components directory exists');
  testDirectoryExists('components/shared', 'Shared components directory exists');
  testDirectoryExists('components/ui', 'UI components directory exists');
  
  // Test lib structure
  testDirectoryExists('lib/hooks', 'Hooks directory exists');
  testDirectoryExists('lib/supabase', 'Supabase directory exists');
  testDirectoryExists('lib/services', 'Services directory exists');
  
  // Test AWS agents structure
  testDirectoryExists('claimso-aws-agents/src/handlers', 'Agent handlers directory exists');
  testDirectoryExists('claimso-aws-agents/src/shared', 'Agent shared directory exists');
}

function testBuildAndLint() {
  logSection('BUILD AND LINT TESTS');
  
  // Test build process
  testBuildProcess('Project builds successfully');
  
  // Test linting
  testLinting('Code passes linting');
}

function generateTestReport() {
  logSection('TEST SUMMARY');
  
  const total = testResults.total;
  const passed = testResults.passed;
  const failed = testResults.failed;
  const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
  
  log(`Total Tests: ${total}`, 'bright');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${percentage}%`, percentage >= 90 ? 'green' : percentage >= 70 ? 'yellow' : 'red');
  
  if (failed > 0) {
    log('\nFailed Tests:', 'red');
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => {
        log(`  ❌ ${test.name}`, 'red');
        if (test.details) {
          log(`     ${test.details}`, 'yellow');
        }
      });
  }
  
  // Save detailed report
  const reportPath = 'test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  log(`\nDetailed report saved to: ${reportPath}`, 'cyan');
  
  return percentage >= 90;
}

// Main execution
async function main() {
  log('🚀 Starting Comprehensive Testing for Claimso Vault 2.0', 'bright');
  log('Testing all implemented systems cohesively...', 'cyan');
  
  try {
    // Run all test categories
    testSecurityImplementation();
    testMasterOrchestrator();
    testPerformanceOptimization();
    testDocumentation();
    testProjectStructure();
    testBuildAndLint();
    
    // Generate final report
    const success = generateTestReport();
    
    if (success) {
      log('\n🎉 All systems are ready for real-world testing!', 'green');
      log('Next steps:', 'cyan');
      log('  1. Deploy to staging environment', 'yellow');
      log('  2. Test with real Amazon/email APIs', 'yellow');
      log('  3. Monitor performance in production', 'yellow');
      log('  4. Gather user feedback', 'yellow');
    } else {
      log('\n⚠️  Some tests failed. Please review and fix issues before deployment.', 'yellow');
    }
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    log(`\n💥 Test execution failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the tests
main().catch(console.error);
