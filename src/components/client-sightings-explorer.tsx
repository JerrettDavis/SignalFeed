"use client";

import dynamic from "next/dynamic";

export const ClientSightingsExplorer = dynamic(
  () =>
    import("@/components/sightings-explorer").then(
      (mod) => mod.SightingsExplorer
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-[var(--shadow-soft)]" />
        <div className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-[var(--shadow-soft)]" />
      </div>
    ),
  }
);
