"use client";

import { useState, useEffect } from "react";
import type { ReputationTier as ReputationTierType } from "@/domain/reputation/reputation";
import {
  getTierLabel,
  getTierDescription,
} from "@/domain/reputation/reputation";

interface ReputationTierProps {
  userId: string;
  showTooltip?: boolean;
  showProgress?: boolean;
}

interface UserReputationData {
  reputation: {
    userId: string;
    score: number;
    createdAt: string;
    updatedAt: string;
  };
  tier: ReputationTierType;
  events: Array<{
    id: string;
    userId: string;
    amount: number;
    reason: string;
    referenceId?: string;
    createdAt: string;
  }>;
}

const TIER_THRESHOLDS = {
  unverified: 0,
  new: 10,
  trusted: 50,
  verified: Infinity, // Manually granted
};

export function ReputationTier({
  userId,
  showTooltip = true,
  showProgress = false,
}: ReputationTierProps) {
  const [data, setData] = useState<UserReputationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTooltipState, setShowTooltipState] = useState(false);

  useEffect(() => {
    const fetchReputation = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/reputation/${userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch reputation");
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load reputation"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchReputation();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-10 w-10 animate-pulse rounded-full bg-[color:var(--surface)]" />
        <div className="flex flex-col gap-1">
          <div className="h-4 w-24 animate-pulse rounded bg-[color:var(--surface)]" />
          <div className="h-3 w-32 animate-pulse rounded bg-[color:var(--surface)]" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center gap-2 text-[color:var(--text-tertiary)]">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)]">
          <span className="text-lg">?</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium">Unknown</span>
          <span className="text-xs">Failed to load</span>
        </div>
      </div>
    );
  }

  const { tier, reputation } = data;
  const label = getTierLabel(tier);
  const description = getTierDescription(tier);
  const score = reputation.score;

  // Calculate progress to next tier
  let progressPercent = 0;
  let nextTierName = "";
  let pointsToNext = 0;

  if (tier === "unverified" && score < TIER_THRESHOLDS.new) {
    progressPercent = (score / TIER_THRESHOLDS.new) * 100;
    nextTierName = "New";
    pointsToNext = TIER_THRESHOLDS.new - score;
  } else if (tier === "new" && score < TIER_THRESHOLDS.trusted) {
    progressPercent =
      ((score - TIER_THRESHOLDS.new) /
        (TIER_THRESHOLDS.trusted - TIER_THRESHOLDS.new)) *
      100;
    nextTierName = "Trusted";
    pointsToNext = TIER_THRESHOLDS.trusted - score;
  }

  const tierIcons = {
    verified: (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    trusted: (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    new: (
      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    unverified: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  };

  const tierStyles = {
    verified: {
      bg: "bg-[color:var(--accent-primary)]",
      text: "text-white",
      ring: "ring-[color:var(--accent-primary)]/20",
    },
    trusted: {
      bg: "bg-[color:var(--accent-warning)]",
      text: "text-white",
      ring: "ring-[color:var(--accent-warning)]/20",
    },
    new: {
      bg: "bg-[color:var(--accent-success)]",
      text: "text-white",
      ring: "ring-[color:var(--accent-success)]/20",
    },
    unverified: {
      bg: "bg-[color:var(--surface)]",
      text: "text-[color:var(--text-secondary)]",
      ring: "ring-[color:var(--border)]",
    },
  };

  const style = tierStyles[tier];

  return (
    <div
      className="relative inline-flex items-center gap-3"
      onMouseEnter={() => showTooltip && setShowTooltipState(true)}
      onMouseLeave={() => showTooltip && setShowTooltipState(false)}
    >
      {/* Tier Icon */}
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full ring-4 ${style.bg} ${style.text} ${style.ring}`}
      >
        {tierIcons[tier]}
      </div>

      {/* Tier Info */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[color:var(--text-primary)]">
            {label}
          </span>
          <span className="text-xs font-medium text-[color:var(--text-secondary)]">
            {score} pts
          </span>
        </div>

        {/* Progress Bar */}
        {showProgress && tier !== "verified" && tier !== "trusted" && (
          <div className="mt-1 flex flex-col gap-0.5">
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-[color:var(--surface)]">
              <div
                className="h-full rounded-full bg-[color:var(--accent-primary)] transition-all duration-300"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
            <span className="text-xs text-[color:var(--text-tertiary)]">
              {pointsToNext} pts to {nextTierName}
            </span>
          </div>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && showTooltipState && (
        <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-3 shadow-[var(--shadow-lg)]">
          <div className="flex items-start gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${style.bg} ${style.text}`}
            >
              {tierIcons[tier]}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[color:var(--text-primary)]">
                {label}
              </p>
              <p className="mt-1 text-xs text-[color:var(--text-secondary)]">
                {description}
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs font-medium text-[color:var(--text-tertiary)]">
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
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                <span>{score} reputation points</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
