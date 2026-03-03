import { NextRequest, NextResponse } from "next/server";
import { buildTrackSignalView } from "@/application/use-cases/signals/track-signal-view";
import { getSignalRepository } from "@/adapters/repositories/repository-factory";
import {
  getSignalViewSessionRepository,
  getUserPrivacySettingsRepository,
  getUserCategoryInteractionRepository,
} from "@/adapters/repositories/repository-factory";
import { systemClock } from "@/adapters/clock/system-clock";
import { cookies } from "next/headers";

/**
 * POST /api/signals/:id/view
 *
 * Track a signal view. Records analytics and updates active viewer count.
 * Respects user privacy settings for personalization tracking.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
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
    const { id: signalId } = await params;

    // Build use case
    const trackSignalView = buildTrackSignalView({
      signalRepository: getSignalRepository(),
      viewSessionRepository: getSignalViewSessionRepository(),
      userPrivacySettingsRepository: getUserPrivacySettingsRepository(),
      userCategoryInteractionRepository: getUserCategoryInteractionRepository(),
      clock: systemClock,
    });

    // Execute use case
    const result = await trackSignalView(signalId, userId);

    if (!result.ok) {
      const status = result.error.code === "signal.not_found" ? 404 : 400;
      return NextResponse.json(
        {
          error: result.error.message,
          code: result.error.code,
        },
        { status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        viewRecorded: result.value.viewRecorded,
        activeViewers: result.value.activeViewers,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error tracking signal view:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
