import { Prisma } from "@prisma/client";
import db from "../db.server";

/**
 * Generate a unique event key for webhook idempotency
 * Format: {shop}|{topic}|{resource_id}
 */
export function generateEventKey(
  shop: string,
  topic: string,
  resourceId: string,
): string {
  return `${shop}|${topic}|${resourceId}`;
}

/**
 * Check if webhook event already exists and record it if new
 * Returns { isDuplicate: true } if event was already processed
 * Returns { isDuplicate: false, eventId: number } if new event
 */
export async function checkAndRecordWebhook(
  shop: string,
  topic: string,
  resourceId: string,
): Promise<{ isDuplicate: boolean; eventId?: number }> {
  const eventKey = generateEventKey(shop, topic, resourceId);

  try {
    const event = await db.webhookEvent.create({
      data: {
        eventKey,
        shop,
        topic,
        resourceId,
        status: "pending",
      },
    });

    return { isDuplicate: false, eventId: event.id };
  } catch (error) {
    // Check if it's a unique constraint violation (duplicate)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // Duplicate event - already processed
      return { isDuplicate: true };
    }

    // Re-throw other errors
    throw error;
  }
}

/**
 * Update webhook event status after processing
 */
export async function updateWebhookStatus(
  eventId: number,
  status: "success" | "failed",
  error?: string,
): Promise<void> {
  await db.webhookEvent.update({
    where: { id: eventId },
    data: {
      status,
      error: error || null,
      processedAt: new Date(),
    },
  });
}

