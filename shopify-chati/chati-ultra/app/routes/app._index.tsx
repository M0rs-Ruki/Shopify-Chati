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
import {
  LayoutDashboard,
  List,
  Settings,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Webhook,
  Filter,
} from "lucide-react";

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

// --- UI COMPONENTS ---

const Badge = ({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "success" | "warning" | "destructive" | "default";
  className?: string;
}) => {
  const variants = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    destructive: "bg-red-50 text-red-700 border-red-200",
    default: "bg-gray-50 text-gray-700 border-gray-200",
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

const ModernCard = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}
  >
    {children}
  </div>
);

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}

const StatCard = ({ title, value, icon: Icon, colorClass }: StatCardProps) => (
  <ModernCard className="p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1 tracking-wide">
          {title}
        </p>
        <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
          {value}
        </h3>
      </div>
      <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${colorClass.replace("bg-", "text-")}`} />
      </div>
    </div>
  </ModernCard>
);

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline" | "ghost";
  disabled?: boolean;
  className?: string;
}

const Button = ({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  className = "",
}: ButtonProps) => {
  const baseStyle =
    "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-white";
  const variants = {
    primary:
      "bg-emerald-600 text-white hover:bg-emerald-700 border border-transparent",
    outline: "border border-gray-200 bg-white hover:bg-gray-50 text-gray-900",
    ghost: "hover:bg-gray-100 hover:text-gray-900 text-gray-600",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant as keyof typeof variants]} h-10 px-4 py-2 ${className}`}
    >
      {children}
    </button>
  );
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

  const tabs = [
    { id: "dashboard", content: "Overview", icon: LayoutDashboard },
    { id: "events", content: "Event Logs", icon: List },
    { id: "settings", content: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
              {/* Updated Gradient to Greens */}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Chati
              </span>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
                Enterprise
              </span>
            </h1>
            <p className="text-gray-500 flex items-center gap-2 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Connected to {shop}
            </p>
          </div>

          {/* Navigation - Flat Style with Green Accents */}
          <div className="bg-white p-1 rounded-xl border border-gray-200 flex items-center gap-1 w-full md:w-auto overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap
                    ${
                      isActive
                        ? "bg-emerald-600 text-white"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : ""}`} />
                  {tab.content}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dashboard Content */}
        {selectedTab === "dashboard" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Events"
                value={stats.total}
                icon={Activity}
                colorClass="bg-emerald-500 text-emerald-700"
              />
              <StatCard
                title="Processing"
                value={stats.pending}
                icon={Clock}
                colorClass="bg-amber-500 text-amber-700"
              />
              <StatCard
                title="Success Rate"
                value={
                  stats.total > 0
                    ? `${Math.round((stats.success / stats.total) * 100)}%`
                    : "0%"
                }
                icon={CheckCircle2}
                colorClass="bg-teal-500 text-teal-700"
              />
              <StatCard
                title="Failed Events"
                value={stats.failed}
                icon={XCircle}
                colorClass="bg-red-500 text-red-700"
              />
            </div>

            {/* Recent Activity Card */}
            <ModernCard>
              <div className="border-b border-gray-100 p-6 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <Activity className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Live Stream
                    </h2>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Real-time Webhook Activity
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => handleTabChange("events")}
                  className="text-xs"
                >
                  View Full Log
                </Button>
              </div>

              {recentEvents.length === 0 ? (
                <div className="p-16 text-center text-gray-500">
                  <Webhook className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p>No webhook events recorded yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Topic</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recentEvents.map((event) => (
                        <tr
                          key={event.id}
                          className="group hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 font-medium text-gray-900 group-hover:text-emerald-600 transition-colors">
                            {event.topic}
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              variant={
                                event.status === "success"
                                  ? "success"
                                  : event.status === "failed"
                                    ? "destructive"
                                    : event.status === "pending"
                                      ? "warning"
                                      : "default"
                              }
                            >
                              {event.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                            {new Date(event.createdAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ModernCard>
          </div>
        )}

        {/* Events Tab */}
        {selectedTab === "events" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            <ModernCard className="p-6">
              <div className="flex flex-col lg:flex-row gap-6 items-end lg:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
                  <div className="w-full sm:w-64 space-y-2">
                    <label
                      htmlFor="status-filter"
                      className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"
                    >
                      <Filter className="w-3 h-3" /> Filter by Status
                    </label>
                    <select
                      id="status-filter"
                      name="status-filter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="success">Success</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                  <div className="w-full sm:w-64 space-y-2">
                    <label
                      htmlFor="topic-filter"
                      className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"
                    >
                      <Webhook className="w-3 h-3" /> Filter by Topic
                    </label>
                    <select
                      id="topic-filter"
                      name="topic-filter"
                      value={topicFilter}
                      onChange={(e) => setTopicFilter(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    >
                      <option value="all">All Topics</option>
                      {availableTopics.map((topic) => (
                        <option key={topic} value={topic}>
                          {topic}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex-shrink-0 w-full sm:w-auto">
                  <Button
                    variant="primary"
                    onClick={handleFilterChange}
                    className="w-full sm:w-auto"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </ModernCard>

            <ModernCard>
              <div className="border-b border-gray-100 p-6 bg-gray-50/50 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Event Logs
                  </h2>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">
                    Showing {events.length} results
                  </p>
                </div>
                <div className="hidden sm:block">
                  <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 border border-emerald-100">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                </div>
              </div>
              {events.length === 0 ? (
                <div className="p-24 text-center text-gray-500 flex flex-col items-center justify-center">
                  <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-900">
                    No events found
                  </p>
                  <p className="text-sm mt-1">Try adjusting your filters.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-100 uppercase text-xs tracking-wider font-semibold">
                        <tr>
                          <th className="px-6 py-4">ID</th>
                          <th className="px-6 py-4">Topic</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Error</th>
                          <th className="px-6 py-4">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {events.map((event) => (
                          <tr
                            key={event.id}
                            className="hover:bg-gray-50 transition-colors group"
                          >
                            <td className="px-6 py-4 font-mono text-xs text-gray-400 group-hover:text-gray-600">
                              {String(event.id).substring(0, 8)}...
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-900">
                              {event.topic}
                              <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                                {event.resourceId}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                variant={
                                  event.status === "success"
                                    ? "success"
                                    : event.status === "failed"
                                      ? "destructive"
                                      : event.status === "pending"
                                        ? "warning"
                                        : "default"
                                }
                              >
                                {event.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">
                              {event.error ? (
                                <span className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">
                                  <XCircle className="w-3 h-3" /> {event.error}
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-500">
                              {new Date(event.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="border-t border-gray-100 p-4 flex items-center justify-between bg-gray-50/50">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="text-xs"
                    >
                      Previous
                    </Button>
                    <span className="text-xs font-medium text-gray-500 sm:hidden">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="text-xs"
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}
            </ModernCard>
          </div>
        )}

        {/* Settings Tab */}
        {selectedTab === "settings" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            <ModernCard className="p-16 text-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-emerald-100 rotate-3 hover:rotate-6 transition-transform">
                <Settings className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Configuration
              </h2>
              <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
                Advanced settings and configuration options for Chati are
                currently under development. Check back soon for API keys and
                webhooks customization.
              </p>
              <Button
                variant="primary"
                disabled
                className="px-8 opacity-75 cursor-not-allowed"
              >
                Coming Soon
              </Button>
            </ModernCard>
          </div>
        )}
      </div>
    </div>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
