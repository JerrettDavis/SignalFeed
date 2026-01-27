"use client";

import { useState, useEffect } from "react";
import type { Signal } from "@/domain/signals/signal";
import { SignalCard } from "./SignalCard";

interface SignalListProps {
  userId: string;
  onEdit?: (signalId: string) => void;
  onDelete?: (signalId: string) => void;
  onSubscribe?: (signalId: string) => void;
  onUnsubscribe?: (signalId: string) => void;
  className?: string;
}

type SignalWithMetadata = Signal & {
  subscriberCount: number;
  isSubscribed: boolean;
};

export function SignalList({
  userId,
  onEdit,
  onDelete,
  onSubscribe,
  onUnsubscribe,
  className = "",
}: SignalListProps) {
  const [signals, setSignals] = useState<SignalWithMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"created" | "updated" | "subscribers">(
    "created"
  );

  // Fetch signals
  useEffect(() => {
    const fetchSignals = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/users/${userId}/signals`);
        if (!response.ok) {
          throw new Error("Failed to fetch signals");
        }

        const data = await response.json();
        setSignals(data.data || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch signals"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignals();
  }, [userId]);

  // Handle delete with local state update
  const handleDelete = async (signalId: string) => {
    try {
      const response = await fetch(`/api/signals/${signalId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete signal");
      }

      // Remove from local state
      setSignals((prev) => prev.filter((s) => s.id !== signalId));
      onDelete?.(signalId);
    } catch (err) {
      console.error("Failed to delete signal:", err);
      alert("Failed to delete signal. Please try again.");
    }
  };

  // Handle subscribe with local state update
  const handleSubscribe = async (signalId: string) => {
    try {
      const response = await fetch(`/api/signals/${signalId}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to subscribe");
      }

      // Update local state
      setSignals((prev) =>
        prev.map((s) =>
          s.id === signalId
            ? {
                ...s,
                isSubscribed: true,
                subscriberCount: s.subscriberCount + 1,
              }
            : s
        )
      );
      onSubscribe?.(signalId);
    } catch (err) {
      console.error("Failed to subscribe:", err);
      alert("Failed to subscribe. Please try again.");
    }
  };

  // Handle unsubscribe with local state update
  const handleUnsubscribe = async (signalId: string) => {
    try {
      const response = await fetch(`/api/signals/${signalId}/subscribe`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to unsubscribe");
      }

      // Update local state
      setSignals((prev) =>
        prev.map((s) =>
          s.id === signalId
            ? {
                ...s,
                isSubscribed: false,
                subscriberCount: Math.max(0, s.subscriberCount - 1),
              }
            : s
        )
      );
      onUnsubscribe?.(signalId);
    } catch (err) {
      console.error("Failed to unsubscribe:", err);
      alert("Failed to unsubscribe. Please try again.");
    }
  };

  // Filter signals
  const filteredSignals = signals.filter((signal) => {
    if (filter === "active") return signal.isActive;
    if (filter === "inactive") return !signal.isActive;
    return true;
  });

  // Sort signals
  const sortedSignals = [...filteredSignals].sort((a, b) => {
    switch (sortBy) {
      case "created":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "updated":
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      case "subscribers":
        return b.subscriberCount - a.subscriberCount;
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div
        className={`rounded-2xl border border-white/70 bg-white/80 p-8 text-center shadow-sm ${className}`}
      >
        <div className="text-sm text-[color:var(--text-secondary)]">
          Loading signals...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`rounded-2xl border border-[color:var(--accent-danger)] bg-[color:var(--accent-danger)]/10 p-8 text-center ${className}`}
      >
        <div className="mb-2 text-lg font-semibold text-[color:var(--accent-danger)]">
          Error Loading Signals
        </div>
        <div className="text-sm text-[color:var(--accent-danger)]">{error}</div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filters and Sorting */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              filter === "all"
                ? "border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)]/10 text-[color:var(--accent-primary)]"
                : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-elevated)]"
            }`}
          >
            All ({signals.length})
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              filter === "active"
                ? "border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)]/10 text-[color:var(--accent-primary)]"
                : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-elevated)]"
            }`}
          >
            Active ({signals.filter((s) => s.isActive).length})
          </button>
          <button
            onClick={() => setFilter("inactive")}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              filter === "inactive"
                ? "border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)]/10 text-[color:var(--accent-primary)]"
                : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-elevated)]"
            }`}
          >
            Inactive ({signals.filter((s) => !s.isActive).length})
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[color:var(--text-secondary)]">
            Sort by:
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1.5 text-xs font-medium text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-elevated)] focus:border-[color:var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]/20"
          >
            <option value="created">Created Date</option>
            <option value="updated">Updated Date</option>
            <option value="subscribers">Subscribers</option>
          </select>
        </div>
      </div>

      {/* Signal Cards */}
      {sortedSignals.length === 0 ? (
        <div className="rounded-2xl border border-white/70 bg-white/80 p-12 text-center shadow-sm">
          <svg
            className="mx-auto mb-4 h-16 w-16 text-[color:var(--text-tertiary)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <div className="mb-2 text-lg font-semibold text-[color:var(--text-primary)]">
            {filter === "all" ? "No signals yet" : `No ${filter} signals`}
          </div>
          <div className="text-sm text-[color:var(--text-secondary)]">
            {filter === "all"
              ? "Create your first signal to start monitoring sightings in your area."
              : `You don't have any ${filter} signals at the moment.`}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedSignals.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              userId={userId}
              subscriberCount={signal.subscriberCount}
              isSubscribed={signal.isSubscribed}
              onEdit={onEdit}
              onDelete={handleDelete}
              onSubscribe={handleSubscribe}
              onUnsubscribe={handleUnsubscribe}
            />
          ))}
        </div>
      )}
    </div>
  );
}
