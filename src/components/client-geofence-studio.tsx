"use client";

import dynamic from "next/dynamic";

export const ClientGeofenceStudio = dynamic(
  () =>
    import("@/components/geofence-studio").then((mod) => mod.GeofenceStudio),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow-sm)]" />
    ),
  }
);
