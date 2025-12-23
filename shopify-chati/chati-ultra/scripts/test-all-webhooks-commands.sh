#!/bin/bash

# All Webhook Test Commands
# Run this script to test all 16 webhooks
# Make sure your app is running on port 37347!

PORT=37347
API_VERSION="2026-01"
BASE_URL="http://localhost:${PORT}"

echo "Testing all 16 webhooks..."
echo "Make sure your app is running on port ${PORT}!"
echo ""

# Order Webhooks
echo "=== Order Webhooks ==="
shopify app webhook trigger --api-version="${API_VERSION}" --topic="orders/create" --delivery-method="http" --address="${BASE_URL}/api/webhooks/orders-create"
shopify app webhook trigger --api-version="${API_VERSION}" --topic="orders/paid" --delivery-method="http" --address="${BASE_URL}/api/webhooks/orders-paid"
shopify app webhook trigger --api-version="${API_VERSION}" --topic="orders/cancelled" --delivery-method="http" --address="${BASE_URL}/api/webhooks/orders-cancelled"
shopify app webhook trigger --api-version="${API_VERSION}" --topic="orders/update" --delivery-method="http" --address="${BASE_URL}/api/webhooks/orders-updated"
shopify app webhook trigger --api-version="${API_VERSION}" --topic="refunds/create" --delivery-method="http" --address="${BASE_URL}/api/webhooks/refunds-create"

echo ""
echo "=== Fulfillment Webhooks ==="
shopify app webhook trigger --api-version="${API_VERSION}" --topic="fulfillments/create" --delivery-method="http" --address="${BASE_URL}/api/webhooks/fulfillments-create"
shopify app webhook trigger --api-version="${API_VERSION}" --topic="fulfillments/update" --delivery-method="http" --address="${BASE_URL}/api/webhooks/fulfillments-update"
shopify app webhook trigger --api-version="${API_VERSION}" --topic="fulfillment_events/create" --delivery-method="http" --address="${BASE_URL}/api/webhooks/fulfillment-events-create"
shopify app webhook trigger --api-version="${API_VERSION}" --topic="fulfillment_events/delete" --delivery-method="http" --address="${BASE_URL}/api/webhooks/fulfillment-events-delete"

echo ""
echo "=== Checkout Webhooks ==="
shopify app webhook trigger --api-version="${API_VERSION}" --topic="checkouts/create" --delivery-method="http" --address="${BASE_URL}/api/webhooks/checkouts-create"
shopify app webhook trigger --api-version="${API_VERSION}" --topic="checkouts/update" --delivery-method="http" --address="${BASE_URL}/api/webhooks/checkouts-update"
shopify app webhook trigger --api-version="${API_VERSION}" --topic="checkouts/delete" --delivery-method="http" --address="${BASE_URL}/api/webhooks/checkouts-delete"

echo ""
echo "=== Compliance Webhooks ==="
shopify app webhook trigger --api-version="${API_VERSION}" --topic="app/uninstalled" --delivery-method="http" --address="${BASE_URL}/api/webhooks/app-uninstalled"
shopify app webhook trigger --api-version="${API_VERSION}" --topic="customers/data_request" --delivery-method="http" --address="${BASE_URL}/api/webhooks/customers-data-request"
shopify app webhook trigger --api-version="${API_VERSION}" --topic="customers/redact" --delivery-method="http" --address="${BASE_URL}/api/webhooks/customers-redact"
shopify app webhook trigger --api-version="${API_VERSION}" --topic="shop/redact" --delivery-method="http" --address="${BASE_URL}/api/webhooks/shop-redact"

echo ""
echo "Done! Check your app logs for '🟢 WEBHOOK RECEIVED' messages."

