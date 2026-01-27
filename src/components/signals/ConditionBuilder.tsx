"use client";

import { useState, useEffect } from "react";
import type { SignalConditions } from "@/domain/signals/signal";
import type { SightingImportance } from "@/domain/sightings/sighting";
import type { ReputationTier } from "@/domain/reputation/reputation";
import type { Category, SightingType } from "@/domain/taxonomy/taxonomy";

interface ConditionBuilderProps {
  conditions: SignalConditions;
  onChange: (conditions: SignalConditions) => void;
  className?: string;
}

export function ConditionBuilder({
  conditions,
  onChange,
  className = "",
}: ConditionBuilderProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<SightingType[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch taxonomy data
  useEffect(() => {
    const fetchTaxonomy = async () => {
      try {
        const response = await fetch("/api/taxonomy");
        if (response.ok) {
          const data = await response.json();
          setCategories(data.data.categories || []);
          setTypes(data.data.types || []);
          setAllTags(data.data.tags || []);
        }
      } catch (err) {
        console.error("Failed to fetch taxonomy:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaxonomy();
  }, []);

  const handleCategoryToggle = (categoryId: string) => {
    const currentCategories = conditions.categoryIds || [];
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter((id) => id !== categoryId)
      : [...currentCategories, categoryId];

    onChange({
      ...conditions,
      categoryIds: newCategories.length > 0 ? newCategories : undefined,
    });
  };

  const handleTypeToggle = (typeId: string) => {
    const currentTypes = conditions.typeIds || [];
    const newTypes = currentTypes.includes(typeId)
      ? currentTypes.filter((id) => id !== typeId)
      : [...currentTypes, typeId];

    onChange({
      ...conditions,
      typeIds: newTypes.length > 0 ? newTypes : undefined,
    });
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = conditions.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];

    onChange({
      ...conditions,
      tags: newTags.length > 0 ? newTags : undefined,
    });
  };

  const handleImportanceToggle = (importance: SightingImportance) => {
    const currentImportance = conditions.importance || [];
    const newImportance = currentImportance.includes(importance)
      ? currentImportance.filter((i) => i !== importance)
      : [...currentImportance, importance];

    onChange({
      ...conditions,
      importance: newImportance.length > 0 ? newImportance : undefined,
    });
  };

  const handleTrustLevelChange = (level: ReputationTier | "") => {
    onChange({
      ...conditions,
      minTrustLevel: level || undefined,
    });
  };

  const handleScoreChange = (field: "minScore" | "maxScore", value: string) => {
    const numValue = value === "" ? undefined : parseInt(value, 10);
    onChange({
      ...conditions,
      [field]: numValue,
    });
  };

  const handleOperatorChange = (operator: "AND" | "OR") => {
    onChange({
      ...conditions,
      operator,
    });
  };

  if (isLoading) {
    return (
      <div
        className={`rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-4 ${className}`}
      >
        <p className="text-sm text-[color:var(--text-secondary)]">
          Loading conditions...
        </p>
      </div>
    );
  }

  // Filter types based on selected categories
  const filteredTypes =
    conditions.categoryIds && conditions.categoryIds.length > 0
      ? types.filter((type) =>
          conditions.categoryIds!.includes(type.categoryId)
        )
      : types;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Operator Selection */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[color:var(--text-primary)]">
          Condition Logic
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleOperatorChange("AND")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              (conditions.operator ?? "AND") === "AND"
                ? "border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)]/10 text-[color:var(--accent-primary)]"
                : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-elevated)]"
            }`}
          >
            Match ALL (AND)
          </button>
          <button
            type="button"
            onClick={() => handleOperatorChange("OR")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              conditions.operator === "OR"
                ? "border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)]/10 text-[color:var(--accent-primary)]"
                : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-elevated)]"
            }`}
          >
            Match ANY (OR)
          </button>
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[color:var(--text-primary)]">
          Categories
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => handleCategoryToggle(category.id)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                conditions.categoryIds?.includes(category.id)
                  ? "border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)]/10 text-[color:var(--accent-primary)]"
                  : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-elevated)]"
              }`}
            >
              {category.icon && <span className="mr-1">{category.icon}</span>}
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Types */}
      {filteredTypes.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-[color:var(--text-primary)]">
            Sighting Types
          </label>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
            <div className="flex flex-wrap gap-2">
              {filteredTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleTypeToggle(type.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    conditions.typeIds?.includes(type.id)
                      ? "border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)]/10 text-[color:var(--accent-primary)]"
                      : "border-[color:var(--border)] bg-[color:var(--surface-elevated)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface)]"
                  }`}
                >
                  {type.icon && <span className="mr-1">{type.icon}</span>}
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tags */}
      {allTags.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-[color:var(--text-primary)]">
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagToggle(tag)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  conditions.tags?.includes(tag)
                    ? "border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)]/10 text-[color:var(--accent-primary)]"
                    : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-elevated)]"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Importance Levels */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[color:var(--text-primary)]">
          Importance Levels
        </label>
        <div className="flex flex-wrap gap-2">
          {(["low", "normal", "high", "critical"] as SightingImportance[]).map(
            (importance) => (
              <button
                key={importance}
                type="button"
                onClick={() => handleImportanceToggle(importance)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition ${
                  conditions.importance?.includes(importance)
                    ? "border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)]/10 text-[color:var(--accent-primary)]"
                    : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-elevated)]"
                }`}
              >
                {importance}
              </button>
            )
          )}
        </div>
      </div>

      {/* Trust Level */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[color:var(--text-primary)]">
          Minimum Trust Level
        </label>
        <select
          value={conditions.minTrustLevel || ""}
          onChange={(e) =>
            handleTrustLevelChange(e.target.value as ReputationTier | "")
          }
          className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-elevated)] focus:border-[color:var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]/20"
        >
          <option value="">Any trust level</option>
          <option value="new">New (10+ points)</option>
          <option value="trusted">Trusted (50+ points)</option>
          <option value="verified">Verified only</option>
        </select>
      </div>

      {/* Score Range */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[color:var(--text-primary)]">
          Score Range
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-[color:var(--text-secondary)]">
              Minimum
            </label>
            <input
              type="number"
              value={conditions.minScore ?? ""}
              onChange={(e) => handleScoreChange("minScore", e.target.value)}
              placeholder="No minimum"
              className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-elevated)] focus:border-[color:var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[color:var(--text-secondary)]">
              Maximum
            </label>
            <input
              type="number"
              value={conditions.maxScore ?? ""}
              onChange={(e) => handleScoreChange("maxScore", e.target.value)}
              placeholder="No maximum"
              className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-primary)] transition hover:bg-[color:var(--surface-elevated)] focus:border-[color:var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]/20"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
