"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface Category {
  id: string;
  label: string;
}

interface SightingType {
  id: string;
  label: string;
  categoryId: string;
}

type Tab = "categories" | "types";

export default function AdminTaxonomy() {
  const [activeTab, setActiveTab] = useState<Tab>("categories");
  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<SightingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Category state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ id: "", label: "" });
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);

  // Type state
  const [editingType, setEditingType] = useState<SightingType | null>(null);
  const [typeForm, setTypeForm] = useState({
    id: "",
    label: "",
    categoryId: "",
  });
  const [showTypeDialog, setShowTypeDialog] = useState(false);

  const fetchTaxonomy = async () => {
    try {
      setLoading(true);
      setError(null);

      const [categoriesRes, typesRes] = await Promise.all([
        fetch("/api/admin/taxonomy/categories"),
        fetch("/api/admin/taxonomy/types"),
      ]);

      if (!categoriesRes.ok || !typesRes.ok) {
        throw new Error("Failed to fetch taxonomy");
      }

      const categoriesData = await categoriesRes.json();
      const typesData = await typesRes.json();

      setCategories(categoriesData.data || []);
      setTypes(typesData.data || []);
    } catch (err) {
      console.error("Error fetching taxonomy:", err);
      setError(err instanceof Error ? err.message : "Failed to load taxonomy");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTaxonomy();
  }, []);

  // Category handlers
  const handleCreateCategory = () => {
    setCategoryForm({ id: "", label: "" });
    setEditingCategory(null);
    setShowCategoryDialog(true);
  };

  const handleEditCategory = (category: Category) => {
    setCategoryForm({ id: category.id, label: category.label });
    setEditingCategory(category);
    setShowCategoryDialog(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.id || !categoryForm.label) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const url = editingCategory
        ? `/api/admin/taxonomy/categories/${editingCategory.id}`
        : "/api/admin/taxonomy/categories";

      const method = editingCategory ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryForm),
      });

      if (!response.ok) {
        throw new Error("Failed to save category");
      }

      await fetchTaxonomy();
      setShowCategoryDialog(false);
      setCategoryForm({ id: "", label: "" });
      setEditingCategory(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save category");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const typesInCategory = types.filter((t) => t.categoryId === id);
    if (typesInCategory.length > 0) {
      alert(
        `Cannot delete category: ${typesInCategory.length} type(s) are using it`
      );
      return;
    }

    if (!confirm("Are you sure you want to delete this category?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/taxonomy/categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete category");
      }

      await fetchTaxonomy();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete category");
    }
  };

  // Type handlers
  const handleCreateType = () => {
    setTypeForm({ id: "", label: "", categoryId: categories[0]?.id || "" });
    setEditingType(null);
    setShowTypeDialog(true);
  };

  const handleEditType = (type: SightingType) => {
    setTypeForm({
      id: type.id,
      label: type.label,
      categoryId: type.categoryId,
    });
    setEditingType(type);
    setShowTypeDialog(true);
  };

  const handleSaveType = async () => {
    if (!typeForm.id || !typeForm.label || !typeForm.categoryId) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const url = editingType
        ? `/api/admin/taxonomy/types/${editingType.id}`
        : "/api/admin/taxonomy/types";

      const method = editingType ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(typeForm),
      });

      if (!response.ok) {
        throw new Error("Failed to save type");
      }

      await fetchTaxonomy();
      setShowTypeDialog(false);
      setTypeForm({ id: "", label: "", categoryId: "" });
      setEditingType(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save type");
    }
  };

  const handleDeleteType = async (id: string) => {
    if (!confirm("Are you sure you want to delete this type?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/taxonomy/types/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete type");
      }

      await fetchTaxonomy();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete type");
    }
  };

  const getCategoryLabel = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.label || categoryId;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-[color:var(--text-secondary)]">
            Loading taxonomy...
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          Error: {error}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[color:var(--text-primary)]">
            Taxonomy Management
          </h1>
        </div>

        {/* Tabs */}
        <div className="border-b border-[color:var(--border)]">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("categories")}
              className={`px-4 py-2 text-sm font-medium transition ${
                activeTab === "categories"
                  ? "border-b-2 border-[color:var(--accent-primary)] text-[color:var(--accent-primary)]"
                  : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
              }`}
            >
              Categories ({categories.length})
            </button>
            <button
              onClick={() => setActiveTab("types")}
              className={`px-4 py-2 text-sm font-medium transition ${
                activeTab === "types"
                  ? "border-b-2 border-[color:var(--accent-primary)] text-[color:var(--accent-primary)]"
                  : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
              }`}
            >
              Types ({types.length})
            </button>
          </div>
        </div>

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={handleCreateCategory}
                className="rounded-lg bg-[color:var(--accent-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--accent-hover)] transition"
              >
                + Add Category
              </button>
            </div>

            <div className="overflow-hidden rounded-lg border border-[color:var(--border)]">
              <table className="w-full">
                <thead className="bg-[color:var(--surface)] border-b border-[color:var(--border)]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--text-secondary)] uppercase">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--text-secondary)] uppercase">
                      Label
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--text-secondary)] uppercase">
                      Types Count
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[color:var(--text-secondary)] uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--border)] bg-[color:var(--surface-elevated)]">
                  {categories.map((category) => {
                    const typesCount = types.filter(
                      (t) => t.categoryId === category.id
                    ).length;
                    return (
                      <tr key={category.id}>
                        <td className="px-6 py-4 text-sm font-mono text-[color:var(--text-secondary)]">
                          {category.id}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-[color:var(--text-primary)]">
                          {category.label}
                        </td>
                        <td className="px-6 py-4 text-sm text-[color:var(--text-secondary)]">
                          {typesCount}
                        </td>
                        <td className="px-6 py-4 text-right text-sm space-x-2">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="text-[color:var(--accent-primary)] hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-red-600 hover:underline"
                            disabled={typesCount > 0}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Types Tab */}
        {activeTab === "types" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={handleCreateType}
                className="rounded-lg bg-[color:var(--accent-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--accent-hover)] transition"
                disabled={categories.length === 0}
              >
                + Add Type
              </button>
            </div>

            {categories.length === 0 ? (
              <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-8 text-center">
                <p className="text-[color:var(--text-secondary)]">
                  Please create at least one category before adding types.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-[color:var(--border)]">
                <table className="w-full">
                  <thead className="bg-[color:var(--surface)] border-b border-[color:var(--border)]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--text-secondary)] uppercase">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--text-secondary)] uppercase">
                        Label
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--text-secondary)] uppercase">
                        Category
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[color:var(--text-secondary)] uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:var(--border)] bg-[color:var(--surface-elevated)]">
                    {types.map((type) => (
                      <tr key={type.id}>
                        <td className="px-6 py-4 text-sm font-mono text-[color:var(--text-secondary)]">
                          {type.id}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-[color:var(--text-primary)]">
                          {type.label}
                        </td>
                        <td className="px-6 py-4 text-sm text-[color:var(--text-secondary)]">
                          {getCategoryLabel(type.categoryId)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm space-x-2">
                          <button
                            onClick={() => handleEditType(type)}
                            className="text-[color:var(--accent-primary)] hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteType(type.id)}
                            className="text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Category Dialog */}
        {showCategoryDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-[color:var(--surface-elevated)] p-6 shadow-xl">
              <h2 className="mb-4 text-lg font-semibold text-[color:var(--text-primary)]">
                {editingCategory ? "Edit Category" : "Create Category"}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-1">
                    ID
                  </label>
                  <input
                    type="text"
                    value={categoryForm.id}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, id: e.target.value })
                    }
                    disabled={!!editingCategory}
                    className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]"
                    placeholder="cat-example"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-1">
                    Label
                  </label>
                  <input
                    type="text"
                    value={categoryForm.label}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        label: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]"
                    placeholder="Example Category"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowCategoryDialog(false);
                    setCategoryForm({ id: "", label: "" });
                    setEditingCategory(null);
                  }}
                  className="rounded-lg border border-[color:var(--border)] px-4 py-2 text-sm font-medium text-[color:var(--text-secondary)] hover:bg-[color:var(--surface)] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCategory}
                  className="rounded-lg bg-[color:var(--accent-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--accent-hover)] transition"
                >
                  {editingCategory ? "Save" : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Type Dialog */}
        {showTypeDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-[color:var(--surface-elevated)] p-6 shadow-xl">
              <h2 className="mb-4 text-lg font-semibold text-[color:var(--text-primary)]">
                {editingType ? "Edit Type" : "Create Type"}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-1">
                    ID
                  </label>
                  <input
                    type="text"
                    value={typeForm.id}
                    onChange={(e) =>
                      setTypeForm({ ...typeForm, id: e.target.value })
                    }
                    disabled={!!editingType}
                    className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]"
                    placeholder="type-example"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-1">
                    Label
                  </label>
                  <input
                    type="text"
                    value={typeForm.label}
                    onChange={(e) =>
                      setTypeForm({ ...typeForm, label: e.target.value })
                    }
                    className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]"
                    placeholder="Example Type"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-1">
                    Category
                  </label>
                  <select
                    value={typeForm.categoryId}
                    onChange={(e) =>
                      setTypeForm({ ...typeForm, categoryId: e.target.value })
                    }
                    className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowTypeDialog(false);
                    setTypeForm({ id: "", label: "", categoryId: "" });
                    setEditingType(null);
                  }}
                  className="rounded-lg border border-[color:var(--border)] px-4 py-2 text-sm font-medium text-[color:var(--text-secondary)] hover:bg-[color:var(--surface)] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveType}
                  className="rounded-lg bg-[color:var(--accent-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--accent-hover)] transition"
                >
                  {editingType ? "Save" : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
