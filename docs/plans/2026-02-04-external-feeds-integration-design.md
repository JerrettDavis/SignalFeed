# External Data Feeds Integration Design

**Date:** 2026-02-04
**Status:** Approved
**Authors:** Architecture Team

## Overview

Integration of external data feeds (NOAA Weather Alerts, USGS Earthquakes, and future wildlife/aircraft tracking) into SignalFeed to populate the platform with real-time, authoritative data. Uses a hybrid approach with Vercel Cron Jobs for frequent feeds and GitHub Actions for rate-limited feeds.

## Goals

- Ingest real-time weather alerts and earthquake data automatically
- Transform external data into SignalFeed sightings
- Maintain clean architecture with port-adapter pattern
- Support future feeds (iNaturalist, OpenSky ADS-B) without major refactoring
- Stay within Vercel free tier limits
- Provide optional failure notifications

## Non-Goals

- Real-time streaming (polling every 15 minutes is sufficient)
- Historical data backfill (start from "now")
- Feed data editing by users (system-generated sightings are read-only for reporters)
- Paid API services

## Phase 1: NOAA Weather + USGS Earthquakes (Vercel Cron)

### Selected APIs

| Feed                        | Cost            | Rate Limit | Data                                               |
| --------------------------- | --------------- | ---------- | -------------------------------------------------- |
| **NOAA/NWS Weather Alerts** | Free, no key    | ~1 req/30s | Watches, warnings, advisories (CAP v1.2)           |
| **USGS Earthquake API**     | Free, unlimited | None       | Global earthquakes with magnitude, depth, location |

**Why these first:**

- Completely free with no API keys
- Reliable government data sources
- Natural fit for emergency/infrastructure categories
- No rate limit concerns

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Vercel Cron (every 15 minutes)                              │
│ GET /api/cron/ingest-feeds                                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ Ingest Feed Data Use Case                                   │
│ - Fetch items from FeedProvider                             │
│ - Transform to Sighting entities                            │
│ - Check for duplicates (by externalId)                      │
│ - Create or update sightings                                │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ SightingRepository (existing)                               │
│ - findByExternalId() [NEW METHOD]                           │
│ - create() / update()                                       │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
src/
├── ports/
│   └── feed-provider.ts              # FeedProvider interface
├── adapters/
│   └── feeds/
│       ├── noaa-weather-feed.ts      # NOAA implementation
│       ├── usgs-earthquake-feed.ts   # USGS implementation
│       └── feed-factory.ts           # Provider selection
├── application/
│   └── use-cases/
│       └── feeds/
│           ├── ingest-feed-data.ts       # Core ingestion
│           └── transform-to-sighting.ts  # Feed → Sighting
└── app/
    └── api/
        └── cron/
            └── ingest-feeds/
                └── route.ts          # Vercel Cron endpoint
```

## Feed Provider Port

```typescript
// src/ports/feed-provider.ts
export type FeedItem = {
  externalId: string; // Unique ID from source (e.g., "urn:oid:...")
  title: string; // Brief description
  description?: string; // Full details
  location: { lat: number; lng: number };
  severity: "low" | "normal" | "high" | "critical";
  category: string; // Maps to categories table
  typeId: string; // Maps to sighting_types table
  observedAt: Date;
  metadata: Record<string, unknown>; // Feed-specific data
  sourceUrl?: string; // Link to original
};

export interface FeedProvider {
  name: string;
  fetch(options?: FetchOptions): Promise<FeedItem[]>;
}

export type FetchOptions = {
  since?: Date; // Only fetch items after this
  bounds?: BoundingBox; // Optional geographic filter
};
```

## NOAA Weather Feed Adapter

**Endpoint:** `https://api.weather.gov/alerts/active?status=actual`

**Response Format:** CAP (Common Alerting Protocol) v1.2 in GeoJSON

**Mapping:**

