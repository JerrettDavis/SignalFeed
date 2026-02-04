import React from "react";
import { LayoutGrid, Table } from "lucide-react";

export type ViewMode = "grid" | "table";

export interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  className?: string;
}

export const ViewToggle = ({
  value,
  onChange,
  className = "",
}: ViewToggleProps) => {
  const buttonClass = (mode: ViewMode) =>
    `
    rounded-full
    border
    px-3
    py-1.5
    text-xs
    font-medium
    transition
    flex
    items-center
    gap-1.5
    ${
      value === mode
        ? "border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)]/10 text-[color:var(--accent-primary)]"
        : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-elevated)]"
    }
  `.trim();

  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={buttonClass("grid")}
        aria-label="Grid view"
      >
        <LayoutGrid size={14} />
        Grid
      </button>
      <button
        type="button"
        onClick={() => onChange("table")}
        className={buttonClass("table")}
        aria-label="Table view"
      >
        <Table size={14} />
        Table
      </button>
    </div>
  );
};
