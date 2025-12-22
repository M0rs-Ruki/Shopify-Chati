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
