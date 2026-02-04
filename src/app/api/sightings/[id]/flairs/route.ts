import { NextRequest, NextResponse } from "next/server";
import {
  getSightingFlairRepository,
  getFlairRepository,
  getSightingRepository,
} from "@/adapters/repositories/repository-factory";
import { assignFlairToSighting } from "@/application/use-cases/flairs/assign-flair-to-sighting";
import { suggestFlair } from "@/application/use-cases/flairs/suggest-flair";
import { removeFlairFromSighting } from "@/application/use-cases/flairs/remove-flair-from-sighting";
import type { SightingId } from "@/domain/sightings/sighting";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/sightings/[id]/flairs - Get all flairs for a sighting
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: sightingId } = await context.params;
    const sightingFlairRepository = getSightingFlairRepository();

    const flairs = await sightingFlairRepository.getFlairsForSighting(
      sightingId as SightingId
    );

    // Enrich with flair details
    const flairRepository = getFlairRepository();
    const enrichedFlairs = await Promise.all(
      flairs.map(async (sf) => {
        const flair = await flairRepository.getById(sf.flairId);
        return {
          ...sf,
          flair,
        };
      })
    );

    return NextResponse.json({ data: enrichedFlairs }, { status: 200 });
  } catch (error) {
    console.error("Error fetching sighting flairs:", error);
    return NextResponse.json(
      { error: "Failed to fetch flairs" },
      { status: 500 }
    );
  }
}

// POST /api/sightings/[id]/flairs - Assign a flair to a sighting
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: sightingId } = await context.params;
    const body = await request.json();

    const { flairId, assignmentMethod, userId, isModerator } = body;

    if (!flairId) {
      return NextResponse.json(
        { error: "flairId is required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required (authentication required)" },
        { status: 401 }
      );
    }

    const sightingFlairRepository = getSightingFlairRepository();
    const flairRepository = getFlairRepository();
    const sightingRepository = getSightingRepository();

    // Handle different assignment methods
    if (assignmentMethod === "consensus") {
      // User is suggesting a flair for community consensus
      const result = await suggestFlair(
        { sightingId, flairId, userId },
        { sightingFlairRepository, flairRepository, sightingRepository }
      );

      if (!result.ok) {
        return NextResponse.json(
          { error: result.error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          message: result.value.autoApplied
            ? "Flair applied via consensus"
            : "Flair suggestion created",
          data: result.value,
        },
        { status: 201 }
      );
    } else {
      // Direct assignment (manual or moderator)
      const result = await assignFlairToSighting(
        {
          sightingId,
          flairId,
          userId,
          isModerator: isModerator || false,
          assignmentMethod: assignmentMethod || "manual",
        },
        { sightingFlairRepository, flairRepository, sightingRepository }
      );

      if (!result.ok) {
        return NextResponse.json(
          { error: result.error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { message: "Flair assigned successfully" },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Error assigning flair:", error);
    return NextResponse.json(
      { error: "Failed to assign flair" },
      { status: 500 }
    );
  }
}

// DELETE /api/sightings/[id]/flairs - Remove a flair from a sighting
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: sightingId } = await context.params;
    const { searchParams } = new URL(request.url);
    const flairId = searchParams.get("flairId");
    const userId = searchParams.get("userId");
    const isModerator = searchParams.get("isModerator") === "true";

    if (!flairId) {
      return NextResponse.json(
        { error: "flairId is required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required (authentication required)" },
        { status: 401 }
      );
    }

    const sightingFlairRepository = getSightingFlairRepository();
    const sightingRepository = getSightingRepository();

    const result = await removeFlairFromSighting(
      { sightingId, flairId, userId, isModerator },
      { sightingFlairRepository, sightingRepository }
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Flair removed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing flair:", error);
    return NextResponse.json(
      { error: "Failed to remove flair" },
      { status: 500 }
    );
  }
}
