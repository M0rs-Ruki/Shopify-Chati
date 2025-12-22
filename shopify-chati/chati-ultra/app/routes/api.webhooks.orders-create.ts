import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import {
  checkAndRecordWebhook,
  updateWebhookStatus,
} from "../utils/webhook-idempotency.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  const resourceId = String(payload.id);

  console.log("🟢 WEBHOOK RECEIVED");
  console.log("Topic:", topic);
  console.log("Shop:", shop);
  console.log("Order ID:", resourceId);

  // ✅ IDEMPOTENCY CHECK - Prevent duplicate processing
  const { isDuplicate, eventId } = await checkAndRecordWebhook(
    shop,
    topic,
    resourceId,
  );

  if (isDuplicate) {
    console.log("⚠️ DUPLICATE WEBHOOK DETECTED - Skipping processing");
    console.log("Event already processed, returning 200 OK");
    return new Response("OK", { status: 200 });
  }

  // ✅ NEW EVENT - Process it
  console.log(`✅ Processing new webhook event (ID: ${eventId})`);

  try {
    // ✅ EXTRACT CUSTOMER CONTACT INFO
    const customerPhone =
      payload.phone || payload.shipping_address?.phone || null;
    const customerEmail = payload.email || null;
    const customerName =
      payload.customer?.first_name ||
      payload.shipping_address?.first_name ||
      "Customer";

    // ✅ EXTRACT ORDER DETAILS
    const orderNumber = payload.order_number || payload.name || payload.id;
    const orderTotal = payload.total_price || "0.00";
    const currency = payload.currency || "USD";

    // ✅ BUILD ITEMS LIST
    const itemsList =
      payload.line_items
        ?.map(
          (item: { name: string; quantity: number; price: string }) =>
            `  • ${item.name} x${item.quantity} - ${item.price} ${currency}`,
        )
        .join("\n") || "No items";

    // ✅ BUILD NOTIFICATION MESSAGE
    const message = `
🎉 Thank you ${customerName}!

Your order #${orderNumber} has been confirmed!
Total: ${orderTotal} ${currency}

Items:
${itemsList}

We'll notify you when your order ships! 🚚
    `.trim();

    // ✅ LOG EXTRACTED DATA
    console.log("📦 ORDER DETAILS:");
    console.log("  Order #:", orderNumber);
    console.log("  Customer:", customerName);
    console.log("  Phone:", customerPhone || "Not provided");
    console.log("  Email:", customerEmail || "Not provided");
    console.log("  Total:", `${orderTotal} ${currency}`);
    console.log("  Items:", payload.line_items?.length || 0);

    console.log("\n💬 MESSAGE TO SEND:");
    console.log(message);

    // ✅ TODO: SEND NOTIFICATION
    // await sendWhatsApp(customerPhone, message);
    // OR
    // await sendEmail(customerEmail, message);
    // OR
    // await sendSMS(customerPhone, message);

    // ✅ Mark as successfully processed
    if (eventId) {
      await updateWebhookStatus(eventId, "success");
      console.log(`✅ Webhook event ${eventId} marked as success`);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    // ✅ Mark as failed and log error
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Error processing webhook:", errorMessage);

    if (eventId) {
      await updateWebhookStatus(eventId, "failed", errorMessage);
      console.log(`❌ Webhook event ${eventId} marked as failed`);
    }

    // Always return 200 OK to Shopify (even on errors)
    // This prevents Shopify from retrying indefinitely
    return new Response("OK", { status: 200 });
  }
};
