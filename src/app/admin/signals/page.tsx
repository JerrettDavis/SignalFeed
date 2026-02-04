"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ViewToggle } from "@/components/admin/core/ViewToggle";
import { useViewMode } from "@/components/admin/utils/useViewMode";
import { SignalAdminCard } from "@/components/admin/signals/SignalAdminCard";
import { SignalEditModal } from "@/components/admin/signals/SignalEditModal";

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
  conditions?: {
    typeIds?: string[];
    categoryIds?: string[];
  };
  analytics: {
    viewCount: number;
    subscriberCount: number;
    sightingCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface Geofence {
  id: string;
  name: string;
}

interface SightingType {
  id: string;
  label: string;
}

export default function AdminSignals() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [geofences, setGeofences] = useState<Map<string, string>>(new Map());
  const [sightingTypes, setSightingTypes] = useState<Map<string, string>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [classificationFilter, setClassificationFilter] =
    useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingSignal, setEditingSignal] = useState<Signal | null>(null);
  const [viewMode, setViewMode] = useViewMode("admin-signals-view");

  const fetchSignals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/signals");

      if (!response.ok) {
        throw new Error(`Failed to fetch signals: ${response.status}`);
      }

      const data = await response.json();
      setSignals(data.data || data);
    } catch (err) {
      console.error("Error fetching signals:", err);
      setError(err instanceof Error ? err.message : "Failed to load signals");
    } finally {
      setLoading(false);
    }
  };

  // Fetch geofences for name resolution
  useEffect(() => {
    const fetchGeofences = async () => {
      try {
        const response = await fetch("/api/geofences");
        if (!response.ok) return;

        const data = await response.json();
        const map = new Map<string, string>();
        (data.data || data).forEach((g: Geofence) => map.set(g.id, g.name));
        setGeofences(map);
      } catch (err) {
        console.error("Error fetching geofences:", err);
      }
    };

    void fetchGeofences();
  }, []);

  // Fetch sighting types for label resolution
  useEffect(() => {
    const fetchSightingTypes = async () => {
      try {
        const response = await fetch("/api/taxonomy/types");
        if (!response.ok) return;

        const data = await response.json();
        const map = new Map<string, string>();
        (data.data || data).forEach((t: SightingType) =>
          map.set(t.id, t.label)
        );
        setSightingTypes(map);
      } catch (err) {
        console.error("Error fetching sighting types:", err);
      }
    };

    void fetchSightingTypes();
  }, []);

  useEffect(() => {
    void fetchSignals();
  }, []);

  const filteredSignals = signals.filter((signal) => {
    const matchesSearch =
      signal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (signal.description &&
        signal.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesClassification =
      classificationFilter === "all" ||
      signal.classification === classificationFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && signal.isActive) ||
      (statusFilter === "inactive" && !signal.isActive);

    return matchesSearch && matchesClassification && matchesStatus;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredSignals.map((s) => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this signal? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/signals/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete signal");
      }

      await fetchSignals();
      setSelectedIds(new Set());
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete signal");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${selectedIds.size} signal(s)? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/admin/signals/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (!response.ok) {
        throw new Error("Failed to bulk delete signals");
      }

      await fetchSignals();
      setSelectedIds(new Set());
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to bulk delete signals"
      );
    }
  };

  const handleEdit = (signal: Signal) => {
    setEditingSignal(signal);
  };

  const handleSaveEdit = async (signalId: string) => {
    await fetchSignals();
    setSelectedIds(new Set());
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/signals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle signal status");
      }

      await fetchSignals();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to toggle signal status"
      );
    }
  };

  const handleChangeClassification = async (
    id: string,
    classification: Signal["classification"]
  ) => {
    try {
      const response = await fetch(`/api/admin/signals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classification }),
      });

      if (!response.ok) {
        throw new Error("Failed to change classification");
      }

      await fetchSignals();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to change classification"
      );
    }
  };

  const getClassificationBadge = (classification: Signal["classification"]) => {
    const styles = {
      official:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      community:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      verified:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      personal: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${styles[classification]}`}
      >
        {classification}
      </span>
    );
  };

  const getTargetLabel = (target: Signal["target"]) => {
    if (target.kind === "global") return "🌍 Global";
    if (target.kind === "geofence") return "📍 Geofence";
    return "🗺️ Polygon";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h2 className="text-2xl font-bold text-[color:var(--text-primary)]">
            Signal Moderation
          </h2>
          <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
            Manage and moderate all signals on the platform
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-2">
            {/* Search */}
            <input
              type="text"
              placeholder="Search signals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:border-[color:var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--accent-primary)]"
            />

            {/* Classification Filter */}
            <select
              value={classificationFilter}
              onChange={(e) => setClassificationFilter(e.target.value)}
              className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm text-[color:var(--text-primary)] focus:border-[color:var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--accent-primary)]"
            >
              <option value="all">All Classifications</option>
              <option value="official">Official</option>
              <option value="community">Community</option>
              <option value="verified">Verified</option>
              <option value="personal">Personal</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm text-[color:var(--text-primary)] focus:border-[color:var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--accent-primary)]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* View Toggle and Bulk Actions */}
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="rounded-lg bg-[color:var(--accent-danger)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--accent-danger)]/90 transition"
              >
                Delete Selected ({selectedIds.size})
              </button>
            )}
            <ViewToggle value={viewMode} onChange={setViewMode} />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[color:var(--accent-primary)] border-r-transparent"></div>
              <p className="mt-4 text-sm text-[color:var(--text-secondary)]">
                Loading signals...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="rounded-lg border border-[color:var(--accent-danger)] bg-[color:var(--accent-danger)]/10 p-4">
            <p className="text-sm text-[color:var(--accent-danger)]">{error}</p>
          </div>
        )}

        {/* Grid View */}
        {!loading && !error && viewMode === "grid" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSignals.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-sm text-[color:var(--text-secondary)]">
                  No signals found
                </p>
              </div>
            ) : (
              filteredSignals.map((signal) => (
                <SignalAdminCard
                  key={signal.id}
                  signal={signal}
                  geofenceName={
                    signal.target.kind === "geofence"
                      ? geofences.get(signal.target.geofenceId || "")
                      : null
                  }
                  typeLabels={signal.conditions?.typeIds?.map(
                    (id) => sightingTypes.get(id) || id
                  )}
                  selected={selectedIds.has(signal.id)}
                  onSelect={handleSelectOne}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                />
              ))
            )}
          </div>
        )}

        {/* Table View */}
        {!loading && !error && viewMode === "table" && (
          <div className="overflow-hidden rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[color:var(--border)] bg-[color:var(--surface-elevated)]">
                  <tr>
                    <th className="w-12 px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.size === filteredSignals.length &&
                          filteredSignals.length > 0
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-4 w-4 rounded border-[color:var(--border)]"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[color:var(--text-secondary)] uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[color:var(--text-secondary)] uppercase tracking-wider">
                      Classification
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[color:var(--text-secondary)] uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[color:var(--text-secondary)] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[color:var(--text-secondary)] uppercase tracking-wider">
                      Analytics
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[color:var(--text-secondary)] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--border)]">
                  {filteredSignals.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-sm text-[color:var(--text-secondary)]"
                      >
                        No signals found
                      </td>
                    </tr>
                  ) : (
                    filteredSignals.map((signal) => (
                      <tr
                        key={signal.id}
                        className="hover:bg-[color:var(--surface-elevated)] transition"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(signal.id)}
                            onChange={(e) =>
                              handleSelectOne(signal.id, e.target.checked)
                            }
                            className="h-4 w-4 rounded border-[color:var(--border)]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-[color:var(--text-primary)]">
                            {signal.name}
                          </div>
                          {signal.description && (
                            <div className="text-xs text-[color:var(--text-tertiary)] mt-1 line-clamp-1">
                              {signal.description}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {getClassificationBadge(signal.classification)}
                        </td>
                        <td className="px-4 py-3 text-sm text-[color:var(--text-secondary)]">
                          {getTargetLabel(signal.target)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              handleToggleActive(signal.id, signal.isActive)
                            }
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              signal.isActive
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                            }`}
                          >
                            {signal.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-[color:var(--text-tertiary)] space-y-0.5">
                            <div>👁️ {signal.analytics.viewCount} views</div>
                            <div>
                              📍 {signal.analytics.sightingCount} sightings
                            </div>
                            <div>
                              👥 {signal.analytics.subscriberCount} subscribers
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Classification Quick Actions */}
                            <select
                              value={signal.classification}
                              onChange={(e) =>
                                handleChangeClassification(
                                  signal.id,
                                  e.target.value as Signal["classification"]
                                )
                              }
                              className="text-xs rounded border border-[color:var(--border)] bg-[color:var(--surface)] px-2 py-1 text-[color:var(--text-primary)]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="personal">Personal</option>
                              <option value="verified">Verified</option>
                              <option value="community">Community</option>
                              <option value="official">Official</option>
                            </select>

                            <button
                              onClick={() => handleEdit(signal)}
                              className="text-sm text-[color:var(--accent-primary)] hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(signal.id)}
                              className="text-sm text-[color:var(--accent-danger)] hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        <SignalEditModal
          signal={editingSignal}
          isOpen={!!editingSignal}
          onClose={() => setEditingSignal(null)}
          onSave={handleSaveEdit}
        />
      </div>
    </AdminLayout>
  );
}
