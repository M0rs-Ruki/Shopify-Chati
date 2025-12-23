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
    success: "app-badge-success",
    warning: "app-badge-warning",
    destructive: "app-badge-destructive",
    default: "app-badge-default",
  };
  return (
    <span className={`app-badge ${variants[variant]} ${className}`}>
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
}) => <div className={`app-card ${className}`}>{children}</div>;

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}

const StatCard = ({ title, value, icon: Icon, colorClass }: StatCardProps) => {
  // Map colorClass to icon wrapper background and icon color
  const colorMap: Record<string, { bg: string; icon: string }> = {
    "bg-emerald-500 text-emerald-700": {
      bg: "bg-emerald-50",
      icon: "text-emerald-600",
    },
    "bg-amber-500 text-amber-700": {
      bg: "bg-amber-50",
      icon: "text-amber-600",
    },
    "bg-teal-500 text-teal-700": {
      bg: "bg-teal-50",
      icon: "text-teal-600",
    },
    "bg-red-500 text-red-700": {
      bg: "bg-red-50",
      icon: "text-red-600",
    },
  };

  const colors = colorMap[colorClass] || {
    bg: "bg-gray-50",
    icon: "text-gray-600",
  };

  return (
    <ModernCard className="app-stat-card">
      <div className="app-stat-content">
        <div className="app-stat-info">
          <p className="app-stat-title">{title}</p>
          <h3 className="app-stat-value">{value}</h3>
        </div>
        <div className={`app-stat-icon-wrapper ${colors.bg}`}>
          <Icon className={`app-stat-icon ${colors.icon}`} />
        </div>
      </div>
    </ModernCard>
  );
};

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
  const variants = {
    primary: "app-button-primary",
    outline: "app-button-outline",
    ghost: "app-button-ghost",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`app-button ${variants[variant]} ${className}`}
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
    <div className="app-container">
      <div className="app-content">
        {/* Header Section */}
        <div className="app-header">
          <div className="app-header-title-section">
            <h1 className="app-title">
              <span className="app-title-brand">Chati</span>
              <span className="app-title-badge">Enterprise</span>
            </h1>
            <p className="app-connection-status">
              <span className="app-connection-indicator">
                <span className="app-connection-ping"></span>
                <span className="app-connection-dot"></span>
              </span>
              Connected to {shop}
            </p>
          </div>

          {/* Navigation - Flat Style with Green Accents */}
          <div className="app-nav-container">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`app-nav-tab ${
                    isActive ? "app-nav-tab-active" : "app-nav-tab-inactive"
                  }`}
                >
                  <Icon
                    className={`app-nav-tab-icon ${isActive ? "app-nav-tab-icon-active" : ""}`}
                  />
                  {tab.content}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dashboard Content */}
        {selectedTab === "dashboard" && (
          <div className="app-dashboard-content">
            {/* Stats Grid */}
            <div className="app-stats-grid">
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
              <div className="app-live-stream-header">
                <div className="app-card-header-left">
                  <div className="app-card-icon-wrapper">
                    <Activity className="app-card-icon" />
                  </div>
                  <div>
                    <h2 className="app-live-stream-title">Live Stream</h2>
                    <p className="app-live-stream-subtitle">
                      Real-time Webhook Activity
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => handleTabChange("events")}
                  className="app-button-small"
                >
                  View Full Log
                </Button>
              </div>

              {recentEvents.length === 0 ? (
                <div className="app-card-empty">
                  <Webhook className="app-card-empty-icon" />
                  <p>No webhook events recorded yet.</p>
                </div>
              ) : (
                <div className="app-table-container">
                  <table className="app-table">
                    <thead className="app-table-head">
                      <tr>
                        <th className="app-table-head-cell">Topic</th>
                        <th className="app-table-head-cell">Status</th>
                        <th className="app-table-head-cell">Time</th>
                      </tr>
                    </thead>
                    <tbody className="app-table-body">
                      {recentEvents.map((event) => (
                        <tr key={event.id} className="app-table-row group">
                          <td className="app-table-cell-topic">
                            {event.topic}
                          </td>
                          <td className="app-table-cell">
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
                          <td className="app-table-cell-time">
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
          <div className="app-events-content">
            <ModernCard className="app-card-body">
              <div className="app-form-container">
                <div className="app-form-fields">
                  <div className="app-form-field">
                    <label htmlFor="status-filter" className="app-form-label">
                      <Filter className="w-3 h-3" /> Filter by Status
                    </label>
                    <select
                      id="status-filter"
                      name="status-filter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="app-form-select"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="success">Success</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                  <div className="app-form-field">
                    <label htmlFor="topic-filter" className="app-form-label">
                      <Webhook className="w-3 h-3" /> Filter by Topic
                    </label>
                    <select
                      id="topic-filter"
                      name="topic-filter"
                      value={topicFilter}
                      onChange={(e) => setTopicFilter(e.target.value)}
                      className="app-form-select"
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
                <div className="app-form-button-container">
                  <Button
                    variant="primary"
                    onClick={handleFilterChange}
                    className="app-button-full"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </ModernCard>

            <ModernCard>
              <div className="app-event-logs-header">
                <div>
                  <h2 className="app-event-logs-title">Event Logs</h2>
                  <p className="app-event-logs-subtitle">
                    Showing {events.length} results
                  </p>
                </div>
                <div className="hidden sm:block">
                  <span className="app-event-logs-pagination-badge">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                </div>
              </div>
              {events.length === 0 ? (
                <div className="app-event-logs-empty">
                  <div className="app-event-logs-empty-icon-wrapper">
                    <Search className="app-event-logs-empty-icon" />
                  </div>
                  <p className="app-event-logs-empty-title">No events found</p>
                  <p className="app-event-logs-empty-text">
                    Try adjusting your filters.
                  </p>
                </div>
              ) : (
                <>
                  <div className="app-table-container">
                    <table className="app-table">
                      <thead className="app-table-head">
                        <tr>
                          <th className="app-table-head-cell-uppercase">ID</th>
                          <th className="app-table-head-cell-uppercase">
                            Topic
                          </th>
                          <th className="app-table-head-cell-uppercase">
                            Status
                          </th>
                          <th className="app-table-head-cell-uppercase">
                            Error
                          </th>
                          <th className="app-table-head-cell-uppercase">
                            Created
                          </th>
                        </tr>
                      </thead>
                      <tbody className="app-table-body">
                        {events.map((event) => (
                          <tr key={event.id} className="app-table-row group">
                            <td className="app-table-cell-id">
                              {String(event.id).substring(0, 8)}...
                            </td>
                            <td className="app-table-cell">
                              {event.topic}
                              <div className="app-table-cell-resource">
                                {event.resourceId}
                              </div>
                            </td>
                            <td className="app-table-cell">
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
                            <td className="app-table-cell-error">
                              {event.error ? (
                                <span className="app-table-cell-error-badge">
                                  <XCircle className="app-table-cell-error-icon" />{" "}
                                  {event.error}
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="app-table-cell">
                              {new Date(event.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="app-pagination">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="app-button-small"
                    >
                      Previous
                    </Button>
                    <span className="app-pagination-info">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="app-button-small"
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
          <div className="app-settings-container">
            <ModernCard className="app-settings-card">
              <div className="app-settings-icon-wrapper">
                <Settings className="app-settings-icon" />
              </div>
              <h2 className="app-settings-title">Configuration</h2>
              <p className="app-settings-description">
                Advanced settings and configuration options for Chati are
                currently under development. Check back soon for API keys and
                webhooks customization.
              </p>
              <Button
                variant="primary"
                disabled
                className="app-settings-button"
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
