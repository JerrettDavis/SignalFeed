import { getGeofenceRepository } from "@/adapters/repositories/repository-factory";
import { jsonNotFound, jsonOk } from "@/shared/http";
import type { GeofenceId } from "@/domain/geofences/geofence";

export const runtime = "nodejs";

const repository = getGeofenceRepository();

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

export const GET = async (_request: Request, context: RouteContext) => {
  const params = await context.params;
  const geofence = await repository.getById(params.id as GeofenceId);
  if (!geofence) {
    return jsonNotFound("Geofence not found.");
  }

  return jsonOk({ data: geofence });
};
