type CheckoutNotificationInput = {
  shop: string;
  checkout: {
    id?: string | number;
    email?: string | null;
    phone?: string | null;
    total_price?: string | number | null;
    currency?: string | null;
    abandoned_checkout_url?: string | null;
    updated_at?: string | null;
    [key: string]: unknown;
  };
};

export async function handleCheckoutCreated({
  shop,
  checkout,
}: CheckoutNotificationInput) {
  const customerEmail = checkout.email || null;
  const customerPhone = checkout.phone || null;
  const checkoutTotal = checkout.total_price || "0.00";
  const currency = checkout.currency || "USD";
  const checkoutUrl = checkout.abandoned_checkout_url || null;

  const message = `
🛒 Cart Created

You've added items to your cart!

Total: ${checkoutTotal} ${currency}
${checkoutUrl ? `Complete your purchase: ${checkoutUrl}` : ""}

Don't forget to complete your order! 🛍️
  `.trim();

  console.log("🛒 CHECKOUT CREATED");
  console.log("Shop:", shop);
  console.log("Email:", customerEmail || "N/A");
  console.log("Phone:", customerPhone || "N/A");
  console.log("Total:", `${checkoutTotal} ${currency}`);
  console.log(message);

  return {
    customerEmail,
    customerPhone,
    message,
  };
}

export async function handleCheckoutUpdated({
  shop,
  checkout,
}: CheckoutNotificationInput) {
  const customerEmail = checkout.email || null;
  const customerPhone = checkout.phone || null;
  const checkoutTotal = checkout.total_price || "0.00";
  const currency = checkout.currency || "USD";
  const checkoutUrl = checkout.abandoned_checkout_url || null;

  const message = `
🔄 Cart Updated

Your cart has been updated!

New total: ${checkoutTotal} ${currency}
${checkoutUrl ? `Complete your purchase: ${checkoutUrl}` : ""}

Ready to checkout? 🛍️
  `.trim();

  console.log("🔄 CHECKOUT UPDATED");
  console.log("Shop:", shop);
  console.log("Email:", customerEmail || "N/A");
  console.log("Phone:", customerPhone || "N/A");
  console.log("Total:", `${checkoutTotal} ${currency}`);
  console.log(message);

  return {
    customerEmail,
    customerPhone,
    message,
  };
}

export async function handleCheckoutDeleted({
  shop,
  checkout,
}: CheckoutNotificationInput) {
  const customerEmail = checkout.email || null;
  const customerPhone = checkout.phone || null;

  const message = `
🗑️ Cart Abandoned

Your cart has been cleared.

If you'd like to continue shopping, visit our store anytime!
  `.trim();

  console.log("🗑️ CHECKOUT DELETED");
  console.log("Shop:", shop);
  console.log("Email:", customerEmail || "N/A");
  console.log("Phone:", customerPhone || "N/A");
  console.log(message);

  return {
    customerEmail,
    customerPhone,
    message,
  };
}
