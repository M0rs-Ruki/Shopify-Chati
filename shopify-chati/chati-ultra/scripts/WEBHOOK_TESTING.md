# Webhook Testing Guide

This guide helps you test all 16 webhooks implemented in the Chati Shopify app.

## Quick Start

### Option 1: Automated Script (Recommended)

Make sure your app is running on port 37347, then run:

```bash
npm run test-webhooks
```

Or directly:

```bash
./scripts/test-all-webhooks-simple.sh
```

### Option 2: Manual Testing

If the automated script doesn't work, use the commands below.

## Manual Testing Commands

Make sure your app is running on port **37347** before running these commands.

### Order Webhooks (5)

```bash
# 1. orders/create
shopify app webhook trigger --api-version="2026-01" --topic="orders/create" --delivery-method="http" --address="http://localhost:37347/api/webhooks/orders-create"

# 2. orders/paid
shopify app webhook trigger --api-version="2026-01" --topic="orders/paid" --delivery-method="http" --address="http://localhost:37347/api/webhooks/orders-paid"

# 3. orders/cancelled
shopify app webhook trigger --api-version="2026-01" --topic="orders/cancelled" --delivery-method="http" --address="http://localhost:37347/api/webhooks/orders-cancelled"

# 4. orders/update
shopify app webhook trigger --api-version="2026-01" --topic="orders/update" --delivery-method="http" --address="http://localhost:37347/api/webhooks/orders-updated"

# 5. refunds/create
shopify app webhook trigger --api-version="2026-01" --topic="refunds/create" --delivery-method="http" --address="http://localhost:37347/api/webhooks/refunds-create"
```

### Fulfillment Webhooks (4)

```bash
# 6. fulfillments/create
shopify app webhook trigger --api-version="2026-01" --topic="fulfillments/create" --delivery-method="http" --address="http://localhost:37347/api/webhooks/fulfillments-create"

# 7. fulfillments/update
shopify app webhook trigger --api-version="2026-01" --topic="fulfillments/update" --delivery-method="http" --address="http://localhost:37347/api/webhooks/fulfillments-update"

# 8. fulfillment_events/create
shopify app webhook trigger --api-version="2026-01" --topic="fulfillment_events/create" --delivery-method="http" --address="http://localhost:37347/api/webhooks/fulfillment-events-create"

# 9. fulfillment_events/delete
shopify app webhook trigger --api-version="2026-01" --topic="fulfillment_events/delete" --delivery-method="http" --address="http://localhost:37347/api/webhooks/fulfillment-events-delete"
```

### Checkout Webhooks (3)

```bash
# 10. checkouts/create
shopify app webhook trigger --api-version="2026-01" --topic="checkouts/create" --delivery-method="http" --address="http://localhost:37347/api/webhooks/checkouts-create"

# 11. checkouts/update
shopify app webhook trigger --api-version="2026-01" --topic="checkouts/update" --delivery-method="http" --address="http://localhost:37347/api/webhooks/checkouts-update"

# 12. checkouts/delete
shopify app webhook trigger --api-version="2026-01" --topic="checkouts/delete" --delivery-method="http" --address="http://localhost:37347/api/webhooks/checkouts-delete"
```

### Compliance Webhooks (4)

```bash
# 13. app/uninstalled
shopify app webhook trigger --api-version="2026-01" --topic="app/uninstalled" --delivery-method="http" --address="http://localhost:37347/api/webhooks/app-uninstalled"

# 14. customers/data_request
shopify app webhook trigger --api-version="2026-01" --topic="customers/data_request" --delivery-method="http" --address="http://localhost:37347/api/webhooks/customers-data-request"

# 15. customers/redact
shopify app webhook trigger --api-version="2026-01" --topic="customers/redact" --delivery-method="http" --address="http://localhost:37347/api/webhooks/customers-redact"

# 16. shop/redact
shopify app webhook trigger --api-version="2026-01" --topic="shop/redact" --delivery-method="http" --address="http://localhost:37347/api/webhooks/shop-redact"
```

## All Commands in One File

You can also copy all commands from `scripts/test-all-webhooks-commands.sh`:

```bash
bash scripts/test-all-webhooks-commands.sh
```

## Expected Results

Each webhook should return:

- ✅ **Success** message from Shopify CLI
- 🟢 **"WEBHOOK RECEIVED"** log in your app console
- **200 OK** response

## Troubleshooting

1. **Make sure your app is running:**

   ```bash
   shopify app dev
   ```

2. **Check the port:**
   - Default port is 37347
   - Check your terminal output for the actual port

3. **Verify webhook URLs:**
   - All URLs should be: `http://localhost:37347/api/webhooks/[webhook-name]`
   - Check your `app/shopify.server.ts` for correct callback URLs

4. **Check server logs:**
   - Look for "🟢 WEBHOOK RECEIVED" messages
   - Check for any error messages

## Summary

After testing all 16 webhooks, you should see:

- ✅ 16 successful webhook deliveries
- 🟢 16 "WEBHOOK RECEIVED" logs in your app
- All webhooks returning 200 OK

If any webhook fails, check:

- App is running
- Correct port number
- Correct webhook URL
- Server logs for errors
