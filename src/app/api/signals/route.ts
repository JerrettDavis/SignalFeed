import { NextRequest, NextResponse } from "next/server";
import { buildCreateSignal } from "@/application/use-cases/signals/create-signal";
import { buildRankSignalsForUser } from "@/application/use-cases/signals/rank-signals-for-user";
import {
  getSignalRepository,
  getUserRepository,
  getUserPrivacySettingsRepository,
  getUserCategoryInteractionRepository,
  getUserSignalPreferenceRepository,
  getSignalActivitySnapshotRepository,
  getGeofenceRepository,
} from "@/adapters/repositories/repository-factory";
import { systemClock } from "@/adapters/clock/system-clock";
import { ulidGenerator } from "@/adapters/id/ulid-generator";
import { CreateSignalRequestSchema } from "@/contracts/signal";
import {
  jsonBadRequest,
  jsonCreated,
  jsonOk,
  jsonUnauthorized,
} from "@/shared/http";
import { cookies } from "next/headers";

export const runtime = "nodejs";

/**
 * GET /api/signals
 *
 * Returns ranked list of signals for the authenticated user.
 * Ranking considers:
 * - User location (if shared)
 * - User category preferences (if personalization enabled)
 * - Signal classification, popularity, and viral status
 * - User preferences (hidden, pinned, unimportant)
 *
 * Query params:
 * - lat, lng: User location for distance-based ranking
 * - includeHidden: Include hidden signals (default: false)
 */
export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const cookieStore = await cookies();
    const sessionData = cookieStore.get("session_data");

    if (!sessionData) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionData.value);
    if (new Date(session.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Session expired. Please sign in again." },
        { status: 401 }
      );
    }

    const userId = session.userId;

    // Parse query params
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const includeHidden = searchParams.get("includeHidden") === "true";

    // Parse location if provided
    let userLocation: { lat: number; lng: number } | undefined;
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        userLocation = { lat: latNum, lng: lngNum };
      }
    }

    // Build use case
    const rankSignalsForUser = buildRankSignalsForUser({
      signalRepository: getSignalRepository(),
      userRepository: getUserRepository(),
      userPrivacySettingsRepository: getUserPrivacySettingsRepository(),
      userCategoryInteractionRepository: getUserCategoryInteractionRepository(),
      userSignalPreferenceRepository: getUserSignalPreferenceRepository(),
      signalActivitySnapshotRepository: getSignalActivitySnapshotRepository(),
      geofenceRepository: getGeofenceRepository(),
    });

    // Execute use case
    const result = await rankSignalsForUser({
      userId,
      userLocation,
      includeHidden,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error.message,
          code: result.error.code,
        },
        { status: 400 }
      );
    }

    return jsonOk({ data: result.value });
  } catch (error) {
    console.error("Error ranking signals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/signals
 *
 * Create a new signal. Validates membership tier permissions.
 */
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const cookieStore = await cookies();
    const sessionData = cookieStore.get("session_data");

    if (!sessionData) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionData.value);
    if (new Date(session.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Session expired. Please sign in again." },
        { status: 401 }
      );
    }

    const userId = session.userId;

    // Parse request body
    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return jsonBadRequest({ message: "Invalid JSON payload." });
    }

    // Validate payload
    const parsed = CreateSignalRequestSchema.safeParse(payload);
    if (!parsed.success) {
      return jsonBadRequest({
        message: "Invalid payload.",
        details: parsed.error.flatten(),
      });
    }

    // Build use case with tier validation
    const createSignal = buildCreateSignal({
      repository: getSignalRepository(),
      userRepository: getUserRepository(),
      idGenerator: ulidGenerator,
      clock: systemClock,
    });

    // Execute use case
    const result = await createSignal({
      ...parsed.data,
      ownerId: userId,
    });

    if (!result.ok) {
      return jsonBadRequest({
        message: result.error.message,
        details: result.error,
      });
    }

    return jsonCreated({ data: result.value });
  } catch (error) {
    console.error("Error creating signal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
