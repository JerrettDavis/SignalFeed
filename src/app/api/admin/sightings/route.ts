import { requireAuth } from "@/shared/auth-helpers";
import { buildListSightings } from "@/application/use-cases/list-sightings";
import { getSightingRepository } from "@/adapters/repositories/repository-factory";
import { PolygonSchema } from "@/contracts/geo";
import { SightingStatusSchema } from "@/contracts/sighting";
import { jsonBadRequest, jsonOk } from "@/shared/http";
import type { SightingFilters } from "@/ports/sighting-repository";

export const runtime = "nodejs";

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
  await requireAuth();

  const filters = parseFilters(new URL(request.url).searchParams);
  if ("error" in filters) {
    return jsonBadRequest({ message: filters.error });
  }

  const repository = getSightingRepository();
  const listSightings = buildListSightings(repository);
  const sightings = await listSightings(filters);

  return jsonOk({ data: sightings });
};
