import { requireAuth } from "@/shared/auth-helpers";
import { buildListGeofences } from "@/application/use-cases/list-geofences";
import { getGeofenceRepository } from "@/adapters/repositories/repository-factory";
import { PolygonSchema } from "@/contracts/geo";
import { GeofenceVisibilitySchema } from "@/contracts/geofence";
import { jsonBadRequest, jsonOk } from "@/shared/http";
import type { GeofenceFilters } from "@/ports/geofence-repository";

export const runtime = "nodejs";

const parseFilters = (
  searchParams: URLSearchParams
): GeofenceFilters | { error: string } => {
  const visibilityRaw = searchParams.get("visibility");
  const boundsRaw = searchParams.get("bounds");

  if (
    visibilityRaw &&
    !GeofenceVisibilitySchema.safeParse(visibilityRaw).success
  ) {
    return { error: "Invalid visibility filter." };
  }

  let bounds: GeofenceFilters["bounds"];
  if (boundsRaw) {
    try {
      const parsed = PolygonSchema.safeParse(JSON.parse(boundsRaw));
      if (!parsed.success) {
        return { error: "Invalid bounds polygon." };
      }
      bounds = parsed.data;
    } catch {
      return { error: "Bounds must be JSON." };
    }
  }

  return {
    visibility: visibilityRaw
      ? (visibilityRaw as GeofenceFilters["visibility"])
      : undefined,
    bounds,
  };
};

export const GET = async (request: Request) => {
  await requireAuth();

  const filters = parseFilters(new URL(request.url).searchParams);
  if ("error" in filters) {
    return jsonBadRequest({ message: filters.error });
  }

  const repository = getGeofenceRepository();
  const listGeofences = buildListGeofences(repository);
  const geofences = await listGeofences(filters);

  return jsonOk({ data: geofences });
};
