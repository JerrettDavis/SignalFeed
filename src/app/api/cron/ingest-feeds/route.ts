import { NOAAWeatherFeed } from "@/adapters/feeds/noaa-weather-feed";
import { USGSEarthquakeFeed } from "@/adapters/feeds/usgs-earthquake-feed";
import { getSightingRepository } from "@/adapters/repositories/repository-factory";
import { systemClock } from "@/adapters/clock/system-clock";
import { ulidGenerator } from "@/adapters/id/ulid-generator";
import { buildIngestFeedData } from "@/application/use-cases/feeds/ingest-feed-data";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes max execution time

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
        });

        console.log(
          `[IngestFeeds:${feedName}] Success: ${feedResult.created} created, ${feedResult.updated} updated, ${feedResult.failed} failed`
        );
      } else {
        summary.feedResults.push({
          feed: feedName,
          status: "error",
          error: result.reason?.message || "Unknown error",
        });

        console.error(`[IngestFeeds:${feedName}] Fatal error:`, result.reason);
      }
    });

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
