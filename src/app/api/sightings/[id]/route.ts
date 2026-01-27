import { getSightingRepository } from "@/adapters/repositories/repository-factory";
import { jsonNotFound, jsonOk } from "@/shared/http";
import type { SightingId } from "@/domain/sightings/sighting";

export const runtime = "nodejs";

const repository = getSightingRepository();

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

export const GET = async (_request: Request, context: RouteContext) => {
  const params = await context.params;
  const sighting = await repository.getById(params.id as SightingId);
  if (!sighting) {
    return jsonNotFound("Sighting not found.");
  }

  return jsonOk({ data: sighting });
};
