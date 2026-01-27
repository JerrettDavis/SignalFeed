"use client";

import { useState, useEffect } from "react";
import type { ReputationTier } from "@/domain/reputation/reputation";
import {
  getTierLabel,
  getTierDescription,
} from "@/domain/reputation/reputation";

interface ReputationBadgeProps {
  userId: string;
  showScore?: boolean;
  size?: "sm" | "md" | "lg";
}

interface UserReputationData {
  reputation: {
    userId: string;
    score: number;
    createdAt: string;
    updatedAt: string;
  };
  tier: ReputationTier;
  events: Array<{
    id: string;
    userId: string;
    amount: number;
    reason: string;
    referenceId?: string;
    createdAt: string;
  }>;
}

export function ReputationBadge({
  userId,
  showScore = false,
  size = "md",
}: ReputationBadgeProps) {
  const [data, setData] = useState<UserReputationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div
        className={`inline-flex animate-pulse rounded-full bg-[color:var(--surface)] ${
          size === "sm" ? "h-5 w-20" : size === "lg" ? "h-8 w-28" : "h-6 w-24"
        }`}
      />
    );
  }

  if (error || !data) {
    return (
      <div
        className={`inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2 text-[color:var(--text-tertiary)] ${
          size === "sm"
            ? "py-0.5 text-xs"
            : size === "lg"
              ? "py-1.5 text-sm"
              : "py-1 text-xs"
        }`}
        title="Failed to load reputation"
      >
        <span>?</span>
      </div>
    );
  }

  const { tier, reputation } = data;
  const label = getTierLabel(tier);
  const description = getTierDescription(tier);

  const tierStyles = {
    verified: {
      border: "border-[color:var(--accent-primary)]",
      bg: "bg-[color:var(--accent-primary)]/10",
      text: "text-[color:var(--accent-primary)]",
    },
    trusted: {
      border: "border-[color:var(--accent-warning)]",
      bg: "bg-[color:var(--accent-warning)]/10",
      text: "text-[color:var(--accent-warning)]",
    },
    new: {
      border: "border-[color:var(--accent-success)]",
      bg: "bg-[color:var(--accent-success)]/10",
      text: "text-[color:var(--accent-success)]",
    },
    unverified: {
      border: "border-[color:var(--border)]",
      bg: "bg-[color:var(--surface)]",
      text: "text-[color:var(--text-secondary)]",
    },
  };

  const style = tierStyles[tier];

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold transition hover:opacity-80 ${style.border} ${style.bg} ${style.text} ${sizeClasses[size]}`}
      title={`${description}${showScore ? ` - ${reputation.score} points` : ""}`}
    >
      <span>{label}</span>
      {showScore && (
        <>
          <span className="opacity-50">•</span>
          <span>{reputation.score}</span>
        </>
      )}
    </div>
  );
}
