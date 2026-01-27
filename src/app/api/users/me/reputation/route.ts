import { buildGetUserReputation } from "@/application/use-cases/reputation/get-user-reputation";
import { getReputationRepository } from "@/adapters/repositories/repository-factory";
import { jsonOk, jsonUnauthorized, jsonBadRequest } from "@/shared/http";

export const runtime = "nodejs";

const reputationRepository = getReputationRepository();
const getUserReputation = buildGetUserReputation({
  repository: reputationRepository,
});

// Placeholder for auth - will be implemented later
const getUserIdFromSession = (): string | null => {
  // TODO: Implement proper auth
  return "placeholder-user-id";
};

export const GET = async (request: Request) => {
  const userId = getUserIdFromSession();
  if (!userId) {
    return jsonUnauthorized("Authentication required");
  }

  const url = new URL(request.url);
  const includeEventsParam = url.searchParams.get("includeEvents");
  const eventsLimitParam = url.searchParams.get("eventsLimit");

  const includeEvents = includeEventsParam === "true";
  const eventsLimit = eventsLimitParam ? parseInt(eventsLimitParam, 10) : 20;

  if (eventsLimitParam && isNaN(eventsLimit)) {
    return jsonBadRequest({ message: "eventsLimit must be a valid number." });
  }

  const result = await getUserReputation(userId, includeEvents, eventsLimit);

  if (!result.ok) {
    return jsonBadRequest({
      message: result.error.message,
      details: result.error,
    });
  }

  return jsonOk({ data: result.value });
};
