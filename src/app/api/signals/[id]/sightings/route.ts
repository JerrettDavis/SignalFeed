/**
 * GET /api/signals/[id]/sightings
 *
 * Get all sightings in a signal (like viewing posts in a subreddit).
 */

import { NextRequest } from "next/server";
import { jsonOk, jsonNotFound, jsonServerError } from "@/shared/http";
import { getSignalRepository } from "@/adapters/repositories/repository-factory";
import { getSql } from "@/adapters/repositories/postgres/client";
import {
  countSightingsMatchingSignal,
  listSightingsMatchingSignal,
  mapSignalSightingRow,
  type SightingRow,
} from "@/adapters/repositories/postgres/signal-sighting-matches";
import { seedSignals } from "@/data/seed";
import type { SignalId } from "@/domain/signals/signal";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: signalId } = await params;

    // Verify signal exists
    const signalRepo = getSignalRepository();
    const signal =
      (await signalRepo.getById(signalId as SignalId)) ??
      seedSignals.find((seedSignal) => seedSignal.id === signalId);

    if (!signal) {
      return jsonNotFound("Signal not found");
    }

    // Get pagination params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const sql = getSql();

    console.log(
      `[Signal Sightings] Fetching sightings for signal ${signalId} (limit: ${limit}, offset: ${offset})`
    );

    const associationCountResult = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text as count
      FROM signal_sightings
      WHERE signal_id = ${signalId}
    `;
    const associationCount = parseInt(
      associationCountResult[0]?.count ?? "0",
      10
    );

    // Fetch sightings with a single JOIN query instead of N+1 queries
    const sightings =
      associationCount > 0
        ? (
            await sql<SightingRow[]>`
              SELECT s.*
              FROM sightings s
              INNER JOIN signal_sightings ss ON s.id = ss.sighting_id
              WHERE ss.signal_id = ${signalId}
              ORDER BY
                ss.is_pinned DESC,
                COALESCE(ss.pin_order, 999999) ASC,
                ss.added_at DESC
              LIMIT ${limit}
              OFFSET ${offset}
            `
          ).map(mapSignalSightingRow)
        : await listSightingsMatchingSignal(sql, signal, { limit, offset });

    const total =
      associationCount > 0
        ? associationCount
        : await countSightingsMatchingSignal(sql, signal);

    console.log(
      `[Signal Sightings] Fetched ${sightings.length} sightings for signal ${signalId} (total: ${total})`
    );

    return jsonOk({
      data: {
        sightings,
        signal: {
          id: signal.id,
          name: signal.name,
          description: signal.description,
        },
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    });
  } catch (error) {
    console.error("[Signal Sightings] Error:", error);
    return jsonServerError("Failed to fetch sightings");
  }
}
