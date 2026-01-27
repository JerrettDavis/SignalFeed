import { requireAuth } from "@/shared/auth-helpers";
import { buildGetUserReputation } from "@/application/use-cases/reputation/get-user-reputation";
import { buildAddReputationEvent } from "@/application/use-cases/reputation/add-reputation-event";
import { getReputationRepository } from "@/adapters/repositories/repository-factory";
import { jsonOk, jsonBadRequest } from "@/shared/http";
import { ReputationReason } from "@/domain/reputation/reputation";

export const runtime = "nodejs";

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) => {
  await requireAuth();

  const { userId } = await params;
  const { searchParams } = new URL(request.url);
  const includeEvents = searchParams.get("includeEvents") === "true";
  const eventsLimit = parseInt(searchParams.get("eventsLimit") ?? "20", 10);

  const repository = getReputationRepository();
  const getUserReputation = buildGetUserReputation({ repository });

  const result = await getUserReputation(userId, includeEvents, eventsLimit);

  if (!result.ok) {
    return jsonBadRequest({ message: result.error.message });
  }

  return jsonOk({ data: result.value });
};

export const POST = async (
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) => {
  await requireAuth();

  const { userId } = await params;
  const body = await request.json();
  const { amount, reason: reasonInput } = body;

  if (typeof amount !== "number" || !reasonInput) {
    return jsonBadRequest({
      message: "Amount (number) and reason are required",
    });
  }

  // For manual adjustments, we'll use a special reason
  const reason: ReputationReason = "signal_verified"; // Using highest value as base

  const repository = getReputationRepository();
  const addReputationEvent = buildAddReputationEvent({ repository });

  // Calculate how many events needed to match the desired amount
  // This is a simplified approach - in production, you might want a dedicated "manual_adjustment" reason
  const result = await addReputationEvent(
    userId,
    reason,
    `manual_adjustment:${reasonInput}`
  );

  if (!result.ok) {
    return jsonBadRequest({ message: result.error.message });
  }

  return jsonOk({ data: result.value });
};
