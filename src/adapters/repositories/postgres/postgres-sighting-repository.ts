import type { Polygon } from "@/domain/geo/geo";
import type { Sighting, SightingId } from "@/domain/sightings/sighting";
import type { SightingFilters, SightingRepository } from "@/ports/sighting-repository";
import { pointInPolygon } from "@/shared/geo";
import { getSql } from "@/adapters/repositories/postgres/client";

const mapRow = (row: Record<string, unknown>): Sighting => ({
  id: row.id as SightingId,
  typeId: row.type_id as Sighting["typeId"],
  categoryId: row.category_id as Sighting["categoryId"],
  location: { lat: Number(row.location_lat), lng: Number(row.location_lng) },
  description: String(row.description ?? ""),
  details: row.details ? String(row.details) : undefined,
  importance: row.importance as Sighting["importance"],
  status: row.status as Sighting["status"],
  observedAt: new Date(row.observed_at as string).toISOString(),
  createdAt: new Date(row.created_at as string).toISOString(),
  fields: (row.fields as Record<string, Sighting["fields"][string]>) ?? {},
  reporterId: row.reporter_id ? String(row.reporter_id) : undefined,
  // Ensure backward compatibility by providing default values for scoring fields
  upvotes: row.upvotes != null ? Number(row.upvotes) : 0,
  downvotes: row.downvotes != null ? Number(row.downvotes) : 0,
  confirmations: row.confirmations != null ? Number(row.confirmations) : 0,
  disputes: row.disputes != null ? Number(row.disputes) : 0,
  spamReports: row.spam_reports != null ? Number(row.spam_reports) : 0,
  score: row.score != null ? Number(row.score) : 0,
  hotScore: row.hot_score != null ? Number(row.hot_score) : 0,
});

const applyBounds = (sightings: Sighting[], bounds?: Polygon) => {
  if (!bounds) {
    return sightings;
  }
  return sightings.filter((sighting) => pointInPolygon(bounds, sighting.location));
};

export const postgresSightingRepository = (): SightingRepository => {
  const sql = getSql();

  return {
    async create(sighting) {
      await sql`
        insert into sightings (
          id,
          type_id,
          category_id,
          location_lat,
          location_lng,
          description,
          details,
          importance,
          status,
          observed_at,
          created_at,
          fields,
          reporter_id
        )
        values (
          ${sighting.id},
          ${sighting.typeId},
          ${sighting.categoryId},
          ${sighting.location.lat},
          ${sighting.location.lng},
          ${sighting.description},
          ${sighting.details ?? null},
          ${sighting.importance},
          ${sighting.status},
          ${sighting.observedAt},
          ${sighting.createdAt},
          ${sql.json(sighting.fields)},
          ${sighting.reporterId ?? null}
        )
      `;
    },
    async getById(id: SightingId) {
      const rows = await sql`select * from sightings where id = ${id} limit 1`;
      if (!rows.length) {
        return null;
      }
      return mapRow(rows[0]);
    },
    async list(filters: SightingFilters) {
      const rows = await sql`select * from sightings`;
      const mapped = rows.map(mapRow).filter((sighting) => {
        if (filters.status && sighting.status !== filters.status) {
          return false;
        }
        if (filters.typeIds && filters.typeIds.length && !filters.typeIds.includes(sighting.typeId)) {
          return false;
        }
        if (filters.categoryIds && filters.categoryIds.length && !filters.categoryIds.includes(sighting.categoryId)) {
          return false;
        }
        return true;
      });
      return applyBounds(mapped, filters.bounds);
    },
    async update(sighting) {
      await sql`
        update sightings set
          type_id = ${sighting.typeId},
          category_id = ${sighting.categoryId},
          location_lat = ${sighting.location.lat},
          location_lng = ${sighting.location.lng},
          description = ${sighting.description},
          details = ${sighting.details ?? null},
          importance = ${sighting.importance},
          status = ${sighting.status},
          observed_at = ${sighting.observedAt},
          fields = ${sql.json(sighting.fields)},
          reporter_id = ${sighting.reporterId ?? null}
        where id = ${sighting.id}
      `;
    },
    async delete(id) {
      await sql`delete from sightings where id = ${id}`;
    },
    async deleteMany(ids) {
      if (ids.length === 0) return;
      await sql`delete from sightings where id = any(${ids})`;
    },
  };
};