```typescript
// src/adapters/feeds/noaa-weather-feed.ts
export class NOAAWeatherFeed implements FeedProvider {
  name = "noaa-weather";

  async fetch(): Promise<FeedItem[]> {
    const response = await fetch(
      "https://api.weather.gov/alerts/active?status=actual"
    );
    const data = await response.json();

    return data.features.map((feature) => ({
      externalId: feature.properties.id,
      title: feature.properties.event,
      description: feature.properties.description,
      location: calculateCentroid(feature.geometry), // Polygon → Point
      severity: mapSeverity(
        feature.properties.severity,
        feature.properties.urgency
      ),
      category: "cat-emergency",
      typeId: mapEventToType(feature.properties.event),
      observedAt: new Date(feature.properties.onset || feature.properties.sent),
      metadata: {
        urgency: feature.properties.urgency,
        certainty: feature.properties.certainty,
        expires: feature.properties.expires,
        areaDesc: feature.properties.areaDesc,
      },
      sourceUrl: feature.properties.url,
    }));
  }
}

// Event → Type mapping
const mapEventToType = (event: string): string => {
  const mapping: Record<string, string> = {
    "Tornado Warning": "type-tornado",
    "Severe Thunderstorm Warning": "type-severe-weather",
    "Flash Flood Warning": "type-flood",
    "Winter Storm Warning": "type-winter-storm",
    "Hurricane Warning": "type-hurricane",
    "Heat Advisory": "type-heat-advisory",
    // Fallback for unmapped events
  };
  return mapping[event] || "type-weather-alert";
};

// NOAA severity + urgency → SignalFeed importance
const mapSeverity = (severity: string, urgency: string): string => {
  if (severity === "Extreme" && urgency === "Immediate") return "critical";
  if (severity === "Severe" || urgency === "Immediate") return "high";
  if (severity === "Moderate") return "normal";
  return "low";
};

// Polygon centroid calculation (NOAA provides polygons, not points)
const calculateCentroid = (geometry: GeoJsonPolygon) => {
  const coords = geometry.coordinates[0];
  const sum = coords.reduce(
    (acc, [lng, lat]) => ({
      lat: acc.lat + lat,
      lng: acc.lng + lng,
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / coords.length,
    lng: sum.lng / coords.length,
  };
};
```

## USGS Earthquake Feed Adapter

**Endpoint:** `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson`

**Response Format:** GeoJSON FeatureCollection

**Mapping:**

```typescript
// src/adapters/feeds/usgs-earthquake-feed.ts
export class USGSEarthquakeFeed implements FeedProvider {
  name = "usgs-earthquake";

  async fetch(): Promise<FeedItem[]> {
    const response = await fetch(
      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson"
    );
    const data = await response.json();

    return data.features.map((feature) => ({
      externalId: feature.id,
      title: feature.properties.title, // "M 4.5 - 23km NW of Fairbanks, Alaska"
      description: `Magnitude ${feature.properties.mag} earthquake ${feature.properties.place}`,
      location: {
        lng: feature.geometry.coordinates[0],
        lat: feature.geometry.coordinates[1],
      },
      severity: mapMagnitudeToSeverity(feature.properties.mag),
      category: "cat-emergency",
      typeId: "type-earthquake",
      observedAt: new Date(feature.properties.time),
      metadata: {
        magnitude: feature.properties.mag,
        depth: feature.geometry.coordinates[2],
        magType: feature.properties.magType,
        tsunami: feature.properties.tsunami,
        felt: feature.properties.felt,
      },
      sourceUrl: feature.properties.url,
    }));
  }
}

// Magnitude → Importance mapping
const mapMagnitudeToSeverity = (magnitude: number): string => {
  if (magnitude >= 7.0) return "critical"; // Major earthquake
  if (magnitude >= 5.0) return "high"; // Moderate earthquake
  if (magnitude >= 3.0) return "normal"; // Minor earthquake
  return "low"; // Micro earthquake
};
```

## Ingestion Use Case

