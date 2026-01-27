"use client";

import { useState, useEffect } from "react";
import type { SightingReactionType } from "@/domain/sightings/sighting-reaction";

interface ReactionButtonsProps {
  sightingId: string;
  userId?: string;
  initialUpvotes?: number;
  initialDownvotes?: number;
  initialConfirmations?: number;
  initialDisputes?: number;
  onReactionChange?: () => void;
}

interface ReactionCounts {
  upvotes: number;
  downvotes: number;
  confirmations: number;
  disputes: number;
  spamReports: number;
}

interface UserReaction {
  type: SightingReactionType;
}

export function ReactionButtons({
  sightingId,
  userId,
  initialUpvotes = 0,
  initialDownvotes = 0,
  initialConfirmations = 0,
  initialDisputes = 0,
  onReactionChange,
}: ReactionButtonsProps) {
  const [counts, setCounts] = useState<ReactionCounts>({
    upvotes: initialUpvotes,
    downvotes: initialDownvotes,
    confirmations: initialConfirmations,
    disputes: initialDisputes,
    spamReports: 0,
  });
  const [userReaction, setUserReaction] = useState<UserReaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch reaction counts
  useEffect(() => {
    const fetchReactions = async () => {
      try {
        const response = await fetch(`/api/sightings/${sightingId}/reactions`);
        if (response.ok) {
          const data = await response.json();
          setCounts(data);
        }
      } catch (err) {
        console.error("Failed to fetch reactions:", err);
      }
    };

    // Fetch user's reaction if userId is provided
    const fetchUserReaction = async () => {
      if (!userId) return;
      try {
        const response = await fetch(
          `/api/sightings/${sightingId}/reactions/user/${userId}`
        );
        if (response.ok) {
          const data = await response.json();
          setUserReaction(data);
        }
      } catch (err) {
        console.error("Failed to fetch user reaction:", err);
      }
    };

    fetchReactions();
    fetchUserReaction();
  }, [sightingId, userId]);

  const handleReaction = async (type: SightingReactionType) => {
    if (!userId) {
      setError("You must be logged in to react");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // If user already has this reaction, remove it
      if (userReaction?.type === type) {
        const response = await fetch(`/api/sightings/${sightingId}/reactions`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, type }),
        });

        if (!response.ok) {
          throw new Error("Failed to remove reaction");
        }

        setUserReaction(null);
      } else {
        // Add or update reaction
        const response = await fetch(`/api/sightings/${sightingId}/reactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, type }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to add reaction");
        }

        setUserReaction({ type });
      }

      // Refresh counts
      const countsResponse = await fetch(
        `/api/sightings/${sightingId}/reactions`
      );
      if (countsResponse.ok) {
        const data = await countsResponse.json();
        setCounts(data);
      }

      onReactionChange?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update reaction"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isActive = (type: SightingReactionType) => userReaction?.type === type;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Upvote Button */}
        <button
          onClick={() => handleReaction("upvote")}
          disabled={isLoading || !userId}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            isActive("upvote")
              ? "border-[color:var(--accent-success)] bg-[color:var(--accent-success)]/10 text-[color:var(--accent-success)]"
              : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-elevated)] hover:text-[color:var(--text-primary)]"
          } disabled:cursor-not-allowed disabled:opacity-50`}
          title="Upvote"
        >
          <svg
            className="h-4 w-4"
            fill={isActive("upvote") ? "currentColor" : "none"}
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
        </button>

        {/* Downvote Button */}
        <button
          onClick={() => handleReaction("downvote")}
          disabled={isLoading || !userId}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            isActive("downvote")
              ? "border-[color:var(--accent-danger)] bg-[color:var(--accent-danger)]/10 text-[color:var(--accent-danger)]"
              : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-elevated)] hover:text-[color:var(--text-primary)]"
          } disabled:cursor-not-allowed disabled:opacity-50`}
          title="Downvote"
        >
          <svg
            className="h-4 w-4"
            fill={isActive("downvote") ? "currentColor" : "none"}
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
        </button>

        {/* Confirmed Button */}
        <button
          onClick={() => handleReaction("confirmed")}
          disabled={isLoading || !userId}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            isActive("confirmed")
              ? "border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)]/10 text-[color:var(--accent-primary)]"
              : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-elevated)] hover:text-[color:var(--text-primary)]"
          } disabled:cursor-not-allowed disabled:opacity-50`}
          title="Confirm this sighting"
        >
          <svg
            className="h-4 w-4"
            fill={isActive("confirmed") ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>Confirmed {counts.confirmations}</span>
        </button>

        {/* Disputed Button */}
        <button
          onClick={() => handleReaction("disputed")}
          disabled={isLoading || !userId}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            isActive("disputed")
              ? "border-[color:var(--accent-warning)] bg-[color:var(--accent-warning)]/10 text-[color:var(--accent-warning)]"
              : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-elevated)] hover:text-[color:var(--text-primary)]"
          } disabled:cursor-not-allowed disabled:opacity-50`}
          title="Dispute this sighting"
        >
          <svg
            className="h-4 w-4"
            fill={isActive("disputed") ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <span>Disputed {counts.disputes}</span>
        </button>
      </div>

      {error && (
        <div className="text-xs font-medium text-[color:var(--accent-danger)]">
          {error}
        </div>
      )}

      {!userId && (
        <div className="text-xs text-[color:var(--text-tertiary)]">
          Log in to react to sightings
        </div>
      )}
    </div>
  );
}
