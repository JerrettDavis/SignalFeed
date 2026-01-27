"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import type {
  SignalConditions,
  SignalTarget,
  TriggerType,
} from "@/domain/signals/signal";
import type { LatLng } from "@/domain/geo/geo";
import { ConditionBuilder } from "./ConditionBuilder";

const GeofenceMap = dynamic(
  () => import("@/components/map/geofence-map").then((mod) => mod.GeofenceMap),
  {
    ssr: false,
    loading: () => (
      <div className="relative h-[420px] w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[var(--shadow-sm)]" />
    ),
  }
);

interface SignalCreatorProps {
  userId: string;
  onSuccess?: (signalId: string) => void;
  onCancel?: () => void;
  className?: string;
}

type Geofence = {
  id: string;
  name: string;
  polygon: { points: LatLng[] };
  visibility: string;
};

export function SignalCreator({
  userId,
  onSuccess,
  onCancel,
  className = "",
}: SignalCreatorProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetType, setTargetType] = useState<
    "geofence" | "polygon" | "global"
  >("geofence");
  const [selectedGeofenceId, setSelectedGeofenceId] = useState("");
  const [polygonPoints, setPolygonPoints] = useState<LatLng[]>([]);
  const [triggers, setTriggers] = useState<TriggerType[]>(["new_sighting"]);
  const [conditions, setConditions] = useState<SignalConditions>({});
  const [isActive, setIsActive] = useState(true);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch geofences
  useEffect(() => {
    const fetchGeofences = async () => {
      try {
        const response = await fetch("/api/geofences");
        if (response.ok) {
          const data = await response.json();
          setGeofences(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch geofences:", err);
      }
    };

    fetchGeofences();
  }, []);

  const handleTriggerToggle = (trigger: TriggerType) => {
    setTriggers((prev) =>
      prev.includes(trigger)
        ? prev.filter((t) => t !== trigger)
        : [...prev, trigger]
    );
  };

  const handleMapClick = useCallback((point: LatLng) => {
    setPolygonPoints((prev) => [...prev, point]);
  }, []);

  const handleClearPolygon = () => {
    setPolygonPoints([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Build target
      let target: SignalTarget;
      if (targetType === "geofence") {
        if (!selectedGeofenceId) {
          throw new Error("Please select a geofence");
        }
        target = { kind: "geofence", geofenceId: selectedGeofenceId };
      } else if (targetType === "polygon") {
        if (polygonPoints.length < 3) {
          throw new Error("Polygon must have at least 3 points");
        }
        target = { kind: "polygon", polygon: { points: polygonPoints } };
      } else {
        target = { kind: "global" };
      }

      // Validate triggers
      if (triggers.length === 0) {
        throw new Error("Please select at least one trigger type");
      }

      // Create signal
      const response = await fetch("/api/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          ownerId: userId,
          target,
          triggers,
          conditions,
          isActive,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create signal");
      }

      const data = await response.json();
      onSuccess?.(data.data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create signal");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedGeofence = geofences.find((g) => g.id === selectedGeofenceId);

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Signal Name */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[color:var(--text-primary)]">
          Signal Name{" "}
          <span className="text-[color:var(--accent-danger)]">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          placeholder="e.g., Downtown Safety Alerts"
          className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-elevated)] focus:border-[color:var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]/20"
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[color:var(--text-primary)]">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Optional description of what this signal tracks..."
          className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-elevated)] focus:border-[color:var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]/20"
        />
      </div>

      {/* Target Type */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[color:var(--text-primary)]">
          Geographic Target{" "}
          <span className="text-[color:var(--accent-danger)]">*</span>
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTargetType("geofence")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              targetType === "geofence"
                ? "border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)]/10 text-[color:var(--accent-primary)]"
                : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-elevated)]"
            }`}
          >
            Geofence
          </button>
          <button
            type="button"
            onClick={() => setTargetType("polygon")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              targetType === "polygon"
                ? "border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)]/10 text-[color:var(--accent-primary)]"
                : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-elevated)]"
            }`}
          >
            Draw Polygon
          </button>
          <button
            type="button"
            onClick={() => setTargetType("global")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              targetType === "global"
                ? "border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)]/10 text-[color:var(--accent-primary)]"
                : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-elevated)]"
            }`}
          >
            Global
          </button>
        </div>
      </div>

      {/* Geofence Selector */}
      {targetType === "geofence" && (
        <div>
          <label className="mb-2 block text-sm font-medium text-[color:var(--text-primary)]">
            Select Geofence
          </label>
          <select
            value={selectedGeofenceId}
            onChange={(e) => setSelectedGeofenceId(e.target.value)}
            required
            className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-elevated)] focus:border-[color:var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]/20"
          >
            <option value="">Choose a geofence...</option>
            {geofences.map((geofence) => (
              <option key={geofence.id} value={geofence.id}>
                {geofence.name}
              </option>
            ))}
          </select>
          {selectedGeofence && (
            <div className="mt-3">
              <GeofenceMap
                geofences={[selectedGeofence]}
                onMapClick={() => {}}
                draftPoints={[]}
              />
            </div>
          )}
        </div>
      )}

      {/* Polygon Drawing */}
      {targetType === "polygon" && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-[color:var(--text-primary)]">
              Draw Polygon ({polygonPoints.length} points)
            </label>
            <button
              type="button"
              onClick={handleClearPolygon}
              className="text-xs font-medium text-[color:var(--accent-primary)] hover:text-[color:var(--accent-hover)]"
            >
              Clear
            </button>
          </div>
          <GeofenceMap
            geofences={[]}
            onMapClick={handleMapClick}
            draftPoints={polygonPoints}
          />
        </div>
      )}

      {/* Trigger Types */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[color:var(--text-primary)]">
          Trigger Events{" "}
          <span className="text-[color:var(--accent-danger)]">*</span>
        </label>
        <div className="space-y-2">
          {(
            [
              {
                type: "new_sighting",
                label: "New Sighting",
                description: "When a sighting is created",
              },
              {
                type: "sighting_confirmed",
                label: "Sighting Confirmed",
                description: "When a sighting is confirmed by others",
              },
              {
                type: "sighting_disputed",
                label: "Sighting Disputed",
                description: "When a sighting is disputed",
              },
              {
                type: "score_threshold",
                label: "Score Threshold",
                description: "When a sighting reaches a score threshold",
              },
            ] as const
          ).map((trigger) => (
            <label
              key={trigger.type}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-3 transition hover:bg-[color:var(--surface-elevated)]"
            >
              <input
                type="checkbox"
                checked={triggers.includes(trigger.type)}
                onChange={() => handleTriggerToggle(trigger.type)}
                className="mt-0.5 h-4 w-4 rounded border-[color:var(--border)] text-[color:var(--accent-primary)] focus:ring-2 focus:ring-[color:var(--accent-primary)]/20"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-[color:var(--text-primary)]">
                  {trigger.label}
                </div>
                <div className="text-xs text-[color:var(--text-secondary)]">
                  {trigger.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Conditions */}
      <div>
        <label className="mb-3 block text-sm font-medium text-[color:var(--text-primary)]">
          Filter Conditions
        </label>
        <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
          <ConditionBuilder conditions={conditions} onChange={setConditions} />
        </div>
      </div>

      {/* Active Toggle */}
      <div>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-[color:var(--border)] text-[color:var(--accent-primary)] focus:ring-2 focus:ring-[color:var(--accent-primary)]/20"
          />
          <div>
            <div className="text-sm font-medium text-[color:var(--text-primary)]">
              Active Signal
            </div>
            <div className="text-xs text-[color:var(--text-secondary)]">
              Signal will start monitoring immediately when created
            </div>
          </div>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-[color:var(--accent-danger)] bg-[color:var(--accent-danger)]/10 p-3 text-sm text-[color:var(--accent-danger)]">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm font-medium text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-elevated)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 rounded-lg border border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[color:var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Creating..." : "Create Signal"}
        </button>
      </div>
    </form>
  );
}
