/**
 * GET /api/signals/[id]/sightings
 *
 * Get all sightings in a signal (like viewing posts in a subreddit).
 */

import { NextRequest } from "next/server";
import { jsonOk, jsonNotFound, jsonServerError } from "@/shared/http";
import {
  getSightingRepository,
  getSignalRepository,
} from "@/adapters/repositories/repository-factory";
import { getSql } from "@/adapters/repositories/postgres/client";
import {
  countSightingsMatchingSignal,
  listSightingsMatchingSignal,
  mapSignalSightingRow,
  type SightingRow,
} from "@/adapters/repositories/postgres/signal-sighting-matches";
import { seedSignals } from "@/data/seed";
import type { Signal, SignalId } from "@/domain/signals/signal";
import type { SightingFilters } from "@/ports/sighting-repository";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const signalFilters = (signal: Signal): SightingFilters => ({
  categoryIds: signal.conditions.categoryIds as SightingFilters["categoryIds"],
  typeIds: signal.conditions.typeIds as SightingFilters["typeIds"],
  status: "active",
});

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

    let sql: ReturnType<typeof getSql> | null = null;
    try {
      sql = getSql();
    } catch {
      sql = null;
    }

    console.log(
      `[Signal Sightings] Fetching sightings for signal ${signalId} (limit: ${limit}, offset: ${offset})`
    );

    if (!sql) {
      const repository = getSightingRepository();
      const allMatches = await repository.list(signalFilters(signal));
      const sightings = allMatches.slice(offset, offset + limit);

      return jsonOk({
        data: {
          sightings,
          signal: {
            id: signal.id,
            name: signal.name,
            description: signal.description,
          },
          pagination: {
            total: allMatches.length,
            limit,
            offset,
            hasMore: offset + limit < allMatches.length,
          },
        },
      });
    }

    const associationCountResult = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text as count
      FROM signal_sightings
      WHERE signal_id = ${signalId}
    `;
    const associationCount = parseInt(
      associationCountResult[0]?.count ?? "0",
      10
    );

    const matchingCount = await countSightingsMatchingSignal(sql, signal);
    const useAssociations =
      associationCount > 0 && associationCount >= matchingCount;

    // Fetch sightings with a single JOIN query when explicit associations are current.
    // Otherwise resolve the signal as a live layer from its taxonomy conditions.
    const sightings = useAssociations
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

    const total = useAssociations ? associationCount : matchingCount;

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
