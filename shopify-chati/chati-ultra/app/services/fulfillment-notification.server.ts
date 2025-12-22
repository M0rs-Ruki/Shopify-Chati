type FulfillmentNotificationInput = {
  shop: string;
  fulfillment: any;
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
