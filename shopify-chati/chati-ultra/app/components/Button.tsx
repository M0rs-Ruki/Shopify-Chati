interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline" | "ghost";
  disabled?: boolean;
  className?: string;
}

export const Button = ({
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

