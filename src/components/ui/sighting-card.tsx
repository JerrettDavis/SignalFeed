import type { SightingCard } from "@/data/mock-sightings";
import { dispatchEvent, EVENTS } from "@/shared/events";

const importanceTone: Record<SightingCard["importance"], string> = {
  low: "bg-emerald-100 text-emerald-800",
  normal: "bg-sky-100 text-sky-900",
  high: "bg-amber-100 text-amber-900",
  critical: "bg-rose-100 text-rose-900",
};

export const SightingCardItem = ({ sighting }: { sighting: SightingCard }) => {
  const handleClick = () => {
    dispatchEvent(EVENTS.sightingSelected, {
      id: sighting.id,
      title: sighting.title,
      category: sighting.category,
      description: sighting.description,
      location: sighting.location,
    });
  };

  return (
    <div
      data-testid="sighting-card"
      onClick={handleClick}
      className="flex flex-col gap-4 rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm cursor-pointer hover:bg-white/90 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--slate)]">
            {sighting.category}
          </p>
          <h3 className="mt-2 font-[family:var(--font-display)] text-xl font-semibold text-[color:var(--ink)]">
            {sighting.title}
          </h3>
          <p className="mt-2 text-sm text-[color:var(--charcoal)]">
            {sighting.description}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${importanceTone[sighting.importance]}`}
        >
          {sighting.importance.toUpperCase()}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[color:var(--slate)]">
        <span className="rounded-full bg-white/60 px-3 py-1">
          Type: {sighting.type}
        </span>
        <span className="rounded-full bg-white/60 px-3 py-1">
          Status: {sighting.status}
        </span>
        <span
          className="rounded-full bg-white/60 px-3 py-1"
          suppressHydrationWarning
        >
          Observed: {sighting.observedAtLabel}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 text-xs font-semibold text-[color:var(--charcoal)]">
        {sighting.reactions.map((reaction) => (
          <span
            key={`${sighting.id}-${reaction.label}`}
            className="rounded-full border border-[color:var(--ink)]/10 bg-white/60 px-3 py-1"
          >
            {reaction.label}: {reaction.count}
          </span>
        ))}
      </div>
    </div>
  );
};
