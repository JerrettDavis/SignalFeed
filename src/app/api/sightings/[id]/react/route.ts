import { buildAddSightingReaction } from "@/application/use-cases/sightings/add-sighting-reaction";
import { buildRemoveSightingReaction } from "@/application/use-cases/sightings/remove-sighting-reaction";
import {
  getSightingRepository,
  getSightingReactionRepository,
  getReputationRepository,
} from "@/adapters/repositories/repository-factory";
import { jsonOk, jsonBadRequest, jsonUnauthorized } from "@/shared/http";
import { z } from "zod";

export const runtime = "nodejs";

const sightingRepository = getSightingRepository();
const reactionRepository = getSightingReactionRepository();
const reputationRepository = getReputationRepository();

const addSightingReaction = buildAddSightingReaction({
  sightingRepository,
  reactionRepository,
  reputationRepository,
});

const removeSightingReaction = buildRemoveSightingReaction({
  sightingRepository,
  reactionRepository,
});

// Placeholder for auth - will be implemented later
const getUserIdFromSession = (): string | null => {
  // TODO: Implement proper auth
  return "placeholder-user-id";
};

const ReactionPayloadSchema = z.object({
  type: z.enum(["upvote", "downvote", "confirmed", "disputed", "spam"]),
});

export const POST = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const userId = getUserIdFromSession();
  if (!userId) {
    return jsonUnauthorized("Authentication required");
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonBadRequest({ message: "Invalid JSON payload." });
  }

  const parsed = ReactionPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonBadRequest({
      message: "Invalid payload.",
      details: parsed.error.flatten(),
    });
  }

  const result = await addSightingReaction(id, userId, parsed.data.type);
  if (!result.ok) {
    return jsonBadRequest({
      message: result.error.message,
      details: result.error,
    });
  }

  return jsonOk({ data: { success: true } });
};

export const DELETE = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const userId = getUserIdFromSession();
  if (!userId) {
    return jsonUnauthorized("Authentication required");
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type");

  if (!type) {
    return jsonBadRequest({ message: "Missing type query parameter." });
  }

  const typeValidation = z
    .enum(["upvote", "downvote", "confirmed", "disputed", "spam"])
    .safeParse(type);

  if (!typeValidation.success) {
    return jsonBadRequest({
      message: "Invalid reaction type.",
      details: typeValidation.error.flatten(),
    });
  }

  await removeSightingReaction(id, userId, typeValidation.data);
  return jsonOk({ data: { success: true } });
};
