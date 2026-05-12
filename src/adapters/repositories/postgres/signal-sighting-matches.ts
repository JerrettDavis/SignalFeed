import type { Sql } from "postgres";
import type { Signal } from "@/domain/signals/signal";
import type { Sighting, SightingId } from "@/domain/sightings/sighting";
import { parseCustomFields } from "@/adapters/repositories/postgres/json-fields";

export type SightingRow = {
  id: string;
  type_id: string;
  category_id: string;
  location: { lat: number; lng: number };
  description: string;
  details: string | null;
  importance: string;
  status: string;
  observed_at: Date | string;
  created_at: Date | string;
  fields: unknown;
  reporter_id: string | null;
  upvotes: number;
  downvotes: number;
  confirmations: number;
  disputes: number;
  spam_reports: number;
  score: number;
  hot_score: number;
  time_adjusted_score?: number | null;
  relevance_score?: number | null;
  decay_rate?: number | null;
  last_score_update?: Date | string | null;
  flair_count?: number | null;
  primary_flair_id?: string | null;
  visibility_state?: string | null;
};

const toIso = (value: Date | string | null | undefined, fallback?: string) => {
  if (!value) return fallback ?? new Date().toISOString();
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
};

export const mapSignalSightingRow = (row: SightingRow): Sighting => ({
  id: row.id as SightingId,
  typeId: row.type_id as Sighting["typeId"],
  categoryId: row.category_id as Sighting["categoryId"],
  location: row.location,
  description: row.description,
  details: row.details || undefined,
  importance: row.importance as Sighting["importance"],
  status:
    row.status === "archived"
      ? "resolved"
      : (row.status as "active" | "resolved"),
  observedAt: toIso(row.observed_at),
  createdAt: toIso(row.created_at),
  fields: parseCustomFields(row.fields),
  reporterId: row.reporter_id || undefined,
  upvotes: row.upvotes,
  downvotes: row.downvotes,
  confirmations: row.confirmations,
  disputes: row.disputes,
  spamReports: row.spam_reports,
  score: row.score,
  hotScore: row.hot_score,
  timeAdjustedScore: Number(row.time_adjusted_score ?? 0),
  relevanceScore: Number(row.relevance_score ?? 1),
  decayRate: row.decay_rate == null ? undefined : Number(row.decay_rate),
  lastScoreUpdate: toIso(row.last_score_update, toIso(row.created_at)),
  flairCount: Number(row.flair_count ?? 0),
  primaryFlairId: row.primary_flair_id || undefined,
  visibilityState:
    (row.visibility_state as Sighting["visibilityState"]) ?? "visible",
});

const FEED_LAYER_MATCHES: Record<string, string[]> = {
  "signal-layer-weather-alerts": [
    "fields->>'feedSource' = 'noaa-weather'",
    "category_id = 'cat-weather-alerts'",
  ],
  "signal-layer-tornado-alerts": [
    "type_id = 'type-tornado-alert'",
    "(fields->>'feedSource' = 'noaa-weather' AND lower(fields->>'event') LIKE '%tornado%')",
  ],
  "signal-layer-flood-alerts": [
    "type_id IN ('type-flood-alert', 'type-flood', 'type-flooding')",
    "(fields->>'feedSource' = 'noaa-weather' AND lower(fields->>'event') LIKE '%flood%')",
  ],
  "signal-layer-storm-alerts": [
    "type_id = 'type-severe-thunderstorm-alert'",
    "(fields->>'feedSource' = 'noaa-weather' AND lower(fields->>'event') LIKE '%thunderstorm%')",
  ],
  "signal-layer-winter-weather-alerts": [
    "type_id = 'type-winter-storm-alert'",
    "(fields->>'feedSource' = 'noaa-weather' AND (lower(fields->>'event') LIKE '%winter%' OR lower(fields->>'event') LIKE '%blizzard%' OR lower(fields->>'event') LIKE '%snow%' OR lower(fields->>'event') LIKE '%ice%'))",
  ],
  "signal-layer-tropical-cyclones": [
    "type_id = 'type-hurricane-alert'",
    "(fields->>'feedSource' = 'noaa-weather' AND (lower(fields->>'event') LIKE '%hurricane%' OR lower(fields->>'event') LIKE '%tropical%'))",
  ],
  "signal-layer-heat-alerts": [
    "type_id = 'type-heat-alert'",
    "(fields->>'feedSource' = 'noaa-weather' AND lower(fields->>'event') LIKE '%heat%')",
  ],
  "signal-layer-earthquakes": [
    "fields->>'feedSource' = 'usgs-earthquakes'",
    "category_id = 'cat-seismic-events'",
    "type_id = 'type-earthquake'",
  ],
};

const buildConditionWhere = (signal: Signal) => {
  const conditions = signal.conditions;
  const clauses: string[] = ["status = 'active'"];
  const matchClauses: string[] = [];
  const params: unknown[] = [];
  const operator = conditions.operator === "OR" ? "OR" : "AND";

  const feedLayerMatches = FEED_LAYER_MATCHES[signal.id];
  if (feedLayerMatches) {
    return {
      params,
      whereClause: `${clauses[0]} AND (${feedLayerMatches.join(" OR ")})`,
    };
  }

  const addMatch = (clause: string, value: unknown) => {
    params.push(value);
    matchClauses.push(clause.replace("?", `$${params.length}`));
  };

  if (conditions.categoryIds?.length) {
    addMatch("category_id = ANY(?)", conditions.categoryIds);
  }
  if (conditions.typeIds?.length) {
    addMatch("type_id = ANY(?)", conditions.typeIds);
  }
  if (conditions.importance?.length) {
    addMatch("importance = ANY(?)", conditions.importance);
  }
  if (conditions.minScore !== undefined) {
    addMatch("score >= ?", conditions.minScore);
  }
  if (conditions.maxScore !== undefined) {
    addMatch("score <= ?", conditions.maxScore);
  }

  if (matchClauses.length) {
    clauses.push(`(${matchClauses.join(` ${operator} `)})`);
  }

  return {
    params,
    whereClause: clauses.join(" AND "),
  };
};

export const countSightingsMatchingSignal = async (
  sql: Sql,
  signal: Signal
): Promise<number> => {
  const { whereClause, params } = buildConditionWhere(signal);
  const rows = await sql.unsafe<{ count: string }[]>(
    `SELECT COUNT(*)::text AS count FROM sightings WHERE ${whereClause}`,
    params as never[]
  );
  return Number(rows[0]?.count ?? 0);
};

export const listSightingsMatchingSignal = async (
  sql: Sql,
  signal: Signal,
  options: { limit: number; offset: number }
): Promise<Sighting[]> => {
  const { whereClause, params } = buildConditionWhere(signal);
  const rows = await sql.unsafe<SightingRow[]>(
    `
      SELECT *
      FROM sightings
      WHERE ${whereClause}
      ORDER BY hot_score DESC, created_at DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `,
    [...params, options.limit, options.offset] as never[]
  );
  return rows.map(mapSignalSightingRow);
};