```typescript
// src/application/use-cases/feeds/ingest-feed-data.ts
export type IngestResult = {
  created: number;
  updated: number;
  failed: number;
  errors: Array<{ externalId: string; error: string }>;
};

export const ingestFeedData = async (
  feedProvider: FeedProvider,
  sightingRepository: SightingRepository
): Promise<IngestResult> => {
  const results: IngestResult = {
    created: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };

  try {
    const items = await feedProvider.fetch();

    for (const item of items) {
      try {
        const sighting = transformToSighting(item, feedProvider.name);

        // Check for existing sighting by external ID
        const existing = await sightingRepository.findByExternalId(
          item.externalId
        );

        if (existing) {
          // Update existing sighting with new data
          await sightingRepository.update({
            ...existing,
            ...sighting,
            id: existing.id,
            createdAt: existing.createdAt, // Preserve original
            updatedAt: new Date().toISOString(),
          });
          results.updated++;
        } else {
          // Create new sighting
          await sightingRepository.create(sighting);
          results.created++;
        }
      } catch (itemError) {
        console.error(`Failed to process item ${item.externalId}:`, itemError);
        results.failed++;
        results.errors.push({
          externalId: item.externalId,
          error:
            itemError instanceof Error ? itemError.message : "Unknown error",
        });
      }
    }
  } catch (fetchError) {
    console.error(`Feed fetch failed for ${feedProvider.name}:`, fetchError);
    throw new Error(`Feed ingestion failed: ${fetchError}`);
  }

  return results;
};
```

## Transform Feed Item to Sighting

```typescript
// src/application/use-cases/feeds/transform-to-sighting.ts
export const transformToSighting = (
  item: FeedItem,
  feedProvider: string
): Sighting => {
  return {
    id: generateId("sighting"),
    reporterId: `system-${feedProvider}`,
    typeId: item.typeId,
    categoryId: item.category,
    description: item.title,
    details: item.description,
    location: item.location,
    status: "active",
    importance: item.severity,
    score: calculateInitialScore(item),
    observedAt: item.observedAt.toISOString(),
    createdAt: new Date().toISOString(),
    fields: {
      feedSource: feedProvider,
      externalId: item.externalId,
      sourceUrl: item.sourceUrl,
      feedMetadata: item.metadata,
    },
  };
};

const calculateInitialScore = (item: FeedItem): number => {
  // Base score on severity
  const severityScores = {
    low: 60,
    normal: 75,
    high: 90,
    critical: 100,
  };
  return severityScores[item.severity];
};
```

## Deduplication Strategy

Feed items may appear multiple times (updates, ongoing events). We deduplicate using the external ID stored in the sighting's `fields` JSON column.

**Key:**

```json
{
  "feedSource": "noaa-weather",
  "externalId": "urn:oid:2.49.0.1.840.0.123456",
  "sourceUrl": "https://api.weather.gov/alerts/...",
  "feedMetadata": {
    /* raw feed data */
  }
}
```

**New Repository Method:**

```typescript
// src/ports/sighting-repository.ts
export interface SightingRepository {
  // ... existing methods
  findByExternalId(externalId: string): Promise<Sighting | null>;
}

// Implementation (Postgres)
async findByExternalId(externalId: string): Promise<Sighting | null> {
  const result = await this.db.query(
    `SELECT * FROM sightings WHERE fields->>'externalId' = $1 LIMIT 1`,
    [externalId]
  );
  return result.rows[0] ? mapRowToSighting(result.rows[0]) : null;
}
```

**Update Logic:**

- If external ID exists → **Update** sighting (merge new data, preserve id/createdAt)
- If external ID is new → **Create** sighting

This keeps data fresh as conditions change (e.g., weather warning upgraded from "Advisory" to "Warning").

## System Reporter Accounts

Create system users for feeds:

```sql
-- Migration: db/migrations/012_add_feed_system_users.sql
INSERT INTO users (id, email, username, role, status, created_at, updated_at)
VALUES
  ('system-noaa', 'feeds@signalfeed.system', 'NOAA Weather', 'user', 'active', NOW(), NOW()),
  ('system-usgs', 'feeds@signalfeed.system', 'USGS Earthquakes', 'user', 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
```

