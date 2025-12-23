import { ModernCard } from "./ModernCard";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}

export const StatCard = ({
  title,
  value,
  icon: Icon,
  colorClass,
}: StatCardProps) => {
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

