/**
 * In-memory Set to track processed webhook events for idempotency
 *
 * IMPORTANT NOTES:
 * - This Set is per Node.js process (not shared across instances)
 * - In multi-instance deployments (Cloudflare/Vercel/Render), each instance has its own Set
 * - Lost on server restart
 * - This is acceptable for stateless app - Shopify retries are handled by returning 200 OK
 */
const processedEvents = new Set<string>();

/**
 * Generate a unique event key for webhook idempotency
 * Format: {shop}|{topic}|{resource_id}
 */
export function generateEventKey(
  shop: string,
  topic: string,
  resourceId: string,
): string {
  const normalizedShop = shop.toLowerCase().trim();
  return `${normalizedShop}|${topic}|${resourceId}`;
}

/**
 * Check if webhook event already exists and record it if new
 * Returns { isDuplicate: true } if event was already processed
 * Returns { isDuplicate: false, eventId?: string } if new event
 *
 * Note: eventId is now a string (eventKey) instead of number for consistency
 */
export async function checkAndRecordWebhook(
  shop: string,
  topic: string,
  resourceId: string,
): Promise<{ isDuplicate: boolean; eventId?: string }> {
  const eventKey = generateEventKey(shop, topic, resourceId);

  // Check if already processed
  if (processedEvents.has(eventKey)) {
    return { isDuplicate: true };
  }

  // Mark as processed
  processedEvents.add(eventKey);

  return { isDuplicate: false, eventId: eventKey };
}

/**
 * Update webhook event status after processing
 *
 * Note: In-memory implementation - this is a no-op for now
 * Status tracking will be handled by Chati Core (MongoDB) later
 */
export async function updateWebhookStatus(
  eventId: string,
  status: "success" | "failed",
  error?: string,
): Promise<void> {
  // In-memory implementation - no-op
  // Status will be tracked in Chati Core (MongoDB) later
  // Keep function signature for compatibility
}
