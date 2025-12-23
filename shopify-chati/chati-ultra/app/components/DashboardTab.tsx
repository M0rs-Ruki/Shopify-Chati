import { Activity, Clock, CheckCircle2, XCircle, Webhook } from "lucide-react";
import { StatCard } from "./StatCard";
import { ModernCard } from "./ModernCard";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { StatCardSkeleton, TableSkeleton } from "./Skeleton";

interface DashboardTabProps {
  stats: {
    total: number;
    pending: number;
    success: number;
    failed: number;
  };
  recentEvents: Array<{
    id: number;
    topic: string;
    status: string;
    createdAt: Date;
  }>;
  onViewFullLog: () => void;
  isLoading?: boolean;
}

export const DashboardTab = ({
  stats,
  recentEvents,
  onViewFullLog,
  isLoading = false,
}: DashboardTabProps) => {
  if (isLoading) {
    return (
      <div className="app-dashboard-content">
        <div className="app-stats-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
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
          </div>
          <TableSkeleton rows={5} />
        </ModernCard>
      </div>
    );
  }

  return (
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
            onClick={onViewFullLog}
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
                    <td className="app-table-cell-topic">{event.topic}</td>
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
  );
};

