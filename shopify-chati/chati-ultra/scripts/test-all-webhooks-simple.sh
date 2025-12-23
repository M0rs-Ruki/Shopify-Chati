#!/bin/bash

# Simple Webhook Test Script
# Run this script to test all 16 webhooks
# Make sure your app is running on port 37347!

PORT=37347
API_VERSION="2026-01"
BASE_URL="http://localhost:${PORT}"

echo "=========================================="
echo "  Testing All 16 Webhooks"
echo "=========================================="
echo ""
echo "API Version: ${API_VERSION}"
echo "Base URL: ${BASE_URL}"
echo ""
echo "Make sure your app is running!"
echo ""

# Array of webhooks
webhooks=(
  "orders/create:${BASE_URL}/api/webhooks/orders-create"
  "orders/paid:${BASE_URL}/api/webhooks/orders-paid"
  "orders/cancelled:${BASE_URL}/api/webhooks/orders-cancelled"
  "orders/update:${BASE_URL}/api/webhooks/orders-updated"
  "fulfillments/create:${BASE_URL}/api/webhooks/fulfillments-create"
  "fulfillment_events/create:${BASE_URL}/api/webhooks/fulfillment-events-create"
  "refunds/create:${BASE_URL}/api/webhooks/refunds-create"
  "fulfillments/update:${BASE_URL}/api/webhooks/fulfillments-update"
  "fulfillment_events/delete:${BASE_URL}/api/webhooks/fulfillment-events-delete"
  "checkouts/create:${BASE_URL}/api/webhooks/checkouts-create"
  "checkouts/update:${BASE_URL}/api/webhooks/checkouts-update"
  "checkouts/delete:${BASE_URL}/api/webhooks/checkouts-delete"
  "app/uninstalled:${BASE_URL}/api/webhooks/app-uninstalled"
  "customers/data_request:${BASE_URL}/api/webhooks/customers-data-request"
  "customers/redact:${BASE_URL}/api/webhooks/customers-redact"
  "shop/redact:${BASE_URL}/api/webhooks/shop-redact"
)

success_count=0
failed_count=0
failed_webhooks=()
success_webhooks=()

for webhook_entry in "${webhooks[@]}"; do
  IFS=':' read -r topic url <<< "$webhook_entry"
  
  echo "Testing: $topic"
  echo "  URL: $url"
  
  # Run the webhook trigger and capture output
  output=$(shopify app webhook trigger \
    --api-version="$API_VERSION" \
    --topic="$topic" \
    --delivery-method="http" \
    --address="$url" 2>&1)
  
  exit_code=$?
  
  # Check for success indicators in output
  if echo "$output" | grep -qi "Success\|✅\|successful\|localhost delivery"; then
    echo "  ✅ SUCCESS"
    ((success_count++))
    success_webhooks+=("$topic")
  elif [ $exit_code -eq 0 ]; then
    # If exit code is 0, it's likely a success even if we didn't match the pattern
    echo "  ✅ SUCCESS (exit code 0)"
    ((success_count++))
    success_webhooks+=("$topic")
  else
    echo "  ❌ FAILED"
    echo "  Output: $(echo "$output" | tail -3 | tr '\n' ' ')"
    ((failed_count++))
    failed_webhooks+=("$topic")
  fi
  
  echo ""
  sleep 1
done

echo "=========================================="
echo "  Summary"
echo "=========================================="
echo ""
echo "Total: 16"
echo "✅ Successful: $success_count"
echo "❌ Failed: $failed_count"
echo ""

if [ ${#success_webhooks[@]} -gt 0 ]; then
  echo "✅ Successful Webhooks:"
  for webhook in "${success_webhooks[@]}"; do
    echo "  - $webhook"
  done
  echo ""
fi

if [ ${#failed_webhooks[@]} -gt 0 ]; then
  echo "❌ Failed Webhooks:"
  for webhook in "${failed_webhooks[@]}"; do
    echo "  - $webhook"
  done
  echo ""
fi

if [ $failed_count -gt 0 ]; then
  exit 1
else
  exit 0
fi

