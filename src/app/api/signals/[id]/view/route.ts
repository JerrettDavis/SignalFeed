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

const ANONYMOUS_VIEWER_COOKIE = "anonymous_signal_viewer_id";
const ANONYMOUS_VIEWER_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const parseSessionUserId = (sessionData: { value: string } | undefined) => {
  if (!sessionData) return null;

  try {
    const session = JSON.parse(sessionData.value);
    if (new Date(session.expiresAt) < new Date()) {
      return null;
    }
    return typeof session.userId === "string" ? session.userId : null;
  } catch {
    return null;
  }
};

const getAnonymousViewerId = (
  cookieStore: Awaited<ReturnType<typeof cookies>>
) => {
  const existing = cookieStore.get(ANONYMOUS_VIEWER_COOKIE)?.value;
  if (existing) {
    return { userId: existing, isNew: false };
  }

  return {
    userId: `anonymous:${crypto.randomUUID()}`,
    isNew: true,
  };
};

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
    const cookieStore = await cookies();
    const sessionData = cookieStore.get("session_data");
    const authenticatedUserId = parseSessionUserId(sessionData);
    const anonymousViewer = authenticatedUserId
      ? null
      : getAnonymousViewerId(cookieStore);
    const userId = authenticatedUserId ?? anonymousViewer?.userId;
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

    const response = NextResponse.json(
      {
        success: true,
        viewRecorded: result.value.viewRecorded,
        activeViewers: result.value.activeViewers,
      },
      { status: 200 }
    );

    if (anonymousViewer?.isNew) {
      response.cookies.set(ANONYMOUS_VIEWER_COOKIE, anonymousViewer.userId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: ANONYMOUS_VIEWER_MAX_AGE_SECONDS,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Error tracking signal view:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
