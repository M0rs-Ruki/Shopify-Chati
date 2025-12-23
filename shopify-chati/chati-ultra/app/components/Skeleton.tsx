interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className = "" }: SkeletonProps) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export const StatCardSkeleton = () => (
  <div className="app-card app-stat-card">
    <div className="app-stat-content">
      <div className="app-stat-info">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-16" />
      </div>
      <Skeleton className="w-12 h-12 rounded-lg" />
    </div>
  </div>
);

export const TableRowSkeleton = () => (
  <tr className="app-table-row">
    <td className="app-table-cell">
      <Skeleton className="h-4 w-32" />
    </td>
    <td className="app-table-cell">
      <Skeleton className="h-6 w-20 rounded-md" />
    </td>
    <td className="app-table-cell">
      <Skeleton className="h-4 w-24" />
    </td>
  </tr>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
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
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton key={i} />
        ))}
      </tbody>
    </table>
  </div>
);

