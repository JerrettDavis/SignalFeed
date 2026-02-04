"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { GeofenceSelector } from "@/components/admin/selectors/GeofenceSelector";
import { TypePillSelector } from "@/components/admin/selectors/TypePillSelector";

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
    polygon?: unknown;
  };
  conditions?: {
    typeIds?: string[];
    categoryIds?: string[];
    tags?: string[];
    importance?: string[];
    minTrustLevel?: string;
    minScore?: number;
    maxScore?: number;
    operator?: "AND" | "OR";
  };
  createdAt: string;
  updatedAt: string;
}

export interface SignalEditModalProps {
  signal: Signal | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (signalId: string) => Promise<void>;
}

export const SignalEditModal = ({
  signal,
  isOpen,
  onClose,
  onSave,
}: SignalEditModalProps) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [classification, setClassification] =
    useState<Signal["classification"]>("personal");
  const [isActive, setIsActive] = useState(true);
  const [targetKind, setTargetKind] = useState<
    "global" | "geofence" | "polygon"
  >("global");
  const [geofenceId, setGeofenceId] = useState<string | null>(null);
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);

  // Initialize form when signal changes
  useEffect(() => {
    if (signal) {
      setName(signal.name);
      setDescription(signal.description || "");
      setClassification(signal.classification);
      setIsActive(signal.isActive);
      setTargetKind(signal.target.kind);
      setGeofenceId(signal.target.geofenceId || null);
      setSelectedTypeIds(signal.conditions?.typeIds || []);
      setError(null);
    }
  }, [signal]);

  const handleSave = async () => {
    if (!signal) return;

    try {
      setSaving(true);
      setError(null);

      // Build target based on kind
      let target: Signal["target"];
      if (targetKind === "global") {
        target = { kind: "global" };
      } else if (targetKind === "geofence" && geofenceId) {
        target = { kind: "geofence", geofenceId };
      } else if (targetKind === "polygon" && signal.target.polygon) {
        target = { kind: "polygon", polygon: signal.target.polygon };
      } else {
        target = signal.target; // Keep existing if invalid
      }

      // Build conditions
      const conditions = {
        ...signal.conditions,
        typeIds: selectedTypeIds.length > 0 ? selectedTypeIds : undefined,
      };

      const response = await fetch(`/api/admin/signals/${signal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          classification,
          isActive,
          target,
          conditions,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update signal");
      }

      await onSave(signal.id);
      onClose();
    } catch (err) {
      console.error("Error updating signal:", err);
      setError(err instanceof Error ? err.message : "Failed to update signal");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  if (!isOpen || !signal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[color:var(--surface)] rounded-xl shadow-[var(--shadow-lg)] m-4">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-[color:var(--border)] bg-[color:var(--surface)]">
          <h2 className="text-2xl font-[family:var(--font-display)] font-bold text-[color:var(--text-primary)]">
            Edit Signal: {signal.name}
          </h2>
          <button
            onClick={handleClose}
            disabled={saving}
            className="p-2 rounded-lg hover:bg-[color:var(--surface-elevated)] transition disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-[color:var(--accent-danger)] bg-[color:var(--accent-danger)]/10 p-4">
              <p className="text-sm text-[color:var(--accent-danger)]">
                {error}
              </p>
            </div>
          )}

          {/* Basic Info Section */}
          <div>
            <h3 className="text-lg font-semibold text-[color:var(--text-primary)] mb-3">
              Basic Information
            </h3>
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-[color:var(--text-primary)] mb-1.5">
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm text-[color:var(--text-primary)] focus:border-[color:var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--accent-primary)]"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[color:var(--text-primary)] mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm text-[color:var(--text-primary)] focus:border-[color:var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--accent-primary)]"
                />
              </div>

              {/* Classification */}
              <div>
                <label className="block text-sm font-medium text-[color:var(--text-primary)] mb-1.5">
                  Classification
                </label>
                <select
                  value={classification}
                  onChange={(e) =>
                    setClassification(
                      e.target.value as Signal["classification"]
                    )
                  }
                  className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm text-[color:var(--text-primary)] focus:border-[color:var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--accent-primary)]"
                >
                  <option value="personal">Personal</option>
                  <option value="verified">Verified</option>
                  <option value="community">Community</option>
                  <option value="official">Official</option>
                </select>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-[color:var(--border)]"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm text-[color:var(--text-primary)]"
                >
                  Signal is active
                </label>
              </div>
            </div>
          </div>

          {/* Target Section */}
          <div>
            <h3 className="text-lg font-semibold text-[color:var(--text-primary)] mb-3">
              Geographic Target
            </h3>
            <div className="space-y-4">
              {/* Target Type Radio Group */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="global"
                    checked={targetKind === "global"}
                    onChange={(e) => setTargetKind(e.target.value as "global")}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-[color:var(--text-primary)]">
                    Global
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="geofence"
                    checked={targetKind === "geofence"}
                    onChange={(e) =>
                      setTargetKind(e.target.value as "geofence")
                    }
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-[color:var(--text-primary)]">
                    Geofence
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="polygon"
                    checked={targetKind === "polygon"}
                    onChange={(e) => setTargetKind(e.target.value as "polygon")}
                    disabled
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-[color:var(--text-tertiary)]">
                    Custom Polygon (not editable)
                  </span>
                </label>
              </div>

              {/* Geofence Selector */}
              {targetKind === "geofence" && (
                <GeofenceSelector
                  value={geofenceId}
                  onChange={(id) => setGeofenceId(id)}
                  allowGlobal={false}
                />
              )}
            </div>
          </div>

          {/* Conditions Section */}
          <div>
            <h3 className="text-lg font-semibold text-[color:var(--text-primary)] mb-3">
              Monitoring Conditions
            </h3>
            <TypePillSelector
              selectedTypeIds={selectedTypeIds}
              onChange={setSelectedTypeIds}
              label="Sighting Types"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 p-6 border-t border-[color:var(--border)] bg-[color:var(--surface)]">
          <button
            onClick={handleClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-primary)] hover:bg-[color:var(--surface-elevated)] transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[color:var(--accent-primary)] text-white hover:bg-[color:var(--accent-primary)]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};
