import { buildGetUserReputation } from "@/application/use-cases/reputation/get-user-reputation";
import { getReputationRepository } from "@/adapters/repositories/repository-factory";
import { jsonOk, jsonNotFound, jsonBadRequest } from "@/shared/http";

export const runtime = "nodejs";

const reputationRepository = getReputationRepository();
const getUserReputation = buildGetUserReputation({
  repository: reputationRepository,
});

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const url = new URL(request.url);
  const includeEventsParam = url.searchParams.get("includeEvents");
  const eventsLimitParam = url.searchParams.get("eventsLimit");

  const includeEvents = includeEventsParam === "true";
  const eventsLimit = eventsLimitParam ? parseInt(eventsLimitParam, 10) : 20;

  if (eventsLimitParam && isNaN(eventsLimit)) {
    return jsonBadRequest({ message: "eventsLimit must be a valid number." });
  }

  const result = await getUserReputation(id, includeEvents, eventsLimit);

  if (!result.ok) {
    return jsonNotFound(result.error.message);
  }

  return jsonOk({ data: result.value });
};
