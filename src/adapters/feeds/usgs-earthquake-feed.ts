import type {
  FeedProvider,
  FeedItem,
  FetchOptions,
} from "@/ports/feed-provider";

/**
 * USGS Earthquake Feed Adapter
 *
 * Fetches recent earthquake data from the United States Geological Survey
 * Earthquake Hazards Program API using GeoJSON format.
 *
 * API: https://earthquake.usgs.gov/fdsnws/event/1/
 * Rate limit: No official limit (be reasonable)
 * Authentication: None required
 */

type USGSFeature = {
  id: string;
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number, number]; // [lng, lat, depth]
  };
  properties: {
    mag: number;
    place: string;
    time: number; // Unix timestamp in milliseconds
    updated: number;
    tz: number | null;
    url: string;
    detail: string;
    felt: number | null;
    cdi: number | null;
    mmi: number | null;
    alert: "green" | "yellow" | "orange" | "red" | null;
    status: string;
    tsunami: 0 | 1;
    sig: number; // Significance (0-1000)
    net: string;
    code: string;
    ids: string;
    sources: string;
    types: string;
    nst: number | null;
    dmin: number | null;
    rms: number;
    gap: number | null;
    magType: string;
    type: string;
    title: string;
    [key: string]: unknown;
  };
};

type USGSResponse = {
  type: "FeatureCollection";
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  features: USGSFeature[];
};

/**
 * Map earthquake magnitude to severity level
 */
function mapMagnitudeToSeverity(magnitude: number): FeedItem["severity"] {
  if (magnitude >= 7.0) {
    return "critical"; // Major earthquake
  }
  if (magnitude >= 6.0) {
    return "high"; // Strong earthquake
  }
  if (magnitude >= 4.0) {
    return "normal"; // Moderate earthquake
  }
  return "low"; // Light earthquake
}

/**
 * Generate human-readable description for earthquake
 */
function generateDescription(feature: USGSFeature): string {
  const mag = feature.properties.mag.toFixed(1);
  const depth = feature.geometry.coordinates[2].toFixed(1);
  const parts = [
    `Magnitude ${mag} earthquake`,
    feature.properties.place,
    `Depth: ${depth} km`,
  ];

  if (feature.properties.tsunami === 1) {
    parts.push("⚠️ Tsunami warning issued");
  }

  if (feature.properties.felt !== null && feature.properties.felt > 0) {
    parts.push(`Felt by ${feature.properties.felt} people`);
  }

  return parts.join(" • ");
}

export class USGSEarthquakeFeed implements FeedProvider {
  name = "usgs-earthquakes";
  private apiUrl = "https://earthquake.usgs.gov/fdsnws/event/1/query";

  async fetch(options?: FetchOptions): Promise<FeedItem[]> {
    try {
      const url = new URL(this.apiUrl);

      // Default parameters
      url.searchParams.set("format", "geojson");
      url.searchParams.set("orderby", "time");

      // Fetch significant earthquakes from the last 24 hours by default
      if (options?.since) {
        url.searchParams.set("starttime", options.since.toISOString());
      } else {
        // Default to last 24 hours
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        url.searchParams.set("starttime", yesterday.toISOString());
      }

      // Set minimum magnitude to 2.5 to filter out micro-earthquakes
      url.searchParams.set("minmagnitude", "2.5");

      if (options?.limit) {
        url.searchParams.set("limit", options.limit.toString());
      }

      // Geographic bounds if provided
      if (options?.bounds) {
        url.searchParams.set("minlatitude", options.bounds.south.toString());
        url.searchParams.set("maxlatitude", options.bounds.north.toString());
        url.searchParams.set("minlongitude", options.bounds.west.toString());
        url.searchParams.set("maxlongitude", options.bounds.east.toString());
      }

      const response = await fetch(url.toString(), {
        headers: {
          "User-Agent": "SightSignal/1.0 (contact@sightsignal.com)",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `USGS API error: ${response.status} ${response.statusText}`
        );
      }

      const data = (await response.json()) as USGSResponse;

      const items: FeedItem[] = data.features.map((feature) => {
        const [lng, lat, depth] = feature.geometry.coordinates;
        const magnitude = feature.properties.mag;

        return {
          externalId: `usgs-${feature.id}`,
          title: feature.properties.title,
          description: generateDescription(feature),
          location: { lat, lng },
          severity: mapMagnitudeToSeverity(magnitude),
          category: "emergency",
          typeId: "type-earthquake",
          observedAt: new Date(feature.properties.time),
          metadata: {
            magnitude,
            depth,
            place: feature.properties.place,
            tsunami: feature.properties.tsunami === 1,
            alert: feature.properties.alert,
            felt: feature.properties.felt,
            significance: feature.properties.sig,
            magType: feature.properties.magType,
          },
          sourceUrl: feature.properties.url,
        };
      });

      return items;
    } catch (error) {
      console.error("[USGSEarthquakeFeed] Error fetching earthquakes:", error);
      throw error;
    }
  }
}
