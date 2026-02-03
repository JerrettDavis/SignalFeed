import { NextRequest, NextResponse } from "next/server";
import { getSightingFlairRepository, getSightingRepository } from "@/adapters/repositories/repository-factory";
import { voteOnFlairSuggestion } from "@/application/use-cases/flairs/vote-on-flair-suggestion";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/flair-suggestions/[id]/vote - Vote on a flair suggestion
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: suggestionId } = await context.params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required (authentication required)" },
        { status: 401 }
      );
    }

    const sightingFlairRepository = getSightingFlairRepository();
    const sightingRepository = getSightingRepository();

    const result = await voteOnFlairSuggestion(
      { suggestionId, userId },
      { sightingFlairRepository, sightingRepository }
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        message: result.value.applied
          ? "Vote recorded and flair applied via consensus"
          : "Vote recorded",
        data: result.value,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error voting on flair suggestion:", error);
    return NextResponse.json(
      { error: "Failed to vote on suggestion" },
      { status: 500 }
    );
  }
}
