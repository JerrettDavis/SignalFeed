import { getCommentRepository } from "@/adapters/repositories/repository-factory";
import { AddCommentVoteRequestSchema } from "@/contracts/comments/comment";
import type { CommentId, UserId } from "@/domain/comments/comment";
import {
  jsonBadRequest,
  jsonNoContent,
  jsonOk,
  jsonServerError,
} from "@/shared/http";

export const runtime = "nodejs";

const repository = getCommentRepository();

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

// POST /api/comments/[id]/vote - Add or update vote
export const POST = async (request: Request, context: RouteContext) => {
  try {
    const params = await context.params;
    const body = await request.json();

    const validationResult = AddCommentVoteRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return jsonBadRequest(
        validationResult.error.issues[0]?.message || "Invalid request"
      );
    }

    const { userId, type } = validationResult.data;

    await repository.addVote(
      params.id as CommentId,
      userId as UserId,
      type
    );

    const votes = await repository.getCommentVotes(params.id as CommentId);

    return jsonOk({ data: votes });
  } catch (error) {
    console.error("Error adding vote:", error);
    return jsonServerError("Failed to add vote");
  }
};

// DELETE /api/comments/[id]/vote?userId=xxx - Remove vote
export const DELETE = async (request: Request, context: RouteContext) => {
  try {
    const params = await context.params;
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return jsonBadRequest("userId query parameter is required");
    }

    await repository.removeVote(params.id as CommentId, userId as UserId);

    return jsonNoContent();
  } catch (error) {
    console.error("Error removing vote:", error);
    return jsonServerError("Failed to remove vote");
  }
};
