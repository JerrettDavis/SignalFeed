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
import { jsonUnauthorized } from "@/shared/http";
import { getVerifiedSession } from "@/shared/session";
import { seedSignals } from "@/data/seed";
import type { SignalId } from "@/domain/signals/signal";

const ANONYMOUS_VIEWER_COOKIE = "anonymous_signal_viewer_id";
const ANONYMOUS_VIEWER_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

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

const buildAnonymousViewResponse = async (
  signalId: string,
  anonymousViewer: { userId: string; isNew: boolean }
) => {
  const signalRepository = getSignalRepository();
  const signal =
    (await signalRepository.getById(signalId as SignalId)) ??
    seedSignals.find((seedSignal) => seedSignal.id === signalId);

  if (!signal) {
    return NextResponse.json(
      {
        error: "Signal not found.",
        code: "signal.not_found",
      },
      { status: 404 }
    );
  }

  try {
    await signalRepository.incrementViewCount(signalId as SignalId);
  } catch (error) {
    console.warn("[Signal View] Anonymous view count update failed:", error);
  }

  const response = NextResponse.json(
    {
      success: true,
      viewRecorded: true,
      activeViewers: signal.analytics.activeViewers ?? 0,
    },
    { status: 200 }
  );

  if (anonymousViewer.isNew) {
    response.cookies.set(ANONYMOUS_VIEWER_COOKIE, anonymousViewer.userId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: ANONYMOUS_VIEWER_MAX_AGE_SECONDS,
      path: "/",
    });
  }

  return response;
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
    const session = await getVerifiedSession(cookieStore);
    const authenticatedUserId = session?.userId ?? null;
    const anonymousViewer = authenticatedUserId
      ? null
      : getAnonymousViewerId(cookieStore);
    const { id: signalId } = await params;

    if (!authenticatedUserId) {
      if (anonymousViewer) {
        return buildAnonymousViewResponse(signalId, anonymousViewer);
      }
      return jsonUnauthorized("Not authenticated");
    }

    // Build use case
    const trackSignalView = buildTrackSignalView({
      signalRepository: getSignalRepository(),
      viewSessionRepository: getSignalViewSessionRepository(),
      userPrivacySettingsRepository: getUserPrivacySettingsRepository(),
      userCategoryInteractionRepository: getUserCategoryInteractionRepository(),
      clock: systemClock,
    });

    // Execute use case
    const result = await trackSignalView(signalId, authenticatedUserId);

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

    return response;
  } catch (error) {
    console.error("Error tracking signal view:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
