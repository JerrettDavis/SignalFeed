import { NOAAWeatherFeed } from "@/adapters/feeds/noaa-weather-feed";
import { USGSEarthquakeFeed } from "@/adapters/feeds/usgs-earthquake-feed";
import { getSightingRepository } from "@/adapters/repositories/repository-factory";
import { getSql } from "@/adapters/repositories/postgres/client";
import { systemClock } from "@/adapters/clock/system-clock";
import { ulidGenerator } from "@/adapters/id/ulid-generator";
import { buildIngestFeedData } from "@/application/use-cases/feeds/ingest-feed-data";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes max execution time

const FEED_LAYER_SIGNAL_IDS = [
  "signal-layer-weather-alerts",
  "signal-layer-tornado-alerts",
  "signal-layer-flood-alerts",
  "signal-layer-storm-alerts",
  "signal-layer-winter-weather-alerts",
  "signal-layer-tropical-cyclones",
  "signal-layer-heat-alerts",
  "signal-layer-earthquakes",
] as const;

const associateFeedSightingsWithLayerSignals = async () => {
  const sql = getSql();

  await sql`
    WITH layer_matches(signal_id, category_id, type_id) AS (
      VALUES
        ('signal-layer-weather-alerts', 'cat-weather-alerts', NULL),
        ('signal-layer-tornado-alerts', NULL, 'type-tornado-alert'),
        ('signal-layer-flood-alerts', NULL, 'type-flood-alert'),
        ('signal-layer-storm-alerts', NULL, 'type-severe-thunderstorm-alert'),
        ('signal-layer-winter-weather-alerts', NULL, 'type-winter-storm-alert'),
        ('signal-layer-tropical-cyclones', NULL, 'type-hurricane-alert'),
        ('signal-layer-heat-alerts', NULL, 'type-heat-alert'),
        ('signal-layer-earthquakes', 'cat-seismic-events', NULL)
    )
    INSERT INTO signal_sightings (id, signal_id, sighting_id, added_by, added_at)
    SELECT
      'ss-' || s.id || '-' || lm.signal_id,
      lm.signal_id,
      s.id,
      CASE
        WHEN s.category_id = 'cat-seismic-events' THEN 'system-usgs'
        ELSE 'system-noaa'
      END,
      COALESCE(s.created_at, NOW())
    FROM sightings s
    JOIN layer_matches lm
      ON (lm.category_id IS NOT NULL AND s.category_id = lm.category_id)
      OR (lm.type_id IS NOT NULL AND s.type_id = lm.type_id)
    ON CONFLICT (signal_id, sighting_id) DO NOTHING
  `;

  await sql`
    UPDATE signals
    SET sighting_count = COALESCE(counts.total, 0)
    FROM (
      SELECT signal_id, COUNT(*)::int AS total
      FROM signal_sightings
      WHERE signal_id = ANY(${[...FEED_LAYER_SIGNAL_IDS]})
      GROUP BY signal_id
    ) counts
    WHERE signals.id = counts.signal_id
  `;
};

/**
 * Vercel Cron endpoint for ingesting external feed data
 *
 * This endpoint is triggered by Vercel Cron on a schedule (every 15 minutes).
 * It fetches data from NOAA Weather and USGS Earthquake feeds and ingests them
 * into the SightSignal system.
 *
 * Authentication: CRON_SECRET environment variable must match
 *
 * Schedule: Configured in vercel.json
 */
export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET) {
      console.error("[IngestFeeds] CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      );
    }

    if (authHeader !== expectedAuth) {
      console.error("[IngestFeeds] Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Initialize dependencies
    const repository = getSightingRepository();
    const ingestFeedData = buildIngestFeedData({
      repository,
      idGenerator: ulidGenerator,
      clock: systemClock,
    });

    // Initialize feed providers
    const feeds = [
      {
        provider: new NOAAWeatherFeed(),
        systemReporterId: "system-noaa",
      },
      {
        provider: new USGSEarthquakeFeed(),
        systemReporterId: "system-usgs",
      },
    ];

    console.log(
      `[IngestFeeds] Starting ingestion for ${feeds.length} feeds at ${new Date().toISOString()}`
    );

    // Run all feeds with Promise.allSettled for graceful degradation
    const results = await Promise.allSettled(
      feeds.map(({ provider, systemReporterId }) =>
        ingestFeedData(provider, systemReporterId)
      )
    );

    // Collect results and errors
    const summary = {
      totalCreated: 0,
      totalUpdated: 0,
      totalFailed: 0,
      feedResults: [] as Array<{
        feed: string;
        status: "success" | "error";
        created?: number;
        updated?: number;
        failed?: number;
        errors?: Array<{ externalId: string; message: string }>;
        error?: string;
      }>,
    };

    results.forEach((result, index) => {
      const feedName = feeds[index].provider.name;

      if (result.status === "fulfilled") {
        const feedResult = result.value;
        summary.totalCreated += feedResult.created;
        summary.totalUpdated += feedResult.updated;
        summary.totalFailed += feedResult.failed;

        summary.feedResults.push({
          feed: feedName,
          status: "success",
          created: feedResult.created,
          updated: feedResult.updated,
          failed: feedResult.failed,
          errors:
            feedResult.errors.length > 0
              ? feedResult.errors.slice(0, 10)
              : undefined, // Include first 10 errors
        });

        console.log(
          `[IngestFeeds:${feedName}] Success: ${feedResult.created} created, ${feedResult.updated} updated, ${feedResult.failed} failed`
        );

        // Log first few errors for debugging
        if (feedResult.errors.length > 0) {
          console.log(`[IngestFeeds:${feedName}] First few errors:`);
          feedResult.errors.slice(0, 3).forEach((err) => {
            console.log(`  - ${err.externalId}: ${err.message}`);
          });
        }
      } else {
        summary.feedResults.push({
          feed: feedName,
          status: "error",
          error: result.reason?.message || "Unknown error",
        });

        console.error(`[IngestFeeds:${feedName}] Fatal error:`, result.reason);
      }
    });

    try {
      await associateFeedSightingsWithLayerSignals();
      console.log("[IngestFeeds] Feed layer signal associations refreshed");
    } catch (error) {
      console.error(
        "[IngestFeeds] Failed to refresh feed layer signal associations:",
        error
      );
    }

    const elapsedMs = Date.now() - startTime;

    console.log(
      `[IngestFeeds] Completed in ${elapsedMs}ms: ${summary.totalCreated} created, ${summary.totalUpdated} updated, ${summary.totalFailed} failed`
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      elapsedMs,
      summary,
    });
  } catch (error) {
    const elapsedMs = Date.now() - startTime;
    console.error("[IngestFeeds] Unexpected error:", error);

    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        elapsedMs,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
