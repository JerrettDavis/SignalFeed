/**
 * External feed provider port
 *
 * This port defines the contract for external data feed adapters that
 * ingest data from third-party APIs (NOAA, USGS, iNaturalist, etc.)
 * and transform them into standardized FeedItems for ingestion.
 */

export type FeedItem = {
  /** Unique identifier from the external source (used for deduplication) */
  externalId: string;

  /** Human-readable title/summary of the event */
  title: string;

  /** Detailed description (optional) */
  description?: string;

  /** Geographic location of the event */
  location: {
    lat: number;
    lng: number;
  };

  /** Severity level mapped to sighting importance */
  severity: "low" | "normal" | "high" | "critical";

  /** Category identifier (e.g., "emergency", "wildlife", "infrastructure") */
  category: string;

  /** Sighting type identifier (e.g., "type-tornado", "type-earthquake") */
  typeId: string;

  /** When the event was observed/occurred */
  observedAt: Date;

  /** Additional metadata specific to the feed source */
  metadata: Record<string, unknown>;

  /** URL to the original source (optional) */
  sourceUrl?: string;
};

export type FetchOptions = {
  /** Fetch events since this timestamp (for incremental updates) */
  since?: Date;

  /** Maximum number of items to return */
  limit?: number;

  /** Geographic bounds (optional, for location-based feeds) */
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
};

export type FeedProvider = {
  /** Name of the feed source (e.g., "noaa-weather", "usgs-earthquakes") */
  name: string;

  /** Fetch feed items from the external source */
  fetch: (options?: FetchOptions) => Promise<FeedItem[]>;
};
