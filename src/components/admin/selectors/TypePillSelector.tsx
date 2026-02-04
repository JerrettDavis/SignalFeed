"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, X, Search } from "lucide-react";

interface SightingType {
  id: string;
  label: string;
  categoryId: string;
  subcategoryId?: string;
  tags: string[];
  icon?: string;
}

export interface TypePillSelectorProps {
  selectedTypeIds: string[];
  onChange: (typeIds: string[]) => void;
  label?: string;
  maxSelections?: number;
  className?: string;
}

export const TypePillSelector = ({
  selectedTypeIds,
  onChange,
  label = "Sighting Types",
  maxSelections = 50,
  className = "",
}: TypePillSelectorProps) => {
  const [types, setTypes] = useState<SightingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch sighting types on mount
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/taxonomy/types");
        if (!response.ok) throw new Error("Failed to fetch sighting types");

        const data = await response.json();
        setTypes(data.data || data);
      } catch (err) {
        console.error("Error fetching sighting types:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load sighting types"
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchTypes();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTypes = types.filter((t) =>
    t.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTypes = types.filter((t) => selectedTypeIds.includes(t.id));
  const availableTypes = filteredTypes.filter(
    (t) => !selectedTypeIds.includes(t.id)
  );

  const handleAdd = (typeId: string) => {
    if (selectedTypeIds.length < maxSelections) {
      onChange([...selectedTypeIds, typeId]);
      setSearchQuery("");
    }
  };

  const handleRemove = (typeId: string) => {
    onChange(selectedTypeIds.filter((id) => id !== typeId));
  };

  const handleToggle = (typeId: string) => {
    if (selectedTypeIds.includes(typeId)) {
      handleRemove(typeId);
    } else {
      handleAdd(typeId);
    }
  };

  return (
    <div className={`${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[color:var(--text-primary)] mb-1.5">
          {label}
          <span className="ml-2 text-xs text-[color:var(--text-tertiary)]">
            {selectedTypeIds.length}/{maxSelections} selected
          </span>
        </label>
      )}

      {/* Selected Pills */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTypes.length === 0 ? (
          <span className="text-sm text-[color:var(--text-tertiary)] italic">
            No types selected
          </span>
        ) : (
          selectedTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => handleRemove(type.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[color:var(--accent-primary)]/10 text-[color:var(--accent-primary)] text-sm font-medium hover:bg-[color:var(--accent-primary)]/20 transition group"
            >
              <span>{type.label}</span>
              <X
                size={14}
                className="group-hover:text-[color:var(--accent-danger)]"
              />
            </button>
          ))
        )}
      </div>

      {/* Add Type Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={selectedTypeIds.length >= maxSelections}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] text-sm text-[color:var(--text-primary)] hover:bg-[color:var(--surface-elevated)] disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Plus size={16} />
          Add Type
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full min-w-[300px] rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[var(--shadow-lg)] overflow-hidden">
            {/* Search Input */}
            <div className="p-2 border-b border-[color:var(--border)]">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-tertiary)]"
                />
                <input
                  type="text"
                  placeholder="Search types..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm rounded border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:border-[color:var(--accent-primary)] focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Types List */}
            <div className="max-h-60 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-3 text-sm text-[color:var(--text-secondary)]">
                  Loading types...
                </div>
              ) : error ? (
                <div className="px-4 py-3 text-sm text-[color:var(--accent-danger)]">
                  {error}
                </div>
              ) : availableTypes.length === 0 ? (
                <div className="px-4 py-3 text-sm text-[color:var(--text-secondary)]">
                  {searchQuery
                    ? "No types match your search"
                    : "All types selected"}
                </div>
              ) : (
                availableTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleAdd(type.id)}
                    className="w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-[color:var(--surface-elevated)] transition text-[color:var(--text-primary)]"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{type.label}</div>
                      {type.tags && type.tags.length > 0 && (
                        <div className="text-xs text-[color:var(--text-tertiary)] mt-0.5">
                          {type.tags.slice(0, 3).join(", ")}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {selectedTypeIds.length >= maxSelections && (
        <p className="mt-2 text-xs text-[color:var(--accent-warning)]">
          Maximum {maxSelections} types selected
        </p>
      )}
    </div>
  );
};
