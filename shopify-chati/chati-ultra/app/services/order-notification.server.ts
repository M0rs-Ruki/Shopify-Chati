type OrderNotificationInput = {
  shop: string;
  order: {
    id?: string | number;
    phone?: string | null;
    shipping_address?: {
      phone?: string | null;
      first_name?: string | null;
      last_name?: string | null;
    } | null;
    email?: string | null;
    customer?: {
      first_name?: string | null;
      last_name?: string | null;
    } | null;
    order_number?: string | number | null;
    name?: string | null;
    total_price?: string | number | null;
    currency?: string | null;
    line_items?: Array<{
      name?: string;
      quantity?: number;
      price?: string | number;
    }> | null;
    [key: string]: unknown;
  };
};

type RefundNotificationInput = {
  shop: string;
  refund: {
    id?: string | number;
    amount?: string | number | null;
    transactions?: Array<{
      amount?: string | number | null;
      currency?: string | null;
    }> | null;
    order?: {
      id?: string | number;
      order_number?: string | number | null;
      name?: string | null;
      currency?: string | null;
      customer?: {
        first_name?: string | null;
        last_name?: string | null;
      } | null;
      shipping_address?: {
        first_name?: string | null;
        last_name?: string | null;
      } | null;
    } | null;
    [key: string]: unknown;
  };
};

export async function handleOrderCreated({
  shop,
  order,
}: OrderNotificationInput) {
  // ✅ Extract customer contact info
  const customerPhone = order.phone || order.shipping_address?.phone || null;

  const customerEmail = order.email || null;

  const customerName =
    order.customer?.first_name ||
    order.shipping_address?.first_name ||
    "Customer";

  // ✅ Extract order details
  const orderNumber = order.order_number || order.name || order.id;
  const orderTotal = order.total_price || "0.00";
  const currency = order.currency || "USD";

  // ✅ Build items list
  const itemsList =
    order.line_items
      ?.map((item) => {
        const itemName = item.name || "Unknown item";
        const itemQuantity = item.quantity || 1;
        const itemPrice = String(item.price || "0.00");
        return `• ${itemName} x${itemQuantity} - ${itemPrice} ${currency}`;
      })
      .join("\n") || "No items";

  // ✅ Build message
  const message = `
  🎉 Thank you ${customerName}!
  
  Your order #${orderNumber} has been confirmed.
  Total: ${orderTotal} ${currency}
  
  Items:
  ${itemsList}
  
  We'll notify you when your order ships 🚚
    `.trim();

  // ✅ For now: log only
  console.log("📨 ORDER CREATED MESSAGE");
  console.log("Shop:", shop);
  console.log("Phone:", customerPhone || "N/A");
  console.log("Email:", customerEmail || "N/A");
  console.log(message);

  // 🔜 Later (not now):
  // await sendWhatsApp(customerPhone, message);

  return {
    customerPhone,
    customerEmail,
    message,
  };
}

export async function handleOrderPaid({ shop, order }: OrderNotificationInput) {
  const customerPhone = order.phone || order.shipping_address?.phone || null;

  const customerEmail = order.email || null;

  const customerName =
    order.customer?.first_name ||
    order.shipping_address?.first_name ||
    "Customer";

  const orderNumber = order.order_number || order.name || order.id;
  const orderTotal = order.total_price || "0.00";
  const currency = order.currency || "USD";

  const message = `
💳 Payment confirmed!

Hi ${customerName},
Your payment for order #${orderNumber} was successful.

Amount paid: ${orderTotal} ${currency}

Thank you for shopping with us 🙏
  `.trim();

  console.log("📨 ORDER PAID MESSAGE");
  console.log("Shop:", shop);
  console.log("Phone:", customerPhone || "N/A");
  console.log("Email:", customerEmail || "N/A");
  console.log(message);

  // 🔜 Later:
  // await sendWhatsApp(customerPhone, message);

  return {
    customerPhone,
    customerEmail,
    message,
  };
}

export async function handleOrderCancelled({
  shop,
  order,
}: OrderNotificationInput) {
  const customerName =
    order.customer?.first_name ||
    order.shipping_address?.first_name ||
    "Customer";

  const orderNumber = order.order_number || order.name || order.id;

  const message = `
❌ Order Cancelled

Hi ${customerName},
Your order #${orderNumber} has been cancelled.

If you have any questions, please contact support.
  `.trim();

  console.log("❌ ORDER CANCELLED");
  console.log("Shop:", shop);
  console.log(message);

  return { message };
}

export async function handleOrderUpdated({
  shop,
  order,
}: OrderNotificationInput) {
  const customerName =
    order.customer?.first_name ||
    order.shipping_address?.first_name ||
    "Customer";

  const orderNumber = order.order_number || order.name || order.id;

  const message = `
🔄 Order Updated

Hi ${customerName},
Your order #${orderNumber} has been updated.

If you didn’t request this change, please contact support.
  `.trim();

  console.log("🔄 ORDER UPDATED");
  console.log("Shop:", shop);
  console.log(message);

  return { message };
}

export async function handleRefundCreated({
  shop,
  refund,
}: RefundNotificationInput) {
  const order = refund.order || {};
  const customerName =
    order.customer?.first_name ||
    order.shipping_address?.first_name ||
    "Customer";

  const orderNumber = order.order_number || order.name || order.id;
  const refundAmount =
    refund.transactions?.[0]?.amount || refund.amount || "0.00";
  const currency =
    refund.transactions?.[0]?.currency || order.currency || "USD";

  const message = `
💸 Refund Processed

Hi ${customerName},
A refund has been issued for your order #${orderNumber}.

Refund amount: ${refundAmount} ${currency}

The amount will be credited back to your original payment method.
  `.trim();

  console.log("💸 REFUND CREATED");
  console.log("Shop:", shop);
  console.log(message);

  return { message };
}

