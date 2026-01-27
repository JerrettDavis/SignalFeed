import path from "node:path";
import type { Geofence, GeofenceId } from "@/domain/geofences/geofence";
import type {
  GeofenceFilters,
  GeofenceRepository,
} from "@/ports/geofence-repository";
import { polygonWithinPolygon } from "@/shared/geo";
import {
  readCollection,
  writeCollection,
  getDataDir,
} from "@/adapters/repositories/file-store";
import { seedGeofences } from "@/data/seed";

const getFilePath = () => path.join(getDataDir(), "geofences.json");

export const fileGeofenceRepository = (): GeofenceRepository => {
  const filePath = getFilePath();

  return {
    async create(geofence) {
      const data = await readCollection<Geofence>(filePath, seedGeofences);
      data.push(geofence);
      await writeCollection(filePath, data);
    },
    async getById(id: GeofenceId) {
      const data = await readCollection<Geofence>(filePath, seedGeofences);
      return data.find((item) => item.id === id) ?? null;
    },
    async list(filters: GeofenceFilters) {
      const data = await readCollection<Geofence>(filePath, seedGeofences);
      return data.filter((geofence) => {
        if (filters.visibility && geofence.visibility !== filters.visibility) {
          return false;
        }
        if (
          filters.bounds &&
          !polygonWithinPolygon(geofence.polygon, filters.bounds)
        ) {
          return false;
        }
        return true;
      });
    },
    async update(geofence) {
      const data = await readCollection<Geofence>(filePath, seedGeofences);
      const index = data.findIndex((item) => item.id === geofence.id);
      if (index !== -1) {
        data[index] = geofence;
        await writeCollection(filePath, data);
      }
    },
    async delete(id) {
      const data = await readCollection<Geofence>(filePath, seedGeofences);
      const filtered = data.filter((item) => item.id !== id);
      await writeCollection(filePath, filtered);
    },
    async deleteMany(ids) {
      const data = await readCollection<Geofence>(filePath, seedGeofences);
      const idSet = new Set(ids);
      const filtered = data.filter((item) => !idSet.has(item.id));
      await writeCollection(filePath, filtered);
    },
  };
};
