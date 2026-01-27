import { buildCreateSighting } from "@/application/use-cases/create-sighting";
import { buildListSightings } from "@/application/use-cases/list-sightings";
import { getSightingRepository } from "@/adapters/repositories/repository-factory";
import { systemClock } from "@/adapters/clock/system-clock";
import { ulidGenerator } from "@/adapters/id/ulid-generator";
import { PolygonSchema } from "@/contracts/geo";
import {
  CreateSightingRequestSchema,
  SightingStatusSchema,
} from "@/contracts/sighting";
import { jsonBadRequest, jsonCreated, jsonOk } from "@/shared/http";
import type { SightingFilters } from "@/ports/sighting-repository";

export const runtime = "nodejs";

const repository = getSightingRepository();
const createSighting = buildCreateSighting({
  repository,
  idGenerator: ulidGenerator,
  clock: systemClock,
});
const listSightings = buildListSightings(repository);

const parseFilters = (
  searchParams: URLSearchParams
): SightingFilters | { error: string } => {
  const typeIds = searchParams.getAll("typeId");
  const categoryIds = searchParams.getAll("categoryId");
  const statusRaw = searchParams.get("status");
  const boundsRaw = searchParams.get("bounds");

  if (statusRaw && !SightingStatusSchema.safeParse(statusRaw).success) {
    return { error: "Invalid status filter." };
  }

  let bounds: SightingFilters["bounds"];
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
    typeIds: typeIds.length
      ? (typeIds as SightingFilters["typeIds"])
      : undefined,
    categoryIds: categoryIds.length
      ? (categoryIds as SightingFilters["categoryIds"])
      : undefined,
    status: statusRaw ? (statusRaw as SightingFilters["status"]) : undefined,
    bounds,
  };
};

export const GET = async (request: Request) => {
  const filters = parseFilters(new URL(request.url).searchParams);
  if ("error" in filters) {
    return jsonBadRequest({ message: filters.error });
  }

  const sightings = await listSightings(filters);
  return jsonOk({ data: sightings });
};

export const POST = async (request: Request) => {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonBadRequest({ message: "Invalid JSON payload." });
  }
  const parsed = CreateSightingRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonBadRequest({
      message: "Invalid payload.",
      details: parsed.error.flatten(),
    });
  }

  const result = await createSighting(parsed.data);
  if (!result.ok) {
    return jsonBadRequest({
      message: result.error.message,
      details: result.error,
    });
  }

  return jsonCreated({ data: result.value });
};
