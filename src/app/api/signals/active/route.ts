import { getSignalRepository } from "@/adapters/repositories/repository-factory";
import { getSql } from "@/adapters/repositories/postgres/client";
import {
  associateFeedSightingsWithLayerSignals,
  FEED_LAYER_SIGNAL_IDS,
  ensureFeedLayerSignals,
} from "@/adapters/repositories/postgres/feed-layer-signals";
import { countSightingsMatchingSignal } from "@/adapters/repositories/postgres/signal-sighting-matches";
import { seedSignals } from "@/data/seed";
import { jsonOk } from "@/shared/http";

export const runtime = "nodejs";

const signalRepository = getSignalRepository();

export const GET = async (_request: Request) => {
  let sql: ReturnType<typeof getSql> | undefined;

  try {
    sql = getSql();
    const createdLayerSignals = await ensureFeedLayerSignals(sql);
    if (createdLayerSignals) {
      await associateFeedSightingsWithLayerSignals(sql);
    }
  } catch (error) {
    console.error(
      "[SignalsActive] Failed to ensure feed layer signals:",
      error
    );
  }

  // Get all active signals (no auth required for public signals)
  const signals = await signalRepository.list({ isActive: true });
  const seenSignalIds = new Set(signals.map((signal) => signal.id));
  const missingLayerSignals = seedSignals.filter(
    (signal) =>
      FEED_LAYER_SIGNAL_IDS.includes(
        signal.id as (typeof FEED_LAYER_SIGNAL_IDS)[number]
      ) && !seenSignalIds.has(signal.id)
  );
  const activeSignals = [...missingLayerSignals, ...signals];

  if (sql) {
    await Promise.all(
      activeSignals.map(async (signal) => {
        try {
          signal.analytics.sightingCount = await countSightingsMatchingSignal(
            sql,
            signal
          );
        } catch (error) {
          console.error(
            `[SignalsActive] Failed to count sightings for signal ${signal.id}:`,
            error
          );
        }
      })
    );
  }

  // TODO: Filter by visibility when that property is added to the domain model
  // For now, return all active signals

  return jsonOk({ data: activeSignals });
};
