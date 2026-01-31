import { getCommentRepository } from "@/adapters/repositories/repository-factory";
import {
  CreateCommentRequestSchema,
  type CreateCommentRequest,
} from "@/contracts/comments/comment";
import type { SightingId } from "@/domain/comments/comment";
import {
  jsonBadRequest,
  jsonCreated,
  jsonOk,
  jsonServerError,
} from "@/shared/http";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const repository = getCommentRepository();

// GET /api/comments?sightingId=xxx - Get all comments for a sighting
export const GET = async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sightingId = searchParams.get("sightingId");

    if (!sightingId) {
      return jsonBadRequest("sightingId query parameter is required");
    }

    const comments = await repository.getBySightingId(sightingId as SightingId);
    const count = await repository.countBySightingId(sightingId as SightingId);

    return jsonOk({
      data: comments,
      meta: { total: count },
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return jsonServerError("Failed to fetch comments");
  }
};

// POST /api/comments - Create a new comment
export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const validationResult = CreateCommentRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return jsonBadRequest(
        validationResult.error.issues[0]?.message || "Invalid request"
      );
    }

    const data: CreateCommentRequest = validationResult.data;
    const comment = await repository.create(data);

    return jsonCreated({ data: comment });
  } catch (error) {
    console.error("Error creating comment:", error);
    return jsonServerError("Failed to create comment");
  }
};
