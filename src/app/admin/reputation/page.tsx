"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface ReputationEvent {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  referenceId?: string;
  createdAt: string;
}

interface UserReputationData {
  userId: string;
  score: number;
  createdAt: string;
  updatedAt: string;
}

interface UserReputationWithDetails extends UserReputationData {
  tier: "unverified" | "new" | "trusted" | "verified";
  events?: ReputationEvent[];
  isExpanded?: boolean;
}

type SortField = "score" | "createdAt";
type SortDirection = "asc" | "desc";

const getTierLabel = (tier: string): string => {
  switch (tier) {
    case "verified":
      return "✓ Verified";
    case "trusted":
      return "★ Trusted";
    case "new":
      return "⭐ New";
    case "unverified":
      return "Unverified";
    default:
      return tier;
  }
};

const getTierColor = (tier: string): string => {
  switch (tier) {
    case "verified":
      return "bg-[color:var(--accent-success)]/10 text-[color:var(--accent-success)]";
    case "trusted":
      return "bg-[color:var(--accent-primary)]/10 text-[color:var(--accent-primary)]";
    case "new":
      return "bg-[color:var(--accent-warning)]/10 text-[color:var(--accent-warning)]";
    case "unverified":
      return "bg-[color:var(--text-tertiary)]/10 text-[color:var(--text-tertiary)]";
    default:
      return "bg-[color:var(--text-tertiary)]/10 text-[color:var(--text-tertiary)]";
  }
};

