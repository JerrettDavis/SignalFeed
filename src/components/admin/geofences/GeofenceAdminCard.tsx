"use client";

import React from "react";
import { AdminCard } from "@/components/admin/core/AdminCard";
import { Edit, Trash2, MapPin } from "lucide-react";

interface Geofence {
  id: string;
  name: string;
  visibility: string;
  polygon: { points: Array<{ lat: number; lng: number }> };
  createdAt: string;
  ownerId?: string;
}

export interface GeofenceAdminCardProps {
  geofence: Geofence;
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  onEdit?: (geofence: Geofence) => void;
  onDelete?: (id: string) => void;
  onVisualEdit?: (geofence: Geofence) => void;
}

export const GeofenceAdminCard = ({
  geofence,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
  onVisualEdit,
}: GeofenceAdminCardProps) => {
  const visibilityStyles = {
    public: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    private: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  };

  const visibilityStyle =
    visibilityStyles[geofence.visibility as keyof typeof visibilityStyles] ||
    visibilityStyles.private;

  return (
    <AdminCard selected={selected} className="flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="font-[family:var(--font-display)] text-xl font-semibold text-[color:var(--text-primary)] truncate">
              {geofence.name}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${visibilityStyle}`}
            >
              {geofence.visibility}
            </span>
          </div>
        </div>

        {/* Selection Checkbox */}
        {onSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(geofence.id, e.target.checked);
            }}
            className="h-4 w-4 rounded border-[color:var(--border)] mt-1"
          />
        )}
      </div>

      {/* Map Preview Placeholder */}
      <div className="mb-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 flex items-center justify-center">
        <div className="text-center text-sm text-[color:var(--text-tertiary)]">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <div className="text-xs">{geofence.polygon.points.length} points</div>
        </div>
      </div>

      {/* Metadata */}
      <div
        className="mb-3 text-xs text-[color:var(--text-tertiary)] space-y-1"
        suppressHydrationWarning
      >
        <div>Created: {new Date(geofence.createdAt).toLocaleDateString()}</div>
        {geofence.ownerId && <div>Owner ID: {geofence.ownerId}</div>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-[color:var(--border)] mt-auto">
        {onVisualEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onVisualEdit(geofence);
            }}
            className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg text-[color:var(--accent-success)] hover:bg-[color:var(--accent-success)]/10 transition flex items-center justify-center gap-1.5"
          >
            <MapPin size={14} />
            Edit Shape
          </button>
        )}

        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(geofence);
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
              onDelete(geofence.id);
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-lg text-[color:var(--accent-danger)] hover:bg-[color:var(--accent-danger)]/10 transition flex items-center gap-1.5"
          >
            <Trash2 size={14} />
            Delete
          </button>
        )}
      </div>
    </AdminCard>
  );
};