**Benefits:**

- Feed sightings have proper `reporter_id`
- Can filter/query by system vs user-generated sightings
- Future: Display "Verified by NOAA" badge on UI

## Vercel Cron Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/ingest-feeds",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

**Schedule:** Every 15 minutes (96 executions/day, within free tier limit of 100/day)

**Cron Endpoint:**

```typescript
// src/app/api/cron/ingest-feeds/route.ts
import { NextRequest } from "next/server";
import { NOAAWeatherFeed } from "@/adapters/feeds/noaa-weather-feed";
import { USGSEarthquakeFeed } from "@/adapters/feeds/usgs-earthquake-feed";
import { ingestFeedData } from "@/application/use-cases/feeds/ingest-feed-data";
import { getSightingRepository } from "@/adapters/repositories/repository-factory";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const repository = getSightingRepository();

  // Run ingestion for all feeds (independent failures)
  const results = await Promise.allSettled([
    ingestFeedData(new NOAAWeatherFeed(), repository),
    ingestFeedData(new USGSEarthquakeFeed(), repository),
  ]);

  // Log results
  results.forEach((result, index) => {
    const feedName = index === 0 ? "NOAA" : "USGS";
    if (result.status === "fulfilled") {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          event: "feed_ingestion_success",
          feed: feedName,
          ...result.value,
        })
      );
    } else {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          event: "feed_ingestion_failure",
          feed: feedName,
          error: result.reason.message,
        })
      );
    }
  });

  return Response.json({
    success: true,
    results: results.map((r, i) => ({
      feed: i === 0 ? "NOAA" : "USGS",
      status: r.status,
      data: r.status === "fulfilled" ? r.value : null,
      error: r.status === "rejected" ? r.reason.message : null,
    })),
  });
}
```

## New Sighting Types

Add feed-specific types to taxonomy:

```sql
-- Migration: db/migrations/013_add_feed_sighting_types.sql
INSERT INTO sighting_types (id, category_id, subcategory_id, label, icon)
VALUES
  ('type-tornado', 'cat-emergency', 'subcat-emergency', 'Tornado', '🌪️'),
  ('type-flood', 'cat-emergency', 'subcat-emergency', 'Flood', '🌊'),
  ('type-severe-weather', 'cat-emergency', 'subcat-emergency', 'Severe Weather', '⛈️'),
  ('type-earthquake', 'cat-emergency', 'subcat-emergency', 'Earthquake', '🌍'),
  ('type-winter-storm', 'cat-emergency', 'subcat-emergency', 'Winter Storm', '❄️'),
  ('type-hurricane', 'cat-emergency', 'subcat-emergency', 'Hurricane', '🌀'),
  ('type-heat-advisory', 'cat-infrastructure', 'subcat-infrastructure', 'Heat Advisory', '🌡️'),
  ('type-weather-alert', 'cat-emergency', 'subcat-emergency', 'Weather Alert', '⚠️')
ON CONFLICT (id) DO NOTHING;
```

## Error Handling

### Graceful Degradation

- **Individual item failures:** Log error, increment `failed` counter, continue batch
- **Feed fetch failures:** Log error, throw exception, don't block other feeds
- **Promise.allSettled:** If NOAA fails, USGS still runs

### Structured Logging

```typescript
const logFeedIngestion = (provider: string, results: IngestResult) => {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      event: "feed_ingestion",
      provider,
      created: results.created,
      updated: results.updated,
      failed: results.failed,
      duration_ms: results.duration,
    })
  );
};
```

**Vercel Logs:** All console output appears in Vercel Dashboard → Functions tab.

### Optional Notifications

Configurable failure notifications (email, Slack) via environment variables:

```typescript
// src/ports/notification-provider.ts
export interface NotificationProvider {
  send(message: NotificationMessage): Promise<void>;
}

export type NotificationMessage = {
  severity: "info" | "warning" | "error";
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
};
```