const formatReasonLabel = (reason: string): string => {
  return reason
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function AdminReputation() {
  const [users, setUsers] = useState<UserReputationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [loadingEvents, setLoadingEvents] = useState<string | null>(null);
  const [adjustingUserId, setAdjustingUserId] = useState<string | null>(null);
  const [adjustmentForm, setAdjustmentForm] = useState({
    amount: 0,
    reason: "",
  });

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/reputation?limit=50");

      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.status}`);
      }

      const data = await response.json();
      const leaderboardData = data.data || [];

      // Calculate tier for each user
      const usersWithTiers = leaderboardData.map(
        (user: UserReputationData) => ({
          ...user,
          tier: getReputationTier(user.score),
          events: [],
          isExpanded: false,
        })
      );

      setUsers(usersWithTiers);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load leaderboard"
      );
    } finally {
      setLoading(false);
    }
  };

  const getReputationTier = (
    score: number
  ): "unverified" | "new" | "trusted" | "verified" => {
    if (score >= 50) return "trusted";
    if (score >= 10) return "new";
    return "unverified";
  };

  const fetchUserEvents = async (userId: string) => {
    setLoadingEvents(userId);
    try {
      const response = await fetch(
        `/api/admin/reputation/${userId}?includeEvents=true&eventsLimit=20`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user events");
      }

      const data = await response.json();
      const events = data.data.events || [];

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.userId === userId ? { ...user, events, isExpanded: true } : user
        )
      );
      setExpandedUserId(userId);
    } catch (err) {
      console.error("Error fetching events:", err);
      alert(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoadingEvents(null);
    }
  };

  const handleToggleExpand = async (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.userId === userId ? { ...user, isExpanded: false } : user
        )
      );
    } else {
      const user = users.find((u) => u.userId === userId);
      if (user && (!user.events || user.events.length === 0)) {
        await fetchUserEvents(userId);
      } else {
        setExpandedUserId(userId);
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.userId === userId ? { ...u, isExpanded: true } : u
          )
        );
      }
    }
  };

  const handleAdjustReputation = (userId: string) => {
    setAdjustingUserId(userId);
    setAdjustmentForm({ amount: 0, reason: "" });
  };

  const handleSaveAdjustment = async () => {
    if (!adjustingUserId) return;

    if (adjustmentForm.amount === 0) {
      alert("Please enter a non-zero amount");
      return;
    }

    if (!adjustmentForm.reason.trim()) {
      alert("Please enter a reason for the adjustment");
      return;
    }

    try {
      const response = await fetch(`/api/admin/reputation/${adjustingUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adjustmentForm),
      });

      if (!response.ok) {
        throw new Error("Failed to adjust reputation");
      }

      await fetchLeaderboard();
      setAdjustingUserId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to adjust reputation");
    }
  };

  useEffect(() => {
    void fetchLeaderboard();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.score.toString().includes(searchQuery)
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let comparison = 0;

    if (sortField === "score") {
      comparison = a.score - b.score;
    } else if (sortField === "createdAt") {
      comparison =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="ml-1 text-[color:var(--text-tertiary)]">⇅</span>;
    }
    return (
      <span className="ml-1 text-[color:var(--accent-primary)]">
        {sortDirection === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)]">
              Reputation Leaderboard
            </h2>
            <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
              Monitor and manage user reputation scores
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by user ID or score..."
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
                Loading leaderboard...
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
                  <thead className="border-b border-[color:var(--border)] bg-[color:var(--surface-elevated)] sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[color:var(--text-secondary)] uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[color:var(--text-secondary)] uppercase tracking-wider">
                        User ID
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-medium text-[color:var(--text-secondary)] uppercase tracking-wider cursor-pointer hover:text-[color:var(--text-primary)] transition"
                        onClick={() => handleSort("score")}
                      >
                        Score
                        <SortIcon field="score" />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[color:var(--text-secondary)] uppercase tracking-wider">
                        Tier
                      </th>
                      <th
                        className="px-4 py-3 text-left text-xs font-medium text-[color:var(--text-secondary)] uppercase tracking-wider cursor-pointer hover:text-[color:var(--text-primary)] transition"
                        onClick={() => handleSort("createdAt")}
                      >
                        Member Since
                        <SortIcon field="createdAt" />
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[color:var(--text-secondary)] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:var(--border)]">
                    {sortedUsers.map((user, index) => (
                      <>
                        <tr
                          key={user.userId}
                          className="hover:bg-[color:var(--surface-elevated)] transition"
                        >
                          <td className="px-4 py-3 text-sm font-medium text-[color:var(--text-secondary)]">
                            #{index + 1}
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-[color:var(--text-primary)]">
                            {user.userId.substring(0, 8)}...
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-[color:var(--text-primary)]">
                            {user.score}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getTierColor(
                                user.tier
                              )}`}
                            >
                              {getTierLabel(user.tier)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-[color:var(--text-secondary)]">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleExpand(user.userId)}
                                disabled={loadingEvents === user.userId}
                                className="rounded px-3 py-1 text-xs font-medium text-[color:var(--accent-primary)] hover:bg-[color:var(--accent-primary)]/10 transition disabled:opacity-50"
                              >
                                {loadingEvents === user.userId
                                  ? "Loading..."
                                  : user.isExpanded
                                    ? "Hide Events"
                                    : "View Events"}
                              </button>
                              <button
                                onClick={() =>
                                  handleAdjustReputation(user.userId)
                                }
                                className="rounded px-3 py-1 text-xs font-medium text-[color:var(--accent-warning)] hover:bg-[color:var(--accent-warning)]/10 transition"
                              >
                                Adjust
                              </button>
                            </div>
                          </td>
                        </tr>
                        {user.isExpanded &&
                          user.events &&
                          user.events.length > 0 && (
                            <tr key={`${user.userId}-events`}>
                              <td
                                colSpan={6}
                                className="px-4 py-3 bg-[color:var(--background)]"
                              >
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium text-[color:var(--text-primary)] mb-2">
                                    Recent Reputation Events
                                  </h4>
                                  <div className="space-y-1 max-h-60 overflow-y-auto">
                                    {user.events.map((event) => (
                                      <div
                                        key={event.id}
                                        className="flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-xs"
                                      >
                                        <div className="flex items-center gap-3">
                                          <span
                                            className={`font-bold ${
                                              event.amount > 0
                                                ? "text-[color:var(--accent-success)]"
                                                : "text-[color:var(--accent-danger)]"
                                            }`}
                                          >
                                            {event.amount > 0 ? "+" : ""}
                                            {event.amount}
                                          </span>
                                          <span className="text-[color:var(--text-primary)]">
                                            {formatReasonLabel(event.reason)}
                                          </span>
                                          {event.referenceId && (
                                            <span className="text-[color:var(--text-tertiary)] font-mono">
                                              (
                                              {event.referenceId.substring(
                                                0,
                                                8
                                              )}
                                              ...)
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[color:var(--text-secondary)]">
                                          {new Date(
                                            event.createdAt
                                          ).toLocaleString()}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        {user.isExpanded &&
                          (!user.events || user.events.length === 0) && (
                            <tr key={`${user.userId}-no-events`}>
                              <td
                                colSpan={6}
                                className="px-4 py-3 bg-[color:var(--background)] text-center"
                              >
                                <p className="text-sm text-[color:var(--text-secondary)]">
                                  No events found for this user
                                </p>
                              </td>
                            </tr>
                          )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {sortedUsers.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-[color:var(--text-secondary)]">
                  No users found
                </p>
              </div>
            )}
          </div>
        )}

        {/* Adjustment Modal */}
        {adjustingUserId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-6 shadow-[var(--shadow-lg)]">
              <h3 className="text-lg font-semibold text-[color:var(--text-primary)]">
                Adjust Reputation
              </h3>
              <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                User ID: {adjustingUserId.substring(0, 16)}...
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-1">
                    Amount (positive or negative)
                  </label>
                  <input
                    type="number"
                    value={adjustmentForm.amount}
                    onChange={(e) =>
                      setAdjustmentForm({
                        ...adjustmentForm,
                        amount: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="e.g., 10 or -5"
                    className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-1">
                    Reason for adjustment
                  </label>
                  <textarea
                    value={adjustmentForm.reason}
                    onChange={(e) =>
                      setAdjustmentForm({
                        ...adjustmentForm,
                        reason: e.target.value,
                      })
                    }
                    placeholder="Explain why you're adjusting this user's reputation..."
                    className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]"
                    rows={3}
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleSaveAdjustment}
                  className="flex-1 rounded-lg bg-[color:var(--accent-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--accent-hover)] transition"
                >
                  Apply Adjustment
                </button>
                <button
                  onClick={() => setAdjustingUserId(null)}
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
