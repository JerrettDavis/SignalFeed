"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ViewToggle } from "@/components/admin/core/ViewToggle";
import { useViewMode } from "@/components/admin/utils/useViewMode";
import { UserAdminCard } from "@/components/admin/users/UserAdminCard";

interface User {
  id: string;
  email: string;
  username?: string;
  role: "user" | "moderator" | "admin";
  status: "active" | "suspended" | "banned";
  createdAt: string;
  updatedAt: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    username: "",
    role: "user" as User["role"],
    status: "active" as User["status"],
  });
  const [viewMode, setViewMode] = useViewMode("admin-users-view");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/admin/users?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data.data || data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearch = () => {
    void fetchUsers();
  };

  const filteredUsers = users;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredUsers.map((u) => u.id)));
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
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      await fetchUsers();
      setSelectedIds(new Set());
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    if (
      !confirm(`Are you sure you want to delete ${selectedIds.size} user(s)?`)
    ) {
      return;
    }

    try {
      const response = await fetch("/api/admin/users/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete users");
      }

      await fetchUsers();
      setSelectedIds(new Set());
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete users");
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      username: user.username || "",
      role: user.role,
      status: user.status,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      await fetchUsers();
      setEditingUser(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update user");
    }
  };

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
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)]">
              Registered Users
            </h2>
            <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
              Manage user accounts and permissions
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

        {/* Filters and Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-2">
            {/* Search */}
            <input
              type="text"
              placeholder="Search by email or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:border-[color:var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--accent-primary)]"
            />

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="rounded-lg bg-[color:var(--accent-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--accent-hover)] transition"
            >
              Search
            </button>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm text-[color:var(--text-primary)] focus:border-[color:var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--accent-primary)]"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm text-[color:var(--text-primary)] focus:border-[color:var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--accent-primary)]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </div>

          {/* View Toggle */}
          <ViewToggle value={viewMode} onChange={setViewMode} />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[color:var(--accent-primary)] border-r-transparent"></div>
              <p className="mt-4 text-sm text-[color:var(--text-secondary)]">
                Loading users...
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
            {filteredUsers.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-sm text-[color:var(--text-secondary)]">
                  No users found
                </p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <UserAdminCard
                  key={user.id}
                  user={user}
                  selected={selectedIds.has(user.id)}
                  onSelect={handleSelectOne}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
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
                          selectedIds.size === filteredUsers.length &&
                          filteredUsers.length > 0
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-4 w-4 rounded border-[color:var(--border)]"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[color:var(--text-secondary)] uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[color:var(--text-secondary)] uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[color:var(--text-secondary)] uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[color:var(--text-secondary)] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[color:var(--text-secondary)] uppercase tracking-wider">
                      Registered
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[color:var(--text-secondary)] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--border)]">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-sm text-[color:var(--text-secondary)]"
                      >
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-[color:var(--surface-elevated)] transition"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(user.id)}
                            onChange={(e) =>
                              handleSelectOne(user.id, e.target.checked)
                            }
                            className="h-4 w-4 rounded border-[color:var(--border)]"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-[color:var(--text-primary)]">
                          {user.email}
                        </td>
                        <td className="px-4 py-3 text-sm text-[color:var(--text-secondary)]">
                          {user.username || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getRoleBadgeColor(
                              user.role
                            )}`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeColor(
                              user.status
                            )}`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[color:var(--text-secondary)]">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(user)}
                              className="rounded px-3 py-1 text-xs font-medium text-[color:var(--accent-primary)] hover:bg-[color:var(--accent-primary)]/10 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="rounded px-3 py-1 text-xs font-medium text-[color:var(--accent-danger)] hover:bg-[color:var(--accent-danger)]/10 transition"
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
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-6 shadow-[var(--shadow-lg)]">
              <h3 className="text-lg font-semibold text-[color:var(--text-primary)]">
                Edit User
              </h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-1">
                    Email (readonly)
                  </label>
                  <input
                    type="text"
                    value={editingUser.email}
                    disabled
                    className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-tertiary)] cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm({ ...editForm, username: e.target.value })
                    }
                    placeholder="Optional"
                    className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-1">
                    Role
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        role: e.target.value as User["role"],
                      })
                    }
                    className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]"
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-1">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        status: e.target.value as User["status"],
                      })
                    }
                    className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="banned">Banned</option>
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
                  onClick={() => setEditingUser(null)}
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