**Environment Variables (Optional):**

```bash
ENABLE_FEED_NOTIFICATIONS=true
ADMIN_EMAIL=admin@example.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

**Implementation:** Skip notification if env vars not set (silent mode by default).

## Phase 2: Wildlife & Aircraft Feeds (GitHub Actions)

### Selected APIs

| Feed                        | Cost | Rate Limit                               | Data                                                          |
| --------------------------- | ---- | ---------------------------------------- | ------------------------------------------------------------- |
| **iNaturalist**             | Free | 1 req/sec, 10k/day                       | All wildlife observations (mammals, birds, reptiles, insects) |
| **OpenSky Network (ADS-B)** | Free | 4k credits/day (8k if contributing data) | Real-time flight positions, altitude, velocity                |

### Why GitHub Actions?

- **Rate limits:** iNaturalist/OpenSky have stricter limits than NOAA/USGS
- **Flexibility:** Can batch process large datasets, complex retry logic
- **Cost:** Free for public repos, 2000 min/month for private
- **Logs:** Visible in GitHub Actions tab, easier debugging

### Webhook Endpoint

```typescript
// src/app/api/webhooks/external-feed/route.ts
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const secret = request.headers.get("x-webhook-secret");
  if (secret !== process.env.WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { provider, items } = await request.json();

  // Validate provider
  const feedProvider = getFeedProvider(provider);
  if (!feedProvider) {
    return new Response("Invalid provider", { status: 400 });
  }

  // Process pre-fetched items
  const repository = getSightingRepository();
  const results = await ingestFeedItems(items, feedProvider, repository);

  return Response.json({ success: true, results });
}
```

### GitHub Actions Workflow (Example: iNaturalist)

```yaml
# .github/workflows/ingest-wildlife-feed.yml
name: Ingest Wildlife Observations
on:
  schedule:
    - cron: "0 */6 * * *" # Every 6 hours
  workflow_dispatch: # Manual trigger

jobs:
  ingest:
    runs-on: ubuntu-latest
    steps:
      - name: Fetch iNaturalist observations
        run: |
          curl "https://api.inaturalist.org/v1/observations?quality_grade=research&per_page=200" \
            -H "Accept: application/json" \
            -o observations.json

      - name: Send to webhook
        env:
          WEBHOOK_SECRET: ${{ secrets.WEBHOOK_SECRET }}
          VERCEL_URL: ${{ secrets.VERCEL_URL }}
        run: |
          curl -X POST "$VERCEL_URL/api/webhooks/external-feed" \
            -H "x-webhook-secret: $WEBHOOK_SECRET" \
            -H "Content-Type: application/json" \
            -d @observations.json
```

**Advantages over Vercel Cron:**

- Can run longer than 10-60 seconds (Vercel function timeout)
- Batch processing of large datasets
- Better error handling and retries
- Doesn't count against Vercel execution limits

## Testing Strategy

### Unit Tests

```typescript
// src/adapters/feeds/__tests__/noaa-weather-feed.test.ts
describe("NOAAWeatherFeed", () => {
  it("should fetch and parse active alerts", async () => {
    const feed = new NOAAWeatherFeed();
    const items = await feed.fetch();

    expect(items).toBeInstanceOf(Array);
    items.forEach((item) => {
      expect(item).toHaveProperty("externalId");
      expect(item.location.lat).toBeGreaterThan(-90);
      expect(item.location.lat).toBeLessThan(90);
    });
  });

  it("should map tornado warning to critical severity", () => {
    const alert = {
      event: "Tornado Warning",
      severity: "Extreme",
      urgency: "Immediate",
    };
    const severity = mapSeverityToImportance(alert.severity, alert.urgency);
    expect(severity).toBe("critical");
  });
});
```

### Integration Tests

```typescript
// src/application/use-cases/feeds/__tests__/ingest-feed-data.test.ts
describe("ingestFeedData", () => {
  it("should create new sightings from feed items", async () => {
    const mockProvider = {
      name: "test-feed",
      fetch: vi.fn().mockResolvedValue([mockFeedItem]),
    };
    const mockRepo = createMockSightingRepository();

    const results = await ingestFeedData(mockProvider, mockRepo);

    expect(results.created).toBe(1);
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterId: "system-test-feed",
        fields: expect.objectContaining({ feedSource: "test-feed" }),
      })
    );
  });

  it("should update existing sightings", async () => {
    const mockRepo = createMockSightingRepository();
    mockRepo.findByExternalId.mockResolvedValue(existingSighting);

    const results = await ingestFeedData(mockProvider, mockRepo);

    expect(results.updated).toBe(1);
    expect(mockRepo.update).toHaveBeenCalled();
  });
});
```

## Deployment Checklist

### 1. Database Migrations

```bash
# Run migrations
npm run db:migrate

