import type { FeedItem } from "@/ports/feed-provider";
import type {
  NewSighting,
  SightingImportance,
} from "@/domain/sightings/sighting";

/**
 * Maps feed category names to SightSignal category IDs
 */
const CATEGORY_MAPPING: Record<string, string> = {
  emergency: "cat-emergency",
  traffic: "cat-traffic",
  community: "cat-community",
  wildlife: "cat-wildlife",
  infrastructure: "cat-infrastructure",
};

/**
 * Maps feed severity levels to sighting importance levels
 */
const SEVERITY_MAPPING: Record<FeedItem["severity"], SightingImportance> = {
  low: "low",
  normal: "normal",
  high: "high",
  critical: "critical",
};

/**
 * Transforms a FeedItem from an external source into a NewSighting
 * that can be created in the SightSignal system.
 *
 * @param item - The feed item from an external source
 * @param feedName - Name of the feed source (e.g., "noaa-weather")
 * @param systemReporterId - ID of the system user for this feed (e.g., "system-noaa")
 * @returns A NewSighting object ready for creation
 */
export function transformToSighting(
  item: FeedItem,
  feedName: string,
  systemReporterId: string
): NewSighting {
  // Map category, fallback to emergency if not found
  const categoryId = CATEGORY_MAPPING[item.category] || "cat-emergency";

  // Map severity to importance
  const importance = SEVERITY_MAPPING[item.severity];

  // Store external metadata in fields
  const fields = {
    externalId: item.externalId,
    feedSource: feedName,
    sourceUrl: item.sourceUrl || "",
    ...item.metadata,
  };

  return {
    typeId: item.typeId,
    categoryId,
    location: {
      lat: item.location.lat,
      lng: item.location.lng,
    },
    description: item.title,
    details: item.description,
    importance,
    observedAt: item.observedAt.toISOString(),
    fields,
    reporterId: systemReporterId,
  };
}

/**
 * Extract the externalId from a sighting's fields
 *
 * @param fields - The custom fields object from a sighting
 * @returns The external ID if present, otherwise null
 */
export function extractExternalId(
  fields: Record<string, unknown>
): string | null {
  if (typeof fields.externalId === "string") {
    return fields.externalId;
  }
  return null;
}
