import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { Page, Card, Text, BlockStack, Banner } from "@shopify/polaris";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  getWebhookStats,
  getRecentWebhookEvents,
} from "../utils/webhook-queries.server";
import { Badge } from "../components/ui/badge";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  console.log("📊 Dashboard - Querying for shop:", shop);

  const [stats, recentEvents] = await Promise.all([
    getWebhookStats(shop),
    getRecentWebhookEvents(shop, 5),
  ]);

  console.log("📊 Dashboard - Stats:", stats);
  console.log("📊 Dashboard - Recent events count:", recentEvents.length);

  return {
    shop,
    stats,
    recentEvents,
  };
};

export default function Dashboard() {
  const { shop, stats, recentEvents } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      <Page
        title="Dashboard"
        primaryAction={{
          content: "View All Events",
          url: "/app/events",
        }}
      >
        <div className="mt-6 space-y-6">
          {/* App Status */}
          <Card>
            <div className="p-6">
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  App Status
                </Text>
                <div className="mt-4">
                  <Banner status="success" title="Connected">
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
                    <Text variant="bodyMd" as="p" color="subdued">
                      Total Events
                    </Text>
                    <Text variant="headingLg" as="p" fontWeight="bold">
                      {stats.total}
                    </Text>
                  </div>
                  <div className="rounded-lg border bg-white p-4">
                    <Text variant="bodyMd" as="p" color="subdued">
                      Pending
                    </Text>
                    <Text variant="headingLg" as="p" fontWeight="bold">
                      {stats.pending}
                    </Text>
                  </div>
                  <div className="rounded-lg border bg-white p-4">
                    <Text variant="bodyMd" as="p" color="subdued">
                      Success
                    </Text>
                    <Text variant="headingLg" as="p" fontWeight="bold">
                      {stats.success}
                    </Text>
                  </div>
                  <div className="rounded-lg border bg-white p-4">
                    <Text variant="bodyMd" as="p" color="subdued">
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
                    <Text variant="bodyMd" as="p" color="subdued">
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
                            <td className="px-4 py-2 text-sm">{event.topic}</td>
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
                              {new Date(event.createdAt).toLocaleString()}
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
      </Page>
    </div>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
