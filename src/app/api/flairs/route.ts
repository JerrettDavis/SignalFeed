import { NextRequest, NextResponse } from "next/server";
import { getFlairRepository } from "@/adapters/repositories/repository-factory";
import type { FlairType } from "@/domain/flairs/flair";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const type = searchParams.get("type");
    const includeInactive = searchParams.get("includeInactive") === "true";

    const flairRepository = getFlairRepository();

    let flairs;

    if (categoryId) {
      // Get flairs for a specific category (includes system-wide + category-specific)
      flairs = await flairRepository.getFlairsForCategory(categoryId);
    } else if (type) {
      // Get flairs by type
      flairs = await flairRepository.getFlairsByType(type as FlairType);
    } else if (includeInactive) {
      // Get all flairs including inactive
      flairs = await flairRepository.getAll();
    } else {
      // Get only active flairs
      flairs = await flairRepository.getActiveFlairs();
    }

    return NextResponse.json({ data: flairs }, { status: 200 });
  } catch (error) {
    console.error("Error fetching flairs:", error);
    return NextResponse.json(
      { error: "Failed to fetch flairs" },
      { status: 500 }
    );
  }
}
