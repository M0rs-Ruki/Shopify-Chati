interface ModernCardProps {
  children: React.ReactNode;
  className?: string;
}

export const ModernCard = ({
  children,
  className = "",
}: ModernCardProps) => (
  <div className={`app-card ${className}`}>{children}</div>
);

