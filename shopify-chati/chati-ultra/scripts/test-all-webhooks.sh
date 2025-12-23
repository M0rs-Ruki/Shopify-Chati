#!/bin/bash

# Test All 16 Webhooks Script
# This script tests all webhooks implemented in the Chati Shopify app

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_VERSION="2026-01"
DELIVERY_METHOD="HTTP"
PORT="37347"
BASE_URL="http://localhost:${PORT}"

# Array of all 16 webhooks with their delivery URLs
declare -A WEBHOOKS=(
  ["orders/create"]="${BASE_URL}/api/webhooks/orders-create"
  ["orders/paid"]="${BASE_URL}/api/webhooks/orders-paid"
  ["orders/cancelled"]="${BASE_URL}/api/webhooks/orders-cancelled"
  ["orders/update"]="${BASE_URL}/api/webhooks/orders-updated"
  ["fulfillments/create"]="${BASE_URL}/api/webhooks/fulfillments-create"
  ["fulfillment_events/create"]="${BASE_URL}/api/webhooks/fulfillment-events-create"
  ["refunds/create"]="${BASE_URL}/api/webhooks/refunds-create"
  ["fulfillments/update"]="${BASE_URL}/api/webhooks/fulfillments-update"
  ["fulfillment_events/delete"]="${BASE_URL}/api/webhooks/fulfillment-events-delete"
  ["checkouts/create"]="${BASE_URL}/api/webhooks/checkouts-create"
  ["checkouts/update"]="${BASE_URL}/api/webhooks/checkouts-update"
  ["checkouts/delete"]="${BASE_URL}/api/webhooks/checkouts-delete"
  ["app/uninstalled"]="${BASE_URL}/api/webhooks/app-uninstalled"
  ["customers/data_request"]="${BASE_URL}/api/webhooks/customers-data-request"
  ["customers/redact"]="${BASE_URL}/api/webhooks/customers-redact"
  ["shop/redact"]="${BASE_URL}/api/webhooks/shop-redact"
)

# Results tracking
SUCCESS_COUNT=0
FAILED_COUNT=0
FAILED_WEBHOOKS=()
SUCCESS_WEBHOOKS=()

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Testing All 16 Webhooks${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "API Version: ${YELLOW}${API_VERSION}${NC}"
echo -e "Delivery Method: ${YELLOW}${DELIVERY_METHOD}${NC}"
echo -e "Base URL: ${YELLOW}${BASE_URL}${NC}"
echo ""
echo -e "${YELLOW}Make sure your app is running on port ${PORT}!${NC}"
echo ""
read -p "Press Enter to start testing..."
echo ""

# Test each webhook
for topic in "${!WEBHOOKS[@]}"; do
  url="${WEBHOOKS[$topic]}"
  
  echo -e "${BLUE}Testing: ${topic}${NC}"
  echo -e "  URL: ${url}"
  
  # Run the webhook trigger command
  if shopify app webhook trigger \
    --api-version="${API_VERSION}" \
    --topic="${topic}" \
    --delivery-method="${DELIVERY_METHOD}" \
    --address="${url}" \
    --shared-secret="${SHOPIFY_API_SECRET:-}" 2>&1 | grep -q "Success\|success\|✅"; then
    
    echo -e "  ${GREEN}✅ SUCCESS${NC}"
    ((SUCCESS_COUNT++))
    SUCCESS_WEBHOOKS+=("${topic}")
  else
    # Try without shared-secret if it fails
    if shopify app webhook trigger \
      --api-version="${API_VERSION}" \
      --topic="${topic}" \
      --delivery-method="${DELIVERY_METHOD}" \
      --address="${url}" 2>&1 | grep -q "Success\|success\|✅"; then
      
      echo -e "  ${GREEN}✅ SUCCESS${NC}"
      ((SUCCESS_COUNT++))
      SUCCESS_WEBHOOKS+=("${topic}")
    else
      echo -e "  ${RED}❌ FAILED${NC}"
      ((FAILED_COUNT++))
      FAILED_WEBHOOKS+=("${topic}")
    fi
  fi
  
  echo ""
  sleep 1  # Small delay between tests
done

# Print summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Total Webhooks Tested: ${YELLOW}16${NC}"
echo -e "${GREEN}✅ Successful: ${SUCCESS_COUNT}${NC}"
echo -e "${RED}❌ Failed: ${FAILED_COUNT}${NC}"
echo ""

if [ ${#SUCCESS_WEBHOOKS[@]} -gt 0 ]; then
  echo -e "${GREEN}Successful Webhooks:${NC}"
  for webhook in "${SUCCESS_WEBHOOKS[@]}"; do
    echo -e "  ${GREEN}✅ ${webhook}${NC}"
  done
  echo ""
fi

if [ ${#FAILED_WEBHOOKS[@]} -gt 0 ]; then
  echo -e "${RED}Failed Webhooks:${NC}"
  for webhook in "${FAILED_WEBHOOKS[@]}"; do
    echo -e "  ${RED}❌ ${webhook}${NC}"
  done
  echo ""
fi

# Exit with error if any failed
if [ ${FAILED_COUNT} -gt 0 ]; then
  echo -e "${RED}Some webhooks failed! Check the output above.${NC}"
  exit 1
else
  echo -e "${GREEN}All webhooks passed! 🎉${NC}"
  exit 0
fi

