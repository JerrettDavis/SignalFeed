"use client";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: "up" | "down";
  trendValue?: string;
}

export function MetricCard({
  title,
  value,
  trend,
  trendValue,
}: MetricCardProps) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-[color:var(--text-secondary)]">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-[color:var(--text-primary)]">
            {value}
          </p>
        </div>
        {trend && trendValue && (
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
              trend === "up"
                ? "bg-[color:var(--accent-success)]/10 text-[color:var(--accent-success)]"
                : "bg-[color:var(--accent-danger)]/10 text-[color:var(--accent-danger)]"
            }`}
          >
            {trend === "up" ? (
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            ) : (
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            )}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
}
