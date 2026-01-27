import { buildGetSightingReactions } from "@/application/use-cases/sightings/get-sighting-reactions";
import { getSightingReactionRepository } from "@/adapters/repositories/repository-factory";
import { jsonOk } from "@/shared/http";

export const runtime = "nodejs";

const reactionRepository = getSightingReactionRepository();
const getSightingReactions = buildGetSightingReactions({
  repository: reactionRepository,
});

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const result = await getSightingReactions(id);

  if (!result.ok) {
    return jsonOk({ data: result.error });
  }

  return jsonOk({ data: result.value });
};
