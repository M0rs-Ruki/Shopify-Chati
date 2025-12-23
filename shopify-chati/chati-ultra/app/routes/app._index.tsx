import { useState, useCallback, useEffect } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  getWebhookStats,
  getRecentWebhookEvents,
  getWebhookEvents,
} from "../utils/webhook-queries.server";
import { AppHeader } from "../components/AppHeader";
import { DashboardTab } from "../components/DashboardTab";
import { EventsTab } from "../components/EventsTab";
import { SettingsTab } from "../components/SettingsTab";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "20", 10);
  const status = url.searchParams.get("status") as
    | "pending"
    | "success"
    | "failed"
    | null;
  const topic = url.searchParams.get("topic") || null;
  const filters = { ...(status && { status }), ...(topic && { topic }) };

  const [stats, recentEvents, eventsResult] = await Promise.all([
    getWebhookStats(shop),
    getRecentWebhookEvents(shop, 5),
    getWebhookEvents(shop, filters, { page, limit }),
  ]);

  const db = (await import("../db.server")).default;
  const normalizedShop = shop.toLowerCase().trim();
  let topics = await db.webhookEvent.findMany({
    where: { shop: normalizedShop },
    select: { topic: true },
    distinct: ["topic"],
    orderBy: { topic: "asc" },
  });

  if (topics.length === 0) {
    topics = await db.webhookEvent.findMany({
      select: { topic: true },
      distinct: ["topic"],
      orderBy: { topic: "asc" },
    });
  }

  return {
    shop,
    stats,
    recentEvents,
    events: eventsResult.events,
    pagination: {
      page: eventsResult.page,
      limit: eventsResult.limit,
      total: eventsResult.total,
      totalPages: eventsResult.totalPages,
    },
    filters: { status, topic },
    availableTopics: topics.map((t) => t.topic),
  };
};

export default function AppPage() {
  // Real data from loader
  const {
    shop,
    stats,
    recentEvents,
    events,
    pagination,
    filters,
    availableTopics,
  } = useLoaderData<typeof loader>();

  // Real useSearchParams hook
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab state - use URL param or default to dashboard
  const urlTab = searchParams.get("tab") || "dashboard";
  const [selectedTab, setSelectedTab] = useState(urlTab);

  // Sync state with URL param changes
  useEffect(() => {
    setSelectedTab(urlTab);
  }, [urlTab]);

  // Events filter state
  const [statusFilter, setStatusFilter] = useState<string>(
    filters.status || "all",
  );
  const [topicFilter, setTopicFilter] = useState<string>(
    filters.topic || "all",
  );

  const handleTabChange = useCallback(
    (newTabId: string) => {
      setSelectedTab(newTabId);
      const params = new URLSearchParams(searchParams);
      params.set("tab", newTabId);
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleFilterChange = () => {
    const params = new URLSearchParams(searchParams);
    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    } else {
      params.delete("status");
    }
    if (topicFilter !== "all") {
      params.set("topic", topicFilter);
    } else {
      params.delete("topic");
    }
    params.set("page", "1");
    setSearchParams(params, { replace: true });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="app-container">
      <div className="app-content">
        <AppHeader
          shop={shop}
          selectedTab={selectedTab}
          onTabChange={handleTabChange}
        />

        {/* Dashboard Content */}
        {selectedTab === "dashboard" && (
          <DashboardTab
            stats={stats}
            recentEvents={recentEvents}
            onViewFullLog={() => handleTabChange("events")}
          />
        )}

        {/* Events Tab */}
        {selectedTab === "events" && (
          <EventsTab
            events={events}
            pagination={pagination}
            statusFilter={statusFilter}
            topicFilter={topicFilter}
            availableTopics={availableTopics}
            onStatusFilterChange={setStatusFilter}
            onTopicFilterChange={setTopicFilter}
            onFilterApply={handleFilterChange}
            onPageChange={handlePageChange}
          />
        )}

        {/* Settings Tab */}
        {selectedTab === "settings" && <SettingsTab />}
      </div>
    </div>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
