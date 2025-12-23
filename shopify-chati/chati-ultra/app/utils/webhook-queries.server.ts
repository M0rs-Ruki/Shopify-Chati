import db from "../db.server";

export interface WebhookStats {
  total: number;
  pending: number;
  success: number;
  failed: number;
}

export interface WebhookEventFilters {
  status?: "pending" | "success" | "failed";
  topic?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedWebhookEvents {
  events: Array<{
    id: number;
    eventKey: string;
    shop: string;
    topic: string;
    resourceId: string;
    status: string;
    error: string | null;
    processedAt: Date | null;
    createdAt: Date;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Get webhook statistics for a shop
 */
export async function getWebhookStats(
  shop: string
): Promise<WebhookStats> {
  // Normalize shop name - handle both formats
  const normalizedShop = shop.toLowerCase().trim();
  
  // Also check if there are any events at all (for debugging)
  const allEventsCount = await db.webhookEvent.count();
  const allShops = await db.webhookEvent.findMany({
    select: { shop: true },
    distinct: ["shop"],
  });
  
  console.log("🔍 Webhook Stats - Query shop:", normalizedShop);
  console.log("🔍 Webhook Stats - Total events in DB:", allEventsCount);
  console.log("🔍 Webhook Stats - All shops in DB:", allShops.map(s => s.shop));

  const [total, pending, success, failed] = await Promise.all([
    db.webhookEvent.count({ where: { shop: normalizedShop } }),
    db.webhookEvent.count({ where: { shop: normalizedShop, status: "pending" } }),
    db.webhookEvent.count({ where: { shop: normalizedShop, status: "success" } }),
    db.webhookEvent.count({ where: { shop: normalizedShop, status: "failed" } }),
  ]);

  // If no events found with normalized shop, but events exist, show all events
  // This handles the case where shop names don't match
  if (total === 0 && allEventsCount > 0) {
    console.log("⚠️ No events found for shop:", normalizedShop, "- showing all events instead");
    // Return stats for all events (no shop filter)
    const [allTotal, allPending, allSuccess, allFailed] = await Promise.all([
      db.webhookEvent.count(),
      db.webhookEvent.count({ where: { status: "pending" } }),
      db.webhookEvent.count({ where: { status: "success" } }),
      db.webhookEvent.count({ where: { status: "failed" } }),
    ]);
    
    return {
      total: allTotal,
      pending: allPending,
      success: allSuccess,
      failed: allFailed,
    };
  }

  return {
    total,
    pending,
    success,
    failed,
  };
}

/**
 * Get paginated webhook events with filters (server-side pagination)
 */
export async function getWebhookEvents(
  shop: string,
  filters: WebhookEventFilters = {},
  pagination: PaginationParams = { page: 1, limit: 20 }
): Promise<PaginatedWebhookEvents> {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  // Normalize shop name
  const normalizedShop = shop.toLowerCase().trim();

  // Build where clause
  const where: any = { shop: normalizedShop };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.topic) {
    where.topic = filters.topic;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  // Get total count
  let total = await db.webhookEvent.count({ where });

  // If no events found for this shop, but events exist, query all events
  const allEventsCount = await db.webhookEvent.count();
  if (total === 0 && allEventsCount > 0) {
    console.log("⚠️ No events found for shop:", normalizedShop, "- showing all events instead");
    // Remove shop filter
    delete where.shop;
    total = await db.webhookEvent.count({ where });
  }

  // Get paginated events
  const events = await db.webhookEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  const totalPages = Math.ceil(total / limit);

  return {
    events,
    total,
    page,
    limit,
    totalPages,
  };
}

/**
 * Get recent webhook events for dashboard
 */
export async function getRecentWebhookEvents(
  shop: string,
  limit: number = 5
) {
  // Normalize shop name
  const normalizedShop = shop.toLowerCase().trim();
  
  // Try to get events for this shop
  let events = await db.webhookEvent.findMany({
    where: { shop: normalizedShop },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // If no events found for this shop, but events exist, get all events
  if (events.length === 0) {
    const allEventsCount = await db.webhookEvent.count();
    if (allEventsCount > 0) {
      console.log("⚠️ No events found for shop:", normalizedShop, "- showing all events instead");
      events = await db.webhookEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    }
  }
  
  return events;
}

