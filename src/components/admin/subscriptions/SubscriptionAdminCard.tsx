"use client";

import React from "react";
import { AdminCard } from "@/components/admin/core/AdminCard";
import { Mail, MapPin, Calendar, Trash2 } from "lucide-react";

type SubscriptionTarget =
  | { kind: "geofence"; geofenceId: string }
  | {
      kind: "polygon";
      polygon: { points: Array<{ lat: number; lng: number }> };
    };

interface Subscription {
  id: string;
  email: string;
  target: SubscriptionTarget;
  trustLevel: string;
  createdAt: string;
}

export interface SubscriptionAdminCardProps {
  subscription: Subscription;
  geofenceName?: string | null;
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  onDelete?: (id: string) => void;
}

export const SubscriptionAdminCard = ({
  subscription,
  geofenceName,
  selected = false,
  onSelect,
  onDelete,
}: SubscriptionAdminCardProps) => {
  const trustLevelStyles = {
    high: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    medium:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    low: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    raw: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    vetted: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    all: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  };

  const targetDisplay = () => {
    if (subscription.target.kind === "geofence") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200">
          <MapPin size={12} />
          {geofenceName || subscription.target.geofenceId}
        </span>
      );
    }
    if (
      subscription.target.kind === "polygon" &&
      subscription.target.polygon?.points
    ) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-xs font-medium border border-purple-200">
          <MapPin size={12} />
          Custom Polygon ({subscription.target.polygon.points.length} points)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 text-gray-700 text-xs font-medium border border-gray-200">
        <MapPin size={12} />
        Unknown Target
      </span>
    );
  };

  return (
    <AdminCard selected={selected} className="flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Mail size={16} className="text-[color:var(--text-secondary)]" />
            <h3 className="font-[family:var(--font-display)] text-lg font-semibold text-[color:var(--text-primary)] truncate">
              {subscription.email}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {targetDisplay()}
          </div>
        </div>

        {/* Selection Checkbox */}
        {onSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(subscription.id, e.target.checked);
            }}
            className="h-4 w-4 rounded border-[color:var(--border)] mt-1"
          />
        )}
      </div>

      {/* Trust Level Badge */}
      <div className="mb-3">
        <div className="text-xs uppercase tracking-wider text-[color:var(--text-tertiary)] mb-1.5">
          Trust Level:
        </div>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            trustLevelStyles[
              subscription.trustLevel as keyof typeof trustLevelStyles
            ] || trustLevelStyles.low
          }`}
        >
          {subscription.trustLevel}
        </span>
      </div>

      {/* Created Date */}
      <div className="flex items-center gap-2 mb-3 text-xs text-[color:var(--text-tertiary)]">
        <Calendar size={14} />
        Created: {new Date(subscription.createdAt).toLocaleDateString()}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-[color:var(--border)] mt-auto">
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(subscription.id);
            }}
            className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg text-[color:var(--accent-danger)] hover:bg-[color:var(--accent-danger)]/10 transition flex items-center justify-center gap-1.5"
          >
            <Trash2 size={14} />
            Delete
          </button>
        )}
      </div>
    </AdminCard>
  );
};
