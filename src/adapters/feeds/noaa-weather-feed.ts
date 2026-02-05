import type {
  FeedProvider,
  FeedItem,
  FetchOptions,
} from "@/ports/feed-provider";

/**
 * NOAA Weather Alerts Feed Adapter
 *
 * Fetches active weather alerts from the National Weather Service API
 * using the Common Alerting Protocol (CAP) v1.2 format.
 *
 * API: https://api.weather.gov/alerts/active
 * Rate limit: ~1 request per 30 seconds (recommended)
 * Authentication: None required
 */

type NOAAFeature = {
  id: string;
  type: "Feature";
  geometry: {
    type: "Polygon" | "Point" | "MultiPolygon";
    coordinates: number[][][] | number[] | number[][][][];
  } | null;
  properties: {
    event: string;
    headline: string;
    description: string;
    severity: "Extreme" | "Severe" | "Moderate" | "Minor" | "Unknown";
    urgency: "Immediate" | "Expected" | "Future" | "Past" | "Unknown";
    certainty: "Observed" | "Likely" | "Possible" | "Unlikely" | "Unknown";
    effective: string;
    onset: string;
    expires: string;
    areaDesc: string;
    [key: string]: unknown;
  };
};

type NOAAResponse = {
  type: "FeatureCollection";
  features: NOAAFeature[];
  title: string;
  updated: string;
};

/**
 * Maps NOAA event types to SightSignal sighting type IDs
 */
const EVENT_TYPE_MAPPING: Record<string, string> = {
  "Tornado Warning": "type-tornado",
  "Tornado Watch": "type-tornado",
  "Severe Thunderstorm Warning": "type-severe-weather",
  "Severe Thunderstorm Watch": "type-severe-weather",
  "Flash Flood Warning": "type-flood",
  "Flood Warning": "type-flood",
  "Flood Watch": "type-flood",
  "Winter Storm Warning": "type-winter-storm",
  "Winter Storm Watch": "type-winter-storm",
  "Blizzard Warning": "type-winter-storm",
  "Ice Storm Warning": "type-winter-storm",
  "Hurricane Warning": "type-hurricane",
  "Hurricane Watch": "type-hurricane",
  "Tropical Storm Warning": "type-hurricane",
  "Tropical Storm Watch": "type-hurricane",
  "Excessive Heat Warning": "type-heat-advisory",
  "Excessive Heat Watch": "type-heat-advisory",
  "Heat Advisory": "type-heat-advisory",
};

/**
 * Calculate the centroid of a polygon
 */
function calculateCentroid(coordinates: number[][][]): {
  lat: number;
  lng: number;
} {
  const ring = coordinates[0]; // Use outer ring
  let latSum = 0;
  let lngSum = 0;
  let count = 0;

  for (const [lng, lat] of ring) {
    latSum += lat;
    lngSum += lng;
    count++;
  }

  return {
    lat: latSum / count,
    lng: lngSum / count,
  };
}

/**
 * Extract location from NOAA geometry
 */
function extractLocation(
  geometry: NOAAFeature["geometry"]
): { lat: number; lng: number } | null {
  if (!geometry) return null;

  if (geometry.type === "Point") {
    const coords = geometry.coordinates as number[];
    return { lat: coords[1], lng: coords[0] };
  }

  if (geometry.type === "Polygon") {
    return calculateCentroid(geometry.coordinates as number[][][]);
  }

  if (geometry.type === "MultiPolygon") {
    // Use the first polygon
    const polygons = geometry.coordinates as number[][][][];
    if (polygons.length > 0) {
      return calculateCentroid(polygons[0]);
    }
  }

  return null;
}

/**
 * Map NOAA severity + urgency to SightSignal importance level
 */
function mapSeverity(
  severity: NOAAFeature["properties"]["severity"],
  urgency: NOAAFeature["properties"]["urgency"]
): FeedItem["severity"] {
  // Critical: Extreme severity OR immediate urgency
  if (severity === "Extreme" || urgency === "Immediate") {
    return "critical";
  }

  // High: Severe severity OR expected urgency
  if (severity === "Severe" || urgency === "Expected") {
    return "high";
  }

  // Normal: Moderate severity
  if (severity === "Moderate") {
    return "normal";
  }

  // Low: Everything else
  return "low";
}

export class NOAAWeatherFeed implements FeedProvider {
  name = "noaa-weather";
  private apiUrl = "https://api.weather.gov/alerts/active";

  async fetch(options?: FetchOptions): Promise<FeedItem[]> {
    try {
      const url = new URL(this.apiUrl);

      // Add query parameters if provided
      if (options?.limit) {
        url.searchParams.set("limit", options.limit.toString());
      }

      const response = await fetch(url.toString(), {
        headers: {
          "User-Agent": "SightSignal/1.0 (contact@sightsignal.com)",
          Accept: "application/geo+json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `NOAA API error: ${response.status} ${response.statusText}`
        );
      }

      const data = (await response.json()) as NOAAResponse;

      const items: FeedItem[] = [];

      for (const feature of data.features) {
        const location = extractLocation(feature.geometry);

        // Skip alerts without location data
        if (!location) {
          continue;
        }

        // Determine type ID
        const typeId =
          EVENT_TYPE_MAPPING[feature.properties.event] || "type-weather-alert";

        // Map severity
        const severity = mapSeverity(
          feature.properties.severity,
          feature.properties.urgency
        );

        // Use onset time if available, otherwise effective time
        const observedAt = new Date(
          feature.properties.onset || feature.properties.effective
        );

        items.push({
          externalId: `noaa-${feature.id}`,
          title: feature.properties.headline || feature.properties.event,
          description: feature.properties.description,
          location,
          severity,
          category: "emergency",
          typeId,
          observedAt,
          metadata: {
            event: feature.properties.event,
            severity: feature.properties.severity,
            urgency: feature.properties.urgency,
            certainty: feature.properties.certainty,
            areaDesc: feature.properties.areaDesc,
            expires: feature.properties.expires,
          },
          sourceUrl: `https://alerts.weather.gov/cap/${feature.id}`,
        });
      }

      return items;
    } catch (error) {
      console.error("[NOAAWeatherFeed] Error fetching alerts:", error);
      throw error;
    }
  }
}
