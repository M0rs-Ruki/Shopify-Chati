import { useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";
import { Page, Card, BlockStack, Text, Button } from "@shopify/polaris";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getWebhookEvents } from "../utils/webhook-queries.server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
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

  console.log("📋 Events - Querying for shop:", shop);

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

  const result = await getWebhookEvents(shop, filters, { page, limit });

  console.log("📋 Events - Found events:", result.events.length, "of", result.total);

  // Get unique topics for filter dropdown
  const db = (await import("../db.server")).default;
  const normalizedShop = shop.toLowerCase().trim();
  
  // Try to get topics for this shop, fallback to all topics if none found
  let topics = await db.webhookEvent.findMany({
    where: { shop: normalizedShop },
    select: { topic: true },
    distinct: ["topic"],
    orderBy: { topic: "asc" },
  });
  
  // If no topics for this shop, get all topics
  if (topics.length === 0) {
    topics = await db.webhookEvent.findMany({
      select: { topic: true },
      distinct: ["topic"],
      orderBy: { topic: "asc" },
    });
  }

  return {
    shop,
    events: result.events,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
    filters: { status, topic },
    availableTopics: topics.map((t) => t.topic),
  };
};

export default function Events() {
  const { events, pagination, filters, availableTopics } =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [statusFilter, setStatusFilter] = useState<string>(
    filters.status || "all"
  );
  const [topicFilter, setTopicFilter] = useState<string>(
    filters.topic || "all"
  );

  const handleFilterChange = () => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }
    if (topicFilter !== "all") {
      params.set("topic", topicFilter);
    }
    params.set("page", "1"); // Reset to first page
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Page title="Webhook Events">
        <div className="mt-6 space-y-6">
          {/* Filters */}
          <Card>
            <div className="p-6">
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Filters
                </Text>
                <div className="mt-4 flex flex-wrap gap-4">
                  <div className="w-full sm:w-48">
                    <label className="mb-2 block text-sm font-medium">
                      Status
                    </label>
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
                    <label className="mb-2 block text-sm font-medium">
                      Topic
                    </label>
                    <Select value={topicFilter} onValueChange={setTopicFilter}>
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
                    <Button onClick={handleFilterChange}>Apply Filters</Button>
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
                    <Text variant="bodyMd" as="p" color="subdued">
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
                                {new Date(event.createdAt).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {event.processedAt
                                  ? new Date(event.processedAt).toLocaleString()
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
                        <Text variant="bodyMd" as="p" color="subdued">
                          Page {pagination.page} of {pagination.totalPages}
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
                            disabled={pagination.page === pagination.totalPages}
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
      </Page>
    </div>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

