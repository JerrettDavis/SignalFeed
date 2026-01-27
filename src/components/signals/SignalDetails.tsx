"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type {
  Signal,
  SignalConditions,
  TriggerType,
} from "@/domain/signals/signal";
import { describeConditions } from "@/domain/signals/signal";
import type { LatLng } from "@/domain/geo/geo";
import type { Sighting } from "@/domain/sightings/sighting";
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

interface SignalDetailsProps {
  signalId: string;
  userId?: string;
  onClose?: () => void;
  className?: string;
}

type Geofence = {
  id: string;
  name: string;
  polygon: { points: LatLng[] };
  visibility: string;
};

export function SignalDetails({
  signalId,
  userId,
  onClose,
  className = "",
}: SignalDetailsProps) {
  const [signal, setSignal] = useState<Signal | null>(null);
  const [geofence, setGeofence] = useState<Geofence | null>(null);
  const [recentSightings, setRecentSightings] = useState<Sighting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTriggers, setEditTriggers] = useState<TriggerType[]>([]);
  const [editConditions, setEditConditions] = useState<SignalConditions>({});
  const [editIsActive, setEditIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch signal details
  useEffect(() => {
    const fetchSignal = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch signal
        const signalResponse = await fetch(`/api/signals/${signalId}`);
        if (!signalResponse.ok) {
          throw new Error("Failed to fetch signal");
        }
        const signalData = await signalResponse.json();
        const fetchedSignal = signalData.data;
        setSignal(fetchedSignal);

        // Initialize edit form
        setEditName(fetchedSignal.name);
        setEditDescription(fetchedSignal.description || "");
        setEditTriggers(fetchedSignal.triggers);
        setEditConditions(fetchedSignal.conditions);
        setEditIsActive(fetchedSignal.isActive);

        // Fetch geofence if applicable
        if (fetchedSignal.target.kind === "geofence") {
          const geofenceResponse = await fetch(
            `/api/geofences/${fetchedSignal.target.geofenceId}`
          );
          if (geofenceResponse.ok) {
            const geofenceData = await geofenceResponse.json();
            setGeofence(geofenceData.data);
          }
        }

        // Fetch recent triggered sightings
        const sightingsResponse = await fetch(
          `/api/signals/${signalId}/triggered-sightings?limit=10`
        );
        if (sightingsResponse.ok) {
          const sightingsData = await sightingsResponse.json();
          setRecentSightings(sightingsData.data || []);
        }

        // Fetch subscription status
        if (userId) {
          const subResponse = await fetch(
            `/api/signals/${signalId}/subscribers/${userId}`
          );
          if (subResponse.ok) {
            const subData = await subResponse.json();
            setIsSubscribed(subData.isSubscribed || false);
          }
        }

        // Fetch subscriber count
        const countResponse = await fetch(
          `/api/signals/${signalId}/subscribers/count`
        );
        if (countResponse.ok) {
          const countData = await countResponse.json();
          setSubscriberCount(countData.count || 0);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch signal details"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignal();
  }, [signalId, userId]);

  const handleSave = async () => {
    if (!signal) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/signals/${signalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          description: editDescription || undefined,
          triggers: editTriggers,
          conditions: editConditions,
          isActive: editIsActive,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update signal");
      }

      const data = await response.json();
      setSignal(data.data);
      setIsEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update signal");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (!signal) return;
    setEditName(signal.name);
    setEditDescription(signal.description || "");
    setEditTriggers(signal.triggers);
    setEditConditions(signal.conditions);
    setEditIsActive(signal.isActive);
    setIsEditMode(false);
    setError(null);
  };

  const handleToggleSubscription = async () => {
    if (!userId) return;

    try {
      if (isSubscribed) {
        const response = await fetch(`/api/signals/${signalId}/subscribe`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) throw new Error("Failed to unsubscribe");

        setIsSubscribed(false);
        setSubscriberCount((prev) => Math.max(0, prev - 1));
      } else {
        const response = await fetch(`/api/signals/${signalId}/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) throw new Error("Failed to subscribe");

        setIsSubscribed(true);
        setSubscriberCount((prev) => prev + 1);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Operation failed");
    }
  };

  const handleTriggerToggle = (trigger: TriggerType) => {
    setEditTriggers((prev) =>
      prev.includes(trigger)
        ? prev.filter((t) => t !== trigger)
        : [...prev, trigger]
    );
  };

  if (isLoading) {
    return (
      <div
        className={`rounded-2xl border border-white/70 bg-white/80 p-8 text-center shadow-sm ${className}`}
      >
        <div className="text-sm text-[color:var(--text-secondary)]">
          Loading signal details...
        </div>
      </div>
    );
  }

  if (error && !signal) {
    return (
      <div
        className={`rounded-2xl border border-[color:var(--accent-danger)] bg-[color:var(--accent-danger)]/10 p-8 text-center ${className}`}
      >
        <div className="mb-2 text-lg font-semibold text-[color:var(--accent-danger)]">
          Error Loading Signal
        </div>
        <div className="text-sm text-[color:var(--accent-danger)]">{error}</div>
      </div>
    );
  }

  if (!signal) return null;

  const isOwner = userId && signal.ownerId === userId;
  const mapPolygon =
    signal.target.kind === "polygon"
      ? signal.target.polygon.points
      : geofence?.polygon.points || [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            {isEditMode ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-xl font-semibold text-[color:var(--text-primary)] focus:border-[color:var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]/20"
              />
            ) : (
              <h1 className="font-[family:var(--font-display)] text-2xl font-semibold text-[color:var(--ink)]">
                {signal.name}
              </h1>
            )}
          </div>
          <div className="ml-4 flex items-center gap-2">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                isEditMode
                  ? editIsActive
                  : signal.isActive
                    ? "bg-[color:var(--accent-success)]/10"
                    : "bg-[color:var(--text-tertiary)]/10"
              }`}
            >
              <div
                className={`h-3 w-3 rounded-full ${
                  isEditMode
                    ? editIsActive
                    : signal.isActive
                      ? "bg-[color:var(--accent-success)]"
                      : "bg-[color:var(--text-tertiary)]"
                }`}
              />
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-2 text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-elevated)]"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
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
              </button>
            )}
          </div>
        </div>

        {isEditMode ? (
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={3}
            placeholder="Optional description..."
            className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-primary)] focus:border-[color:var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]/20"
          />
        ) : (
          signal.description && (
            <p className="text-sm text-[color:var(--charcoal)]">
              {signal.description}
            </p>
          )
        )}

        <div className="mt-4 flex items-center gap-4 text-sm text-[color:var(--text-secondary)]">
          <div className="flex items-center gap-2">
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
            <span>{subscriberCount} subscribers</span>
          </div>
          <span>•</span>
          <span>Created {new Date(signal.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Map */}
      {mapPolygon.length > 0 && (
        <div className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-[color:var(--text-primary)]">
            Geographic Target
          </h2>
          <GeofenceMap
            geofences={geofence ? [geofence] : []}
            onMapClick={() => {}}
            draftPoints={
              signal.target.kind === "polygon"
                ? signal.target.polygon.points
                : []
            }
          />
        </div>
      )}

      {/* Triggers */}
      <div className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-[color:var(--text-primary)]">
          Trigger Events
        </h2>
        {isEditMode ? (
          <div className="space-y-2">
            {(
              [
                { type: "new_sighting", label: "New Sighting" },
                { type: "sighting_confirmed", label: "Sighting Confirmed" },
                { type: "sighting_disputed", label: "Sighting Disputed" },
                { type: "score_threshold", label: "Score Threshold" },
              ] as const
            ).map((trigger) => (
              <label
                key={trigger.type}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-3 transition hover:bg-[color:var(--surface-elevated)]"
              >
                <input
                  type="checkbox"
                  checked={editTriggers.includes(trigger.type)}
                  onChange={() => handleTriggerToggle(trigger.type)}
                  className="h-4 w-4 rounded border-[color:var(--border)] text-[color:var(--accent-primary)] focus:ring-2 focus:ring-[color:var(--accent-primary)]/20"
                />
                <span className="text-sm font-medium text-[color:var(--text-primary)]">
                  {trigger.label}
                </span>
              </label>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {signal.triggers.map((trigger) => (
              <span
                key={trigger}
                className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1.5 text-sm font-medium text-[color:var(--text-primary)]"
              >
                {trigger.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Conditions */}
      <div className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-[color:var(--text-primary)]">
          Filter Conditions
        </h2>
        {isEditMode ? (
          <ConditionBuilder
            conditions={editConditions}
            onChange={setEditConditions}
          />
        ) : (
          <div className="text-sm text-[color:var(--charcoal)]">
            {describeConditions(signal.conditions)}
          </div>
        )}
      </div>

      {/* Recent Triggered Sightings */}
      <div className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-[color:var(--text-primary)]">
          Recent Triggered Sightings
        </h2>
        {recentSightings.length === 0 ? (
          <p className="text-sm text-[color:var(--text-secondary)]">
            No sightings have triggered this signal yet.
          </p>
        ) : (
          <div className="space-y-2">
            {recentSightings.map((sighting) => (
              <div
                key={sighting.id}
                className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-3 transition hover:bg-[color:var(--surface-elevated)]"
              >
                <div className="text-sm font-medium text-[color:var(--text-primary)]">
                  {sighting.description}
                </div>
                <div className="mt-1 text-xs text-[color:var(--text-secondary)]">
                  {new Date(sighting.observedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-[color:var(--accent-danger)] bg-[color:var(--accent-danger)]/10 p-3 text-sm text-[color:var(--accent-danger)]">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-sm">
        {isEditMode ? (
          <>
            <label className="mb-4 flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={editIsActive}
                onChange={(e) => setEditIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-[color:var(--border)] text-[color:var(--accent-primary)] focus:ring-2 focus:ring-[color:var(--accent-primary)]/20"
              />
              <span className="text-sm font-medium text-[color:var(--text-primary)]">
                Active Signal
              </span>
            </label>
            <div className="flex gap-3">
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="flex-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm font-medium text-[color:var(--text-secondary)] transition hover:bg-[color:var(--surface-elevated)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 rounded-lg border border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[color:var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </>
        ) : (
          <div className="flex gap-3">
            {isOwner && (
              <button
                onClick={() => setIsEditMode(true)}
                className="flex-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm font-medium text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-elevated)]"
              >
                Edit Signal
              </button>
            )}
            {userId && (
              <button
                onClick={handleToggleSubscription}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  isSubscribed
                    ? "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-elevated)]"
                    : "border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)] text-white hover:bg-[color:var(--accent-hover)]"
                }`}
              >
                {isSubscribed ? "Unsubscribe" : "Subscribe"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
