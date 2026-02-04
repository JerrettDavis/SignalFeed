import React from "react";

export interface AdminCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
  variant?: "default" | "highlight" | "danger";
}

export const AdminCard = ({
  children,
  onClick,
  selected = false,
  className = "",
  variant = "default",
}: AdminCardProps) => {
  const variantStyles = {
    default: "",
    highlight:
      "border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)]/5",
    danger:
      "border-[color:var(--accent-danger)] bg-[color:var(--accent-danger)]/5",
  };

  const selectedStyles = selected
    ? "border-[color:var(--accent-primary)] border-2"
    : "border-[color:var(--border)]";

  const clickableStyles = onClick
    ? "cursor-pointer hover:shadow-[var(--shadow-md)] hover:bg-[color:var(--surface-elevated)]"
    : "";

  return (
    <div
      className={`
        rounded-xl
        border
        bg-[color:var(--surface)]
        p-5
        shadow-[var(--shadow-sm)]
        transition
        ${selectedStyles}
        ${variantStyles[variant]}
        ${clickableStyles}
        ${className}
      `.trim()}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
