#!/usr/bin/env node

/**
 * Test All 16 Webhooks Script
 * This script tests all webhooks implemented in the Chati Shopify app
 * 
 * Usage: node scripts/test-all-webhooks.js
 */

const { execSync } = require('child_process');

// Configuration
const API_VERSION = '2026-01';
const DELIVERY_METHOD = 'HTTP';
const PORT = process.env.PORT || '37347';
const BASE_URL = `http://localhost:${PORT}`;

// All 16 webhooks with their delivery URLs
const WEBHOOKS = [
  { topic: 'orders/create', url: `${BASE_URL}/api/webhooks/orders-create` },
  { topic: 'orders/paid', url: `${BASE_URL}/api/webhooks/orders-paid` },
  { topic: 'orders/cancelled', url: `${BASE_URL}/api/webhooks/orders-cancelled` },
  { topic: 'orders/update', url: `${BASE_URL}/api/webhooks/orders-updated` },
  { topic: 'fulfillments/create', url: `${BASE_URL}/api/webhooks/fulfillments-create` },
  { topic: 'fulfillment_events/create', url: `${BASE_URL}/api/webhooks/fulfillment-events-create` },
  { topic: 'refunds/create', url: `${BASE_URL}/api/webhooks/refunds-create` },
  { topic: 'fulfillments/update', url: `${BASE_URL}/api/webhooks/fulfillments-update` },
  { topic: 'fulfillment_events/delete', url: `${BASE_URL}/api/webhooks/fulfillment-events-delete` },
  { topic: 'checkouts/create', url: `${BASE_URL}/api/webhooks/checkouts-create` },
  { topic: 'checkouts/update', url: `${BASE_URL}/api/webhooks/checkouts-update` },
  { topic: 'checkouts/delete', url: `${BASE_URL}/api/webhooks/checkouts-delete` },
  { topic: 'app/uninstalled', url: `${BASE_URL}/api/webhooks/app-uninstalled` },
  { topic: 'customers/data_request', url: `${BASE_URL}/api/webhooks/customers-data-request` },
  { topic: 'customers/redact', url: `${BASE_URL}/api/webhooks/customers-redact` },
  { topic: 'shop/redact', url: `${BASE_URL}/api/webhooks/shop-redact` },
];

// Results tracking
const results = {
  success: [],
  failed: [],
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testWebhook(webhook) {
  const { topic, url } = webhook;
  
  log(`\nTesting: ${topic}`, 'blue');
  log(`  URL: ${url}`, 'cyan');
  
  try {
    // Run the webhook trigger command
    const command = `shopify app webhook trigger --api-version="${API_VERSION}" --topic="${topic}" --delivery-method="${DELIVERY_METHOD}" --address="${url}"`;
    
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 30000, // 30 second timeout
    });
    
    // Check if output contains success indicators
    if (output.includes('Success') || output.includes('success') || output.includes('✅') || output.includes('200')) {
      log(`  ✅ SUCCESS`, 'green');
      results.success.push(topic);
      return true;
    } else {
      log(`  ❌ FAILED - Unexpected output`, 'red');
      log(`  Output: ${output.substring(0, 200)}`, 'yellow');
      results.failed.push({ topic, reason: 'Unexpected output' });
      return false;
    }
  } catch (error) {
    // Check if it's actually a success (sometimes errors are just warnings)
    const errorOutput = error.stdout || error.stderr || error.message || '';
    
    if (errorOutput.includes('Success') || errorOutput.includes('success') || errorOutput.includes('✅') || errorOutput.includes('200')) {
      log(`  ✅ SUCCESS (with warnings)`, 'green');
      results.success.push(topic);
      return true;
    } else {
      log(`  ❌ FAILED`, 'red');
      log(`  Error: ${error.message.substring(0, 200)}`, 'yellow');
      results.failed.push({ topic, reason: error.message });
      return false;
    }
  }
}

// Main execution
function main() {
  log('========================================', 'blue');
  log('  Testing All 16 Webhooks', 'blue');
  log('========================================', 'blue');
  log('');
  log(`API Version: ${API_VERSION}`, 'yellow');
  log(`Delivery Method: ${DELIVERY_METHOD}`, 'yellow');
  log(`Base URL: ${BASE_URL}`, 'yellow');
  log('');
  log(`Make sure your app is running on port ${PORT}!`, 'yellow');
  log('');
  
  // Test each webhook
  WEBHOOKS.forEach((webhook, index) => {
    log(`\n[${index + 1}/16]`, 'cyan');
    testWebhook(webhook);
    
    // Small delay between tests
    if (index < WEBHOOKS.length - 1) {
      // Wait 1 second between tests
      const start = Date.now();
      while (Date.now() - start < 1000) {
        // Busy wait
      }
    }
  });
  
  // Print summary
  log('\n========================================', 'blue');
  log('  Test Summary', 'blue');
  log('========================================', 'blue');
  log('');
  log(`Total Webhooks Tested: ${WEBHOOKS.length}`, 'yellow');
  log(`✅ Successful: ${results.success.length}`, 'green');
  log(`❌ Failed: ${results.failed.length}`, 'red');
  log('');
  
  if (results.success.length > 0) {
    log('Successful Webhooks:', 'green');
    results.success.forEach(topic => {
      log(`  ✅ ${topic}`, 'green');
    });
    log('');
  }
  
  if (results.failed.length > 0) {
    log('Failed Webhooks:', 'red');
    results.failed.forEach(({ topic, reason }) => {
      log(`  ❌ ${topic}`, 'red');
      if (reason) {
        log(`     Reason: ${reason.substring(0, 100)}`, 'yellow');
      }
    });
    log('');
  }
  
  // Exit with appropriate code
  if (results.failed.length > 0) {
    log('Some webhooks failed! Check the output above.', 'red');
    process.exit(1);
  } else {
    log('All webhooks passed! 🎉', 'green');
    process.exit(0);
  }
}

// Run the script
main();

