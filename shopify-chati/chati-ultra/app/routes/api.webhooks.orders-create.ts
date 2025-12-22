import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  console.log("🟢 WEBHOOK RECEIVED");
  console.log("Topic:", topic);
  console.log("Shop:", shop);
  console.log("Order ID:", payload.id);

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

  return new Response("OK", { status: 200 });
};
