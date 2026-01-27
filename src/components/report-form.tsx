"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { categories, sightingTypes } from "@/data/taxonomy";
import { dispatchEvent, EVENTS } from "@/shared/events";

const toLocalDateTime = (date: Date) => {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

export const ReportForm = () => {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [typeId, setTypeId] = useState(sightingTypes[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [details, setDetails] = useState("");
  const [importance, setImportance] = useState("normal");
  const [observedAt, setObservedAt] = useState(toLocalDateTime(new Date()));
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [customKey, setCustomKey] = useState("");
  const [customValue, setCustomValue] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error" | "success">(
    "idle"
  );

  const filteredTypes = useMemo(
    () => sightingTypes.filter((type) => type.categoryId === categoryId),
    [categoryId]
  );

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setStatus("error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(6));
        setLng(position.coords.longitude.toFixed(6));
      },
      () => setStatus("error")
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("saving");
    const latValue = Number(lat);
    const lngValue = Number(lng);
    if (!Number.isFinite(latValue) || !Number.isFinite(lngValue)) {
      setStatus("error");
      return;
    }

    const fields = customKey.trim()
      ? { [customKey.trim()]: customValue }
      : undefined;

    const response = await fetch("/api/sightings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        typeId,
        categoryId,
        location: { lat: latValue, lng: lngValue },
        description,
        details: details || undefined,
        importance,
        observedAt: new Date(observedAt).toISOString(),
        fields,
      }),
    });

    if (!response.ok) {
      setStatus("error");
      return;
    }

    setStatus("success");
    setDescription("");
    setDetails("");
    setCustomKey("");
    setCustomValue("");
    dispatchEvent(EVENTS.sightingsUpdated);
  };

  return (
    <form
      data-testid="report-form"
      onSubmit={handleSubmit}
      className="grid gap-4 text-sm"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium text-[color:var(--text-secondary)]">
            Category
          </span>
          <select
            value={categoryId}
            onChange={(event) => {
              setCategoryId(event.target.value);
              const firstType = sightingTypes.find(
                (type) => type.categoryId === event.target.value
              );
              if (firstType) {
                setTypeId(firstType.id);
              }
            }}
            className="rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium text-[color:var(--text-secondary)]">
            Type
          </span>
          <select
            value={typeId}
            onChange={(event) => setTypeId(event.target.value)}
            className="rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]"
          >
            {filteredTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium text-[color:var(--text-secondary)]">
          Description
        </span>
        <input
          data-testid="report-description"
          required
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]"
          placeholder="What did you see?"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium text-[color:var(--text-secondary)]">
          Details
        </span>
        <textarea
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          className="min-h-[96px] rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]"
          placeholder="Add helpful context (optional)."
        />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium text-[color:var(--text-secondary)]">
            Importance
          </span>
          <select
            value={importance}
            onChange={(event) => setImportance(event.target.value)}
            className="rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium text-[color:var(--text-secondary)]">
            Observed at
          </span>
          <input
            type="datetime-local"
            value={observedAt}
            onChange={(event) => setObservedAt(event.target.value)}
            className="rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]"
          />
        </label>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-[color:var(--text-secondary)]">
          Location
        </span>
        <div className="grid gap-2 md:grid-cols-3">
          <input
            data-testid="report-lat"
            value={lat}
            onChange={(event) => setLat(event.target.value)}
            className="min-w-0 rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]"
            placeholder="Latitude"
          />
          <input
            data-testid="report-lng"
            value={lng}
            onChange={(event) => setLng(event.target.value)}
            className="min-w-0 rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]"
            placeholder="Longitude"
          />
          <button
            type="button"
            onClick={handleUseLocation}
            className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-xs font-medium text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-elevated)] hover:text-[color:var(--text-primary)] transition"
          >
            Use my location
          </button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium text-[color:var(--text-secondary)]">
            Custom field key
          </span>
          <input
            value={customKey}
            onChange={(event) => setCustomKey(event.target.value)}
            className="rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]"
            placeholder="website, organizer, status"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium text-[color:var(--text-secondary)]">
            Custom field value
          </span>
          <input
            value={customValue}
            onChange={(event) => setCustomValue(event.target.value)}
            className="rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-primary)]"
            placeholder="Optional value"
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          data-testid="report-submit"
          type="submit"
          disabled={status === "saving"}
          className="rounded-lg bg-[color:var(--accent-primary)] px-6 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-sm)] hover:bg-[color:var(--accent-hover)] transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "saving" ? "Submitting..." : "Submit sighting"}
        </button>
        {status === "error" ? (
          <span className="text-xs font-medium text-[color:var(--accent-danger)]">
            Please check inputs and try again.
          </span>
        ) : null}
        {status === "success" ? (
          <span className="text-xs font-medium text-[color:var(--accent-success)]">
            Submitted successfully
          </span>
        ) : null}
      </div>
    </form>
  );
};
