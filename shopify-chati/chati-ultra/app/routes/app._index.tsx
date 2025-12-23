import { useState, useCallback, useEffect } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";
import { Page, Card, Text, BlockStack, Banner, Button } from "@shopify/polaris";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  getWebhookStats,
  getRecentWebhookEvents,
  getWebhookEvents,
} from "../utils/webhook-queries.server";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  console.log("📊 Single Page - Querying for shop:", shop);

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "20", 10);
  const status = url.searchParams.get("status") as
    | "pending"
    | "success"
    | "failed"
    | null;
  const topic = url.searchParams.get("topic") || null;

  const filters = {
    ...(status && { status }),
    ...(topic && { topic }),
  };

  // Load all data needed for all tabs
  const [stats, recentEvents, eventsResult] = await Promise.all([
    getWebhookStats(shop),
    getRecentWebhookEvents(shop, 5),
    getWebhookEvents(shop, filters, { page, limit }),
  ]);

  // Get unique topics for filter dropdown
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

  console.log("📊 Single Page - Stats:", stats);
  console.log("📊 Single Page - Recent events:", recentEvents.length);
  console.log("📊 Single Page - Events:", eventsResult.events.length);

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
  const {
    shop,
    stats,
    recentEvents,
    events,
    pagination,
    filters,
    availableTopics,
  } = useLoaderData<typeof loader>();
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
    (selectedTabIndex: number) => {
      const tabs = ["dashboard", "events", "settings"];
      const newTab = tabs[selectedTabIndex];
      setSelectedTab(newTab);
      const params = new URLSearchParams(searchParams);
      params.set("tab", newTab);
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
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    setSearchParams(params);
  };

  const tabs = [
    {
      id: "dashboard",
      content: "Dashboard",
    },
    {
      id: "events",
      content: "Events",
    },
    {
      id: "settings",
      content: "Settings",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Page title="Chati Ultra">
        <div className="mt-6">
          {/* Custom Tabs Navigation */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex space-x-8" aria-label="Tabs">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(index)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      selectedTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                  aria-current={selectedTab === tab.id ? "page" : undefined}
                >
                  {tab.content}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div>
            {/* Dashboard Tab */}
            {selectedTab === "dashboard" && (
              <div>
                <div className="space-y-6">
                  {/* App Status */}
                  <Card>
                    <div className="p-6">
                      <BlockStack gap="400">
                        <Text variant="headingMd" as="h2">
                          App Status
                        </Text>
                        <div className="mt-4">
                          <Banner tone="success" title="Connected">
                            <p>Your app is connected to {shop}</p>
                          </Banner>
                        </div>
                      </BlockStack>
                    </div>
                  </Card>

                  {/* Webhook Statistics */}
                  <Card>
                    <div className="p-6">
                      <BlockStack gap="400">
                        <Text variant="headingMd" as="h2">
                          Webhook Statistics
                        </Text>
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="rounded-lg border bg-white p-4">
                            <Text variant="bodyMd" as="p" tone="subdued">
                              Total Events
                            </Text>
                            <Text variant="headingLg" as="p" fontWeight="bold">
                              {stats.total}
                            </Text>
                          </div>
                          <div className="rounded-lg border bg-white p-4">
                            <Text variant="bodyMd" as="p" tone="subdued">
                              Pending
                            </Text>
                            <Text variant="headingLg" as="p" fontWeight="bold">
                              {stats.pending}
                            </Text>
                          </div>
                          <div className="rounded-lg border bg-white p-4">
                            <Text variant="bodyMd" as="p" tone="subdued">
                              Success
                            </Text>
                            <Text variant="headingLg" as="p" fontWeight="bold">
                              {stats.success}
                            </Text>
                          </div>
                          <div className="rounded-lg border bg-white p-4">
                            <Text variant="bodyMd" as="p" tone="subdued">
                              Failed
                            </Text>
                            <Text variant="headingLg" as="p" fontWeight="bold">
                              {stats.failed}
                            </Text>
                          </div>
                        </div>
                      </BlockStack>
                    </div>
                  </Card>

                  {/* Recent Events */}
                  <Card>
                    <div className="p-6">
                      <BlockStack gap="400">
                        <Text variant="headingMd" as="h2">
                          Recent Webhook Events
                        </Text>
                        {recentEvents.length === 0 ? (
                          <div className="mt-4">
                            <Text variant="bodyMd" as="p" tone="subdued">
                              No webhook events yet
                            </Text>
                          </div>
                        ) : (
                          <div className="mt-4 overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="border-b">
                                  <th className="px-4 py-2 text-left text-sm font-medium">
                                    Topic
                                  </th>
                                  <th className="px-4 py-2 text-left text-sm font-medium">
                                    Status
                                  </th>
                                  <th className="px-4 py-2 text-left text-sm font-medium">
                                    Created
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {recentEvents.map((event) => (
                                  <tr key={event.id} className="border-b">
                                    <td className="px-4 py-2 text-sm">
                                      {event.topic}
                                    </td>
                                    <td className="px-4 py-2">
                                      <Badge
                                        variant={
                                          event.status === "success"
                                            ? "success"
                                            : event.status === "failed"
                                              ? "destructive"
                                              : "warning"
                                        }
                                      >
                                        {event.status}
                                      </Badge>
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-600">
                                      {new Date(
                                        event.createdAt,
                                      ).toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </BlockStack>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Events Tab */}
            {selectedTab === "events" && (
              <div>
                <div className="space-y-6">
                  {/* Filters */}
                  <Card>
                    <div className="p-6">
                      <BlockStack gap="400">
                        <Text variant="headingMd" as="h2">
                          Filters
                        </Text>
                        <div className="mt-4 flex flex-wrap gap-4">
                          <div className="w-full sm:w-48">
                            <div className="mb-2 text-sm font-medium">
                              Status
                            </div>
                            <Select
                              value={statusFilter}
                              onValueChange={setStatusFilter}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="All statuses" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="success">Success</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-full sm:w-48">
                            <div className="mb-2 text-sm font-medium">
                              Topic
                            </div>
                            <Select
                              value={topicFilter}
                              onValueChange={setTopicFilter}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="All topics" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                {availableTopics.map((topic) => (
                                  <SelectItem key={topic} value={topic}>
                                    {topic}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-end">
                            <Button onClick={handleFilterChange}>
                              Apply Filters
                            </Button>
                          </div>
                        </div>
                      </BlockStack>
                    </div>
                  </Card>

                  {/* Events Table */}
                  <Card>
                    <div className="p-6">
                      <BlockStack gap="400">
                        <div className="flex items-center justify-between">
                          <Text variant="headingMd" as="h2">
                            Events ({pagination.total})
                          </Text>
                        </div>
                        {events.length === 0 ? (
                          <div className="mt-4">
                            <Text variant="bodyMd" as="p" tone="subdued">
                              No webhook events found
                            </Text>
                          </div>
                        ) : (
                          <>
                            <div className="mt-4 overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Topic</TableHead>
                                    <TableHead>Resource ID</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Error</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Processed</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {events.map((event) => (
                                    <TableRow key={event.id}>
                                      <TableCell className="font-mono text-xs">
                                        {event.id}
                                      </TableCell>
                                      <TableCell>{event.topic}</TableCell>
                                      <TableCell className="font-mono text-xs">
                                        {event.resourceId}
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          variant={
                                            event.status === "success"
                                              ? "success"
                                              : event.status === "failed"
                                                ? "destructive"
                                                : "warning"
                                          }
                                        >
                                          {event.status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="max-w-xs truncate text-xs">
                                        {event.error || "-"}
                                      </TableCell>
                                      <TableCell className="text-sm text-gray-600">
                                        {new Date(
                                          event.createdAt,
                                        ).toLocaleString()}
                                      </TableCell>
                                      <TableCell className="text-sm text-gray-600">
                                        {event.processedAt
                                          ? new Date(
                                              event.processedAt,
                                            ).toLocaleString()
                                          : "-"}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                              <div className="mt-6 flex items-center justify-between">
                                <Text variant="bodyMd" as="p" tone="subdued">
                                  Page {pagination.page} of{" "}
                                  {pagination.totalPages}
                                </Text>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() =>
                                      handlePageChange(pagination.page - 1)
                                    }
                                    disabled={pagination.page === 1}
                                  >
                                    Previous
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      handlePageChange(pagination.page + 1)
                                    }
                                    disabled={
                                      pagination.page === pagination.totalPages
                                    }
                                  >
                                    Next
                                  </Button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </BlockStack>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {selectedTab === "settings" && (
              <div>
                <div className="mt-6">
                  <Card>
                    <div className="p-6">
                      <BlockStack gap="400">
                        <Text variant="headingMd" as="h2">
                          Settings
                        </Text>
                        <div className="mt-4">
                          <Text variant="bodyMd" as="p" tone="subdued">
                            Settings page coming soon. This is a placeholder for
                            future configuration options.
                          </Text>
                        </div>
                      </BlockStack>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </Page>
    </div>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