# Or manually:
psql $POSTGRES_URL < db/migrations/012_add_feed_system_users.sql
psql $POSTGRES_URL < db/migrations/013_add_feed_sighting_types.sql
```

### 2. Environment Variables

**Required:**

```bash
CRON_SECRET=<generate-random-32-char-secret>
```

**Optional (Phase 2):**

```bash
WEBHOOK_SECRET=<generate-random-32-char-secret>
ENABLE_FEED_NOTIFICATIONS=false
ADMIN_EMAIL=
SLACK_WEBHOOK_URL=
```

**Add to Vercel:**

```bash
vercel env add CRON_SECRET production
```

### 3. Deploy Vercel Configuration

```bash
# Deploy with cron config
vercel deploy --prod
```

### 4. Verify Deployment

- Check Vercel Dashboard → Settings → Cron Jobs
- Verify `/api/cron/ingest-feeds` appears
- Wait for first execution (or trigger manually)
- Check Vercel Dashboard → Functions → Logs
- Query database: `SELECT * FROM sightings WHERE reporter_id LIKE 'system-%'`

### 5. Monitor First Week

- Check feed ingestion logs daily
- Verify sightings appear on map
- Monitor Vercel function execution times
- Watch for rate limit errors

## Success Metrics

- **Phase 1 Complete:** NOAA + USGS feeds running every 15 minutes
- **Sighting Volume:** 50-200 new sightings per day (weather + earthquakes)
- **Uptime:** 99%+ successful cron executions
- **Latency:** Feed data appears within 15 minutes of issuance
- **User Engagement:** Users subscribe to weather/earthquake signals

## Future Enhancements

### Phase 3: Additional Feeds

- **eBird API** - Bird sightings (requires API key)
- **Public transit APIs** - Real-time delays, service alerts
- **Traffic incident APIs** - If free options become available

### Feed Management UI

- Admin page to enable/disable feeds
- View feed status, last run time, error rates
- Manual trigger for debugging

### Feed Customization

- Geographic bounding boxes per feed
- Minimum severity filters
- Custom type mappings

### Performance Optimizations

- Batch insert for multiple sightings
- Caching of feed responses (short TTL)
- Parallel feed fetching with Promise.all

## Risk Mitigation

| Risk                | Mitigation                                                       |
| ------------------- | ---------------------------------------------------------------- |
| **API rate limits** | Use allSettled for independent execution, monitor logs           |
| **Feed downtime**   | Graceful degradation, log errors, continue other feeds           |
| **Bad data**        | Validation in transformToSighting, catch and log errors          |
| **Vercel limits**   | 15-min schedule stays under 100/day, Phase 2 uses GitHub Actions |
| **Database load**   | Batch operations, index on fields->>'externalId'                 |

## References

- [NOAA Weather Alerts API](https://www.weather.gov/documentation/services-web-api)
- [USGS Earthquake API](https://earthquake.usgs.gov/fdsnws/event/1/)
- [iNaturalist API](https://api.inaturalist.org/v1/docs/)
- [OpenSky Network API](https://openskynetwork.github.io/opensky-api/)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [GitHub Actions Scheduled Workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
