"use client";

import React from "react";
import { AdminCard } from "@/components/admin/core/AdminCard";
import { Edit, Trash2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  username?: string;
  role: "user" | "moderator" | "admin";
  status: "active" | "suspended" | "banned";
  createdAt: string;
  updatedAt: string;
}

export interface UserAdminCardProps {
  user: User;
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  onEdit?: (user: User) => void;
  onDelete?: (id: string) => void;
}

export const UserAdminCard = ({
  user,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
}: UserAdminCardProps) => {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-[color:var(--accent-danger)]/10 text-[color:var(--accent-danger)]";
      case "moderator":
        return "bg-[color:var(--accent-warning)]/10 text-[color:var(--accent-warning)]";
      default:
        return "bg-[color:var(--text-tertiary)]/10 text-[color:var(--text-tertiary)]";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-[color:var(--accent-success)]/10 text-[color:var(--accent-success)]";
      case "suspended":
        return "bg-[color:var(--accent-warning)]/10 text-[color:var(--accent-warning)]";
      case "banned":
        return "bg-[color:var(--accent-danger)]/10 text-[color:var(--accent-danger)]";
      default:
        return "bg-[color:var(--text-tertiary)]/10 text-[color:var(--text-tertiary)]";
    }
  };

  return (
    <AdminCard selected={selected} className="flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="font-[family:var(--font-display)] text-xl font-semibold text-[color:var(--text-primary)] truncate">
              {user.email}
            </h3>
          </div>
          {user.username && (
            <p className="text-sm text-[color:var(--text-secondary)] mb-2">
              @{user.username}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getRoleBadgeColor(
                user.role
              )}`}
            >
              {user.role}
            </span>
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeColor(
                user.status
              )}`}
            >
              {user.status}
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
              onSelect(user.id, e.target.checked);
            }}
            className="h-4 w-4 rounded border-[color:var(--border)] mt-1"
          />
        )}
      </div>

      {/* Registration Date */}
      <div className="mb-3">
        <div className="text-xs uppercase tracking-wider text-[color:var(--text-tertiary)] mb-1">
          Registered:
        </div>
        <div className="text-sm text-[color:var(--text-secondary)]">
          {new Date(user.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-[color:var(--border)] mt-auto">
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(user);
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
              onDelete(user.id);
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
