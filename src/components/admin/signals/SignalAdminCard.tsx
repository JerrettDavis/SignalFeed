"use client";

import React from "react";
import { AdminCard } from "@/components/admin/core/AdminCard";
import { Eye, Target, Users, Edit, Trash2 } from "lucide-react";

interface Signal {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  classification: "official" | "community" | "personal" | "verified";
  isActive: boolean;
  target: {
    kind: "geofence" | "polygon" | "global";
    geofenceId?: string;
  };
  analytics: {
    viewCount: number;
    subscriberCount: number;
    sightingCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SignalAdminCardProps {
  signal: Signal;
  geofenceName?: string | null;
  typeLabels?: string[];
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  onEdit?: (signal: Signal) => void;
  onDelete?: (id: string) => void;
  onToggleActive?: (id: string, currentStatus: boolean) => void;
}

export const SignalAdminCard = ({
  signal,
  geofenceName,
  typeLabels = [],
  selected = false,
  onSelect,
  onEdit,
  onDelete,
  onToggleActive,
}: SignalAdminCardProps) => {
  const classificationStyles = {
    official:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    community: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    verified:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    personal: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  };

  const targetDisplay = () => {
    if (signal.target.kind === "global") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
          🌍 Global
        </span>
      );
    }
    if (signal.target.kind === "geofence") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200">
          📍 {geofenceName || "Geofence"}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-xs font-medium border border-purple-200">
        🗺️ Custom Polygon
      </span>
    );
  };

  return (
    <AdminCard selected={selected} className="flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="font-[family:var(--font-display)] text-xl font-semibold text-[color:var(--text-primary)] truncate">
              {signal.name}
            </h3>
            <div
              className={`w-2 h-2 rounded-full ${
                signal.isActive ? "bg-green-500" : "bg-gray-400"
              }`}
              title={signal.isActive ? "Active" : "Inactive"}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${classificationStyles[signal.classification]}`}
            >
              {signal.classification}
            </span>
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
              onSelect(signal.id, e.target.checked);
            }}
            className="h-4 w-4 rounded border-[color:var(--border)] mt-1"
          />
        )}
      </div>

      {/* Description */}
      {signal.description && (
        <p className="text-sm text-[color:var(--text-secondary)] mb-3 line-clamp-2">
          {signal.description}
        </p>
      )}

      {/* Sighting Types */}
      {typeLabels && typeLabels.length > 0 && (
        <div className="mb-3">
          <div className="text-xs uppercase tracking-wider text-[color:var(--text-tertiary)] mb-1.5">
            Monitoring Types:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {typeLabels.slice(0, 5).map((label, idx) => (
              <span
                key={idx}
                className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200"
              >
                {label}
              </span>
            ))}
            {typeLabels.length > 5 && (
              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                +{typeLabels.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Analytics */}
      <div className="flex items-center gap-4 mb-3 text-xs text-[color:var(--text-tertiary)]">
        <div className="flex items-center gap-1.5">
          <Eye size={14} />
          {signal.analytics.viewCount}
        </div>
        <div className="flex items-center gap-1.5">
          <Target size={14} />
          {signal.analytics.sightingCount}
        </div>
        <div className="flex items-center gap-1.5">
          <Users size={14} />
          {signal.analytics.subscriberCount}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-[color:var(--border)] mt-auto">
        {onToggleActive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleActive(signal.id, signal.isActive);
            }}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              signal.isActive
                ? "bg-green-100 text-green-800 hover:bg-green-200"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            {signal.isActive ? "Active" : "Inactive"}
          </button>
        )}

        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(signal);
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-lg text-[color:var(--accent-primary)] hover:bg-[color:var(--accent-primary)]/10 transition flex items-center gap-1.5"
          >
            <Edit size={14} />
            Edit
          </button>
        )}

        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(signal.id);
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-lg text-[color:var(--accent-danger)] hover:bg-[color:var(--accent-danger)]/10 transition flex items-center gap-1.5"
          >
            <Trash2 size={14} />
            Delete
          </button>
        )}
      </div>

      {/* Footer Metadata */}
      <div className="text-xs text-[color:var(--text-tertiary)] mt-3 pt-3 border-t border-[color:var(--border)]">
        <div>Created: {new Date(signal.createdAt).toLocaleDateString()}</div>
        <div>Updated: {new Date(signal.updatedAt).toLocaleDateString()}</div>
      </div>
    </AdminCard>
  );
};
