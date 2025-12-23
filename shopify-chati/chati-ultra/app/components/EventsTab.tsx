import { Filter, Webhook, Search, XCircle } from "lucide-react";
import { ModernCard } from "./ModernCard";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { TableSkeleton } from "./Skeleton";

interface EventsTabProps {
  events: Array<{
    id: number;
    topic: string;
    resourceId: string;
    status: string;
    error: string | null;
    createdAt: Date;
  }>;
  pagination: {
    page: number;
    totalPages: number;
  };
  statusFilter: string;
  topicFilter: string;
  availableTopics: string[];
  onStatusFilterChange: (value: string) => void;
  onTopicFilterChange: (value: string) => void;
  onFilterApply: () => void;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export const EventsTab = ({
  events,
  pagination,
  statusFilter,
  topicFilter,
  availableTopics,
  onStatusFilterChange,
  onTopicFilterChange,
  onFilterApply,
  onPageChange,
  isLoading = false,
}: EventsTabProps) => {
  if (isLoading) {
    return (
      <div className="app-events-content">
        <ModernCard className="app-card-body">
          <div className="app-form-container">
            <div className="app-form-fields">
              <div className="app-form-field">
                <div className="app-form-label">
                  <Filter className="w-3 h-3" /> Filter by Status
                </div>
                <div className="app-form-select h-10" />
              </div>
              <div className="app-form-field">
                <div className="app-form-label">
                  <Webhook className="w-3 h-3" /> Filter by Topic
                </div>
                <div className="app-form-select h-10" />
              </div>
            </div>
          </div>
        </ModernCard>
        <ModernCard>
          <TableSkeleton rows={10} />
        </ModernCard>
      </div>
    );
  }

  return (
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
                onChange={(e) => onStatusFilterChange(e.target.value)}
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
                onChange={(e) => onTopicFilterChange(e.target.value)}
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
              onClick={onFilterApply}
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
                    <th className="app-table-head-cell-uppercase">Topic</th>
                    <th className="app-table-head-cell-uppercase">Status</th>
                    <th className="app-table-head-cell-uppercase">Error</th>
                    <th className="app-table-head-cell-uppercase">Created</th>
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
                onClick={() => onPageChange(pagination.page - 1)}
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
                onClick={() => onPageChange(pagination.page + 1)}
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
  );
};

