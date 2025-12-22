type FulfillmentNotificationInput = {
  shop: string;
  fulfillment: {
    id?: string | number;
    tracking_number?: string | null;
    tracking_numbers?: string[] | null;
    tracking_url?: string | null;
    tracking_urls?: string[] | null;
    status?: string | null;
    [key: string]: unknown;
  };
};

export async function handleFulfillmentCreated({
  shop,
  fulfillment,
}: FulfillmentNotificationInput) {
  const trackingNumber =
    fulfillment.tracking_number || fulfillment.tracking_numbers?.[0] || null;

  const trackingUrl =
    fulfillment.tracking_url || fulfillment.tracking_urls?.[0] || null;

  const message = `
  📦 Your order has shipped!
  
  Your package is on the way 🚚
  
  Tracking number: ${trackingNumber || "N/A"}
  ${trackingUrl ? `Track here: ${trackingUrl}` : ""}
    `.trim();

  console.log("📦 FULFILLMENT CREATED");
  console.log("Shop:", shop);
  console.log(message);

  return { message };
}

export async function handleFulfillmentEvent({
  shop,
  fulfillment,
}: FulfillmentNotificationInput) {
  const status = fulfillment.status || "update";

  const message = `
  🚚 Delivery update
  
  Status: ${status}
  
  Your order is moving and will reach you soon 🙌
    `.trim();

  console.log("🚚 FULFILLMENT EVENT");
  console.log("Shop:", shop);
  console.log(message);

  return { message };
}

export async function handleFulfillmentUpdated({
  shop,
  fulfillment,
}: FulfillmentNotificationInput) {
  const trackingNumber =
    fulfillment.tracking_number || fulfillment.tracking_numbers?.[0] || "N/A";

  const trackingUrl =
    fulfillment.tracking_url || fulfillment.tracking_urls?.[0] || null;

  const message = `
📦 Shipping Update

Your tracking details have been updated.

Tracking number: ${trackingNumber}
${trackingUrl ? `Track here: ${trackingUrl}` : ""}
  `.trim();

  console.log("🔁 FULFILLMENT UPDATED");
  console.log("Shop:", shop);
  console.log(message);

  return { message };
}

export async function handleFulfillmentEventDeleted({
  shop,
  fulfillment,
}: FulfillmentNotificationInput) {
  const message = `
⚠️ Delivery Update Cancelled

A previous delivery update for your order has been removed.
If you have questions, please contact support.
  `.trim();

  console.log("🗑️ FULFILLMENT EVENT DELETED");
  console.log("Shop:", shop);
  console.log(message);

  return { message };
}
