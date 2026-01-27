import { buildCreateGeofence } from "@/application/use-cases/create-geofence";
import { buildListGeofences } from "@/application/use-cases/list-geofences";
import { systemClock } from "@/adapters/clock/system-clock";
import { ulidGenerator } from "@/adapters/id/ulid-generator";
import { getGeofenceRepository } from "@/adapters/repositories/repository-factory";
import { PolygonSchema } from "@/contracts/geo";
import {
  CreateGeofenceRequestSchema,
  GeofenceVisibilitySchema,
} from "@/contracts/geofence";
import { jsonBadRequest, jsonCreated, jsonOk } from "@/shared/http";
import type { GeofenceFilters } from "@/ports/geofence-repository";

export const runtime = "nodejs";

const repository = getGeofenceRepository();
const createGeofence = buildCreateGeofence({
  repository,
  idGenerator: ulidGenerator,
  clock: systemClock,
});
const listGeofences = buildListGeofences(repository);

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
  const filters = parseFilters(new URL(request.url).searchParams);
  if ("error" in filters) {
    return jsonBadRequest({ message: filters.error });
  }

  const geofences = await listGeofences(filters);
  return jsonOk({ data: geofences });
};

export const POST = async (request: Request) => {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonBadRequest({ message: "Invalid JSON payload." });
  }
  const parsed = CreateGeofenceRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonBadRequest({
      message: "Invalid payload.",
      details: parsed.error.flatten(),
    });
  }

  const result = await createGeofence(parsed.data);
  if (!result.ok) {
    return jsonBadRequest({
      message: result.error.message,
      details: result.error,
    });
  }

  return jsonCreated({ data: result.value });
};
