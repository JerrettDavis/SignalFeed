"use client";

import { useState } from "react";
import type { Signal } from "@/domain/signals/signal";
import { describeConditions } from "@/domain/signals/signal";

interface SignalCardProps {
  signal: Signal;
  userId?: string;
  subscriberCount?: number;
  isSubscribed?: boolean;
  onEdit?: (signalId: string) => void;
  onDelete?: (signalId: string) => void;
  onSubscribe?: (signalId: string) => void;
  onUnsubscribe?: (signalId: string) => void;
  className?: string;
}

export function SignalCard({
  signal,
  userId,
  subscriberCount = 0,
  isSubscribed = false,
  onEdit,
  onDelete,
  onSubscribe,
  onUnsubscribe,
  className = "",
}: SignalCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const isOwner = userId && signal.ownerId === userId;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this signal?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete?.(signal.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleSubscription = async () => {
    setIsToggling(true);
    try {
      if (isSubscribed) {
        await onUnsubscribe?.(signal.id);
      } else {
        await onSubscribe?.(signal.id);
      }
    } finally {
      setIsToggling(false);
    }
  };

  const getTargetLabel = () => {
    switch (signal.target.kind) {
      case "geofence":
        return "Area-Specific";
      case "polygon":
        return "Custom Area";
      case "global":
        return "Global Coverage";
      default:
        return "Unknown";
    }
  };

  const getTargetStyles = () => {
    switch (signal.target.kind) {
      case "geofence":
        return {
          bg: "bg-green-50",
          text: "text-green-700",
          border: "border-green-200",
        };
      case "polygon":
        return {
          bg: "bg-purple-50",
          text: "text-purple-700",
          border: "border-purple-200",
        };
      case "global":
        return {
          bg: "bg-blue-50",
          text: "text-blue-700",
          border: "border-blue-200",
        };
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-700",
          border: "border-gray-200",
        };
    }
  };

  const isGlobal = signal.target.kind === "global";
  const isGeofenced = signal.target.kind === "geofence";

  const getTriggerLabels = () => {
    const labels: Record<string, string> = {
      new_sighting: "New",
      sighting_confirmed: "Confirmed",
      sighting_disputed: "Disputed",
      score_threshold: "Score",
    };
    return signal.triggers.map((t) => labels[t] || t);
  };

  const cardBorderStyle = () => {
    if (!signal.isActive) return "border-[color:var(--border)] opacity-60";

    switch (signal.target.kind) {
      case "global":
        return "border-blue-200 hover:border-blue-300";
      case "geofence":
        return "border-green-200 hover:border-green-300";
      case "polygon":
        return "border-purple-200 hover:border-purple-300";
      default:
        return "border-white/70";
    }
  };

  return (
    <div
      className={`rounded-2xl border bg-white/80 shadow-sm transition hover:shadow-md ${cardBorderStyle()} ${className}`}
    >
      <div className="p-5">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h3 className="font-[family:var(--font-display)] text-xl font-semibold text-[color:var(--ink)]">
                {signal.name}
              </h3>
              {!signal.isActive && (
                <span className="rounded-full bg-[color:var(--text-tertiary)]/20 px-2 py-0.5 text-xs font-semibold text-[color:var(--text-tertiary)]">
                  Inactive
                </span>
              )}
            </div>
            {signal.description && (
              <p className="text-sm text-[color:var(--charcoal)]">
                {signal.description}
              </p>
            )}
          </div>

          {/* Status Indicator */}
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              signal.isActive
                ? "bg-[color:var(--accent-success)]/10"
                : "bg-[color:var(--text-tertiary)]/10"
            }`}
          >
            <div
              className={`h-3 w-3 rounded-full ${
                signal.isActive
                  ? "bg-[color:var(--accent-success)]"
                  : "bg-[color:var(--text-tertiary)]"
              }`}
            />
          </div>
        </div>

        {/* Target and Triggers */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span
            className={`rounded-full border px-3 py-1.5 ${getTargetStyles().bg} ${getTargetStyles().text} ${getTargetStyles().border}`}
          >
            {isGlobal ? (
              // Globe icon for global signals
              <svg
                className="mr-1.5 inline-block h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : isGeofenced ? (
              // Location pin for geofenced signals
              <svg
                className="mr-1.5 inline-block h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            ) : (
              // Default polygon icon
              <svg
                className="mr-1.5 inline-block h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            )}
            {getTargetLabel()}
          </span>

          {getTriggerLabels().map((label) => (
            <span
              key={label}
              className="rounded-full bg-white/60 px-3 py-1 text-[color:var(--slate)]"
            >
              <svg
                className="mr-1 inline-block h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {label}
            </span>
          ))}
        </div>

        {/* Conditions Summary */}
        {Object.keys(signal.conditions).length > 0 && (
          <div className="mb-4 rounded-lg bg-white/60 p-3">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--slate)]">
              Conditions
            </div>
            <div className="text-sm text-[color:var(--charcoal)]">
              {describeConditions(signal.conditions)}
            </div>
          </div>
        )}

        {/* Subscriber Count */}
        <div className="mb-4 flex items-center gap-2 text-sm text-[color:var(--text-secondary)]">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span>
            {subscriberCount}{" "}
            {subscriberCount === 1 ? "subscriber" : "subscribers"}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {isOwner ? (
            <>
              {onEdit && (
                <button
                  onClick={() => onEdit(signal.id)}
                  className="flex-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm font-medium text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-elevated)]"
                >
                  <svg
                    className="mr-1 inline-block h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 rounded-lg border border-[color:var(--accent-danger)] bg-[color:var(--accent-danger)]/10 px-3 py-2 text-sm font-medium text-[color:var(--accent-danger)] transition hover:bg-[color:var(--accent-danger)]/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <svg
                    className="mr-1 inline-block h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              )}
            </>
          ) : (
            <>
              {(onSubscribe || onUnsubscribe) && (
                <button
                  onClick={handleToggleSubscription}
                  disabled={isToggling}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    isSubscribed
                      ? "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-elevated)]"
                      : "border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)] text-white hover:bg-[color:var(--accent-hover)]"
                  }`}
                >
                  {isToggling ? (
                    "..."
                  ) : isSubscribed ? (
                    <>
                      <svg
                        className="mr-1 inline-block h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                      Subscribed
                    </>
                  ) : (
                    <>
                      <svg
                        className="mr-1 inline-block h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                      Subscribe
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer Metadata */}
      <div
        className="border-t border-white/50 bg-white/40 px-5 py-3 text-xs text-[color:var(--text-tertiary)]"
        suppressHydrationWarning
      >
        Created {new Date(signal.createdAt).toLocaleDateString()}
        {signal.updatedAt !== signal.createdAt && (
          <span suppressHydrationWarning>
            {" "}
            • Updated {new Date(signal.updatedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
