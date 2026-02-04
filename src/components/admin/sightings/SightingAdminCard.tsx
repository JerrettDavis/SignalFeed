"use client";

import React from "react";
import { AdminCard } from "@/components/admin/core/AdminCard";
import { Calendar, Edit, Trash2 } from "lucide-react";

interface Sighting {
  id: string;
  description: string;
  status: string;
  importance: string;
  observedAt: string;
  categoryId: number;
  typeId: number;
}

export interface SightingAdminCardProps {
  sighting: Sighting;
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  onEdit?: (sighting: Sighting) => void;
  onDelete?: (id: string) => void;
}

export const SightingAdminCard = ({
  sighting,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
}: SightingAdminCardProps) => {
  const statusStyles = {
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    resolved: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    investigating:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  } as const;

  const importanceStyles = {
    critical:
      "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300",
    normal:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300",
    low: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-300",
  } as const;

  const truncateDescription = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  return (
    <AdminCard selected={selected} className="flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
                importanceStyles[
                  sighting.importance as keyof typeof importanceStyles
                ] || importanceStyles.normal
              }`}
            >
              {sighting.importance}
            </span>
            <span
              className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                statusStyles[sighting.status as keyof typeof statusStyles] ||
                statusStyles.active
              }`}
            >
              {sighting.status}
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
              onSelect(sighting.id, e.target.checked);
            }}
            className="h-4 w-4 rounded border-[color:var(--border)] mt-1"
          />
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-[color:var(--text-primary)] mb-3 line-clamp-3 min-h-[3.6rem]">
        {truncateDescription(sighting.description)}
      </p>

      {/* Metadata */}
      <div className="flex items-center gap-4 mb-3 text-xs text-[color:var(--text-tertiary)]">
        <div className="flex items-center gap-1.5">
          <Calendar size={14} />
          {new Date(sighting.observedAt).toLocaleDateString()}
        </div>
        <div>Type: {sighting.typeId}</div>
        <div>Category: {sighting.categoryId}</div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-[color:var(--border)] mt-auto">
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(sighting);
            }}
            className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg text-[color:var(--accent-primary)] hover:bg-[color:var(--accent-primary)]/10 transition flex items-center justify-center gap-1.5"
          >
            <Edit size={14} />
            Edit
          </button>
        )}

        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(sighting.id);
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
