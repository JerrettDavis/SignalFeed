import { getCommentRepository } from "@/adapters/repositories/repository-factory";
import { UpdateCommentRequestSchema } from "@/contracts/comments/comment";
import type { CommentId } from "@/domain/comments/comment";
import {
  jsonBadRequest,
  jsonNotFound,
  jsonNoContent,
  jsonOk,
  jsonServerError,
} from "@/shared/http";

export const runtime = "nodejs";

const repository = getCommentRepository();

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

// GET /api/comments/[id] - Get a single comment
export const GET = async (_request: Request, context: RouteContext) => {
  try {
    const params = await context.params;
    const comment = await repository.getById(params.id as CommentId);

    if (!comment) {
      return jsonNotFound("Comment not found");
    }

    return jsonOk({ data: comment });
  } catch (error) {
    console.error("Error fetching comment:", error);
    return jsonServerError("Failed to fetch comment");
  }
};

// PATCH /api/comments/[id] - Update a comment
export const PATCH = async (request: Request, context: RouteContext) => {
  try {
    const params = await context.params;
    const body = await request.json();

    const validationResult = UpdateCommentRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return jsonBadRequest(
        validationResult.error.issues[0]?.message || "Invalid request"
      );
    }

    const updatedComment = await repository.update(
      params.id as CommentId,
      validationResult.data
    );

    if (!updatedComment) {
      return jsonNotFound("Comment not found");
    }

    return jsonOk({ data: updatedComment });
  } catch (error) {
    console.error("Error updating comment:", error);
    return jsonServerError("Failed to update comment");
  }
};

// DELETE /api/comments/[id] - Delete a comment
export const DELETE = async (_request: Request, context: RouteContext) => {
  try {
    const params = await context.params;
    const deleted = await repository.delete(params.id as CommentId);

    if (!deleted) {
      return jsonNotFound("Comment not found");
    }

    return jsonNoContent();
  } catch (error) {
    console.error("Error deleting comment:", error);
    return jsonServerError("Failed to delete comment");
  }
};
