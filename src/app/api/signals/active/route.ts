import { getSignalRepository } from "@/adapters/repositories/repository-factory";
import { getSql } from "@/adapters/repositories/postgres/client";
import {
  associateFeedSightingsWithLayerSignals,
  ensureFeedLayerSignals,
} from "@/adapters/repositories/postgres/feed-layer-signals";
import { jsonOk } from "@/shared/http";

export const runtime = "nodejs";

const signalRepository = getSignalRepository();

export const GET = async (_request: Request) => {
  try {
    const sql = getSql();
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

  // TODO: Filter by visibility when that property is added to the domain model
  // For now, return all active signals

  return jsonOk({ data: signals });
};
