"use client";

import { useState, useEffect } from "react";

interface ReactionCountsProps {
  sightingId: string;
  initialUpvotes?: number;
  initialDownvotes?: number;
  initialConfirmations?: number;
  initialDisputes?: number;
  compact?: boolean;
}

interface ReactionCounts {
  upvotes: number;
  downvotes: number;
  confirmations: number;
  disputes: number;
  spamReports: number;
}

export function ReactionCounts({
  sightingId,
  initialUpvotes = 0,
  initialDownvotes = 0,
  initialConfirmations = 0,
  initialDisputes = 0,
  compact = false,
}: ReactionCountsProps) {
  const [counts, setCounts] = useState<ReactionCounts>({
    upvotes: initialUpvotes,
    downvotes: initialDownvotes,
    confirmations: initialConfirmations,
    disputes: initialDisputes,
    spamReports: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReactions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/sightings/${sightingId}/reactions`);
        if (!response.ok) {
          throw new Error("Failed to fetch reactions");
        }

        const data = await response.json();
        setCounts(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load reactions"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchReactions();
  }, [sightingId]);

  if (error) {
    return (
      <div className="text-xs text-[color:var(--accent-danger)]">
        Failed to load reactions
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex gap-2">
        <div className="h-6 w-16 animate-pulse rounded bg-[color:var(--surface)]" />
        <div className="h-6 w-16 animate-pulse rounded bg-[color:var(--surface)]" />
      </div>
    );
  }

  const netScore =
    counts.upvotes -
    counts.downvotes +
    counts.confirmations * 2 -
    counts.disputes * 2;

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-xs font-medium text-[color:var(--text-secondary)]">
        {/* Net Score */}
        <div
          className={`flex items-center gap-1 ${
            netScore > 0
              ? "text-[color:var(--accent-success)]"
              : netScore < 0
                ? "text-[color:var(--accent-danger)]"
                : "text-[color:var(--text-secondary)]"
          }`}
          title={`Net score: ${netScore}`}
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {netScore >= 0 ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            )}
          </svg>
          <span className="font-semibold">{Math.abs(netScore)}</span>
        </div>

        {/* Divider */}
        <span className="text-[color:var(--border)]">•</span>

        {/* Confirmations */}
        {counts.confirmations > 0 && (
          <>
            <div
              className="flex items-center gap-1 text-[color:var(--accent-primary)]"
              title="Confirmations"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>{counts.confirmations}</span>
            </div>
          </>
        )}

        {/* Disputes */}
        {counts.disputes > 0 && (
          <>
            <div
              className="flex items-center gap-1 text-[color:var(--accent-warning)]"
              title="Disputes"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span>{counts.disputes}</span>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
      {/* Upvotes */}
      <div
        className="flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-[color:var(--text-secondary)]"
        title="Upvotes"
      >
        <svg
          className="h-3.5 w-3.5"
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
        <span>{counts.upvotes}</span>
      </div>

      {/* Downvotes */}
      <div
        className="flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-[color:var(--text-secondary)]"
        title="Downvotes"
      >
        <svg
          className="h-3.5 w-3.5"
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
        <span>{counts.downvotes}</span>
      </div>

      {/* Confirmations */}
      {counts.confirmations > 0 && (
        <div
          className="flex items-center gap-1 rounded-full border border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)]/10 px-3 py-1 text-[color:var(--accent-primary)]"
          title="Confirmed"
        >
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>Confirmed: {counts.confirmations}</span>
        </div>
      )}

      {/* Disputes */}
      {counts.disputes > 0 && (
        <div
          className="flex items-center gap-1 rounded-full border border-[color:var(--accent-warning)] bg-[color:var(--accent-warning)]/10 px-3 py-1 text-[color:var(--accent-warning)]"
          title="Disputed"
        >
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <span>Disputed: {counts.disputes}</span>
        </div>
      )}

      {/* Net Score Display */}
      <div
        className={`rounded-full px-3 py-1 text-xs font-bold ${
          netScore > 0
            ? "bg-[color:var(--accent-success)]/10 text-[color:var(--accent-success)]"
            : netScore < 0
              ? "bg-[color:var(--accent-danger)]/10 text-[color:var(--accent-danger)]"
              : "bg-[color:var(--surface)] text-[color:var(--text-secondary)]"
        }`}
        title="Net score"
      >
        Score: {netScore > 0 ? "+" : ""}
        {netScore}
      </div>
    </div>
  );
}
