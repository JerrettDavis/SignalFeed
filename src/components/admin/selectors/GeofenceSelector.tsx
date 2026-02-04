"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Search, Globe } from "lucide-react";

interface Geofence {
  id: string;
  name: string;
  visibility: "public" | "private";
}

export interface GeofenceSelectorProps {
  value: string | null; // geofenceId or null for global
  onChange: (geofenceId: string | null, geofenceName: string | null) => void;
  label?: string;
  placeholder?: string;
  allowGlobal?: boolean;
  className?: string;
}

export const GeofenceSelector = ({
  value,
  onChange,
  label = "Geofence",
  placeholder = "Select geofence",
  allowGlobal = true,
  className = "",
}: GeofenceSelectorProps) => {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch geofences on mount
  useEffect(() => {
    const fetchGeofences = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/geofences");
        if (!response.ok) throw new Error("Failed to fetch geofences");

        const data = await response.json();
        setGeofences(data.data || data);
      } catch (err) {
        console.error("Error fetching geofences:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load geofences"
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchGeofences();
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

  const filteredGeofences = geofences.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedGeofence = geofences.find((g) => g.id === value);
  const displayText =
    value === null && allowGlobal
      ? "Global"
      : selectedGeofence
        ? selectedGeofence.name
        : placeholder;

  const handleSelect = (geofenceId: string | null, name: string | null) => {
    onChange(geofenceId, name);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-[color:var(--text-primary)] mb-1.5">
          {label}
        </label>
      )}

      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm text-[color:var(--text-primary)] hover:bg-[color:var(--surface-elevated)] focus:border-[color:var(--accent-primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--accent-primary)] transition"
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[var(--shadow-lg)] overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-[color:var(--border)]">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-tertiary)]"
              />
              <input
                type="text"
                placeholder="Search geofences..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm rounded border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:border-[color:var(--accent-primary)] focus:outline-none"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-3 text-sm text-[color:var(--text-secondary)]">
                Loading...
              </div>
            ) : error ? (
              <div className="px-4 py-3 text-sm text-[color:var(--accent-danger)]">
                {error}
              </div>
            ) : (
              <>
                {/* Global Option */}
                {allowGlobal && (
                  <button
                    type="button"
                    onClick={() => handleSelect(null, null)}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-[color:var(--surface-elevated)] transition ${
                      value === null
                        ? "bg-[color:var(--accent-primary)]/10 text-[color:var(--accent-primary)]"
                        : "text-[color:var(--text-primary)]"
                    }`}
                  >
                    <Globe size={16} />
                    <span>Global (No Geofence)</span>
                  </button>
                )}

                {/* Geofence Options */}
                {filteredGeofences.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-[color:var(--text-secondary)]">
                    No geofences found
                  </div>
                ) : (
                  filteredGeofences.map((geofence) => (
                    <button
                      key={geofence.id}
                      type="button"
                      onClick={() => handleSelect(geofence.id, geofence.name)}
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-[color:var(--surface-elevated)] transition ${
                        value === geofence.id
                          ? "bg-[color:var(--accent-primary)]/10 text-[color:var(--accent-primary)]"
                          : "text-[color:var(--text-primary)]"
                      }`}
                    >
                      <span className="truncate">{geofence.name}</span>
                      {geofence.visibility === "private" && (
                        <span className="text-xs text-[color:var(--text-tertiary)] ml-2">
                          Private
                        </span>
                      )}
                    </button>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
