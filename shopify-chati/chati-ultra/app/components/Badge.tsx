interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "destructive" | "default";
  className?: string;
}

export const Badge = ({
  children,
  variant = "default",
  className = "",
}: BadgeProps) => {
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

