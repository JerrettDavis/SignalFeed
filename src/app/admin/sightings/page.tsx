"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface Sighting {
  id: string;
  description: string;
  status: string;
  importance: string;
  observedAt: string;
  categoryId: number;
  typeId: number;
}

export default function AdminSightings() {
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingSighting, setEditingSighting] = useState<Sighting | null>(null);
  const [editForm, setEditForm] = useState({
    description: "",
    status: "",
    importance: "",
  });

  const fetchSightings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/sightings");

      if (!response.ok) {
        throw new Error(`Failed to fetch sightings: ${response.status}`);
      }

      const data = await response.json();
      setSightings(data.data || data);
    } catch (err) {
      console.error("Error fetching sightings:", err);
      setError(err instanceof Error ? err.message : "Failed to load sightings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSightings();
  }, []);

  const filteredSightings = sightings.filter((sighting) =>
    sighting.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredSightings.map((s) => s.id)));
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
    if (!confirm("Are you sure you want to delete this sighting?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/sightings/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete sighting");
      }

      await fetchSightings();
      setSelectedIds(new Set());
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete sighting");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${selectedIds.size} sighting(s)?`
      )
    ) {
      return;
    }

    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/admin/sightings/${id}`, { method: "DELETE" })
        )
      );

      await fetchSightings();
      setSelectedIds(new Set());
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete sightings");
    }
  };

  const handleEdit = (sighting: Sighting) => {
    setEditingSighting(sighting);
    setEditForm({
      description: sighting.description,
      status: sighting.status,
      importance: sighting.importance,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingSighting) return;

    try {
      const response = await fetch(
        `/api/admin/sightings/${editingSighting.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update sighting");
      }

      await fetchSightings();
      setEditingSighting(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update sighting");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)]">
              Sightings
            </h2>
            <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
              Manage all reported sightings
            </p>
          </div>
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="rounded-lg bg-[color:var(--accent-danger)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
            >
              Delete {selectedIds.size} selected
            </button>
          )}
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-4 py-2 text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[color:var(--accent-primary)] border-r-transparent"></div>
              <p className="mt-4 text-sm text-[color:var(--text-secondary)]">
                Loading sightings...
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

        {/* Table */}
        {!loading && !error && (
          <div className="overflow-hidden rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)]">
            <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-[color:var(--border)] bg-[color:var(--surface-elevated)]">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            filteredSightings.length > 0 &&
                            selectedIds.size === filteredSightings.length
                          }
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="h-4 w-4 rounded border-[color:var(--border)] text-[color:var(--accent-primary)] focus:ring-[color:var(--accent-primary)]"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[color:var(--text-secondary)] uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[color:var(--text-secondary)] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[color:var(--text-secondary)] uppercase tracking-wider">
                        Importance
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[color:var(--text-secondary)] uppercase tracking-wider">
                        Observed
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[color:var(--text-secondary)] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:var(--border)]">
                    {filteredSightings.map((sighting) => (
                      <tr
                        key={sighting.id}
                        className="hover:bg-[color:var(--surface-elevated)] transition"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(sighting.id)}
                            onChange={(e) =>
                              handleSelectOne(sighting.id, e.target.checked)
                            }
                            className="h-4 w-4 rounded border-[color:var(--border)] text-[color:var(--accent-primary)] focus:ring-[color:var(--accent-primary)]"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-[color:var(--text-primary)]">
                          {sighting.description}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              sighting.status === "active"
                                ? "bg-[color:var(--accent-success)]/10 text-[color:var(--accent-success)]"
                                : "bg-[color:var(--text-tertiary)]/10 text-[color:var(--text-tertiary)]"
                            }`}
                          >
                            {sighting.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              sighting.importance === "critical"
                                ? "bg-[color:var(--accent-danger)]/10 text-[color:var(--accent-danger)]"
                                : sighting.importance === "high"
                                  ? "bg-[color:var(--accent-warning)]/10 text-[color:var(--accent-warning)]"
                                  : "bg-[color:var(--text-tertiary)]/10 text-[color:var(--text-tertiary)]"
                            }`}
                          >
                            {sighting.importance}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[color:var(--text-secondary)]">
                          {new Date(sighting.observedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(sighting)}
                              className="rounded px-3 py-1 text-xs font-medium text-[color:var(--accent-primary)] hover:bg-[color:var(--accent-primary)]/10 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(sighting.id)}
                              className="rounded px-3 py-1 text-xs font-medium text-[color:var(--accent-danger)] hover:bg-[color:var(--accent-danger)]/10 transition"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredSightings.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-[color:var(--text-secondary)]">
                  No sightings found
                </p>
              </div>
            )}
          </div>
        )}

        {/* Edit Modal */}
        {editingSighting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-6 shadow-[var(--shadow-lg)]">
              <h3 className="text-lg font-semibold text-[color:var(--text-primary)]">
                Edit Sighting
              </h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-1">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-1">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
                    className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]"
                  >
                    <option value="active">Active</option>
                    <option value="resolved">Resolved</option>
                    <option value="investigating">Investigating</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-1">
                    Importance
                  </label>
                  <select
                    value={editForm.importance}
                    onChange={(e) =>
                      setEditForm({ ...editForm, importance: e.target.value })
                    }
                    className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 rounded-lg bg-[color:var(--accent-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--accent-hover)] transition"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingSighting(null)}
                  className="flex-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm font-medium text-[color:var(--text-primary)] hover:bg-[color:var(--surface-elevated)] transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
