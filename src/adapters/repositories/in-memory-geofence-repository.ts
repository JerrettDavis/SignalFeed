import type { Geofence, GeofenceId } from "@/domain/geofences/geofence";
import type {
  GeofenceFilters,
  GeofenceRepository,
} from "@/ports/geofence-repository";
import { pointInPolygon, polygonWithinPolygon } from "@/shared/geo";
import { seedGeofences } from "@/data/seed";

type Store = Map<GeofenceId, Geofence>;

const getStore = (): Store => {
  const globalAny = globalThis as {
    __sightsignal_geofences?: Store;
    __sightsignal_geofences_initialized?: boolean;
  };
  if (!globalAny.__sightsignal_geofences) {
    globalAny.__sightsignal_geofences = new Map<GeofenceId, Geofence>();
    // Load seed data on first initialization
    if (!globalAny.__sightsignal_geofences_initialized) {
      seedGeofences.forEach((geofence) => {
        globalAny.__sightsignal_geofences!.set(geofence.id, geofence);
      });
      globalAny.__sightsignal_geofences_initialized = true;
    }
  }
  return globalAny.__sightsignal_geofences;
};

export const inMemoryGeofenceRepository = (): GeofenceRepository => {
  const store = getStore();

  return {
    async create(geofence) {
      store.set(geofence.id, geofence);
    },
    async getById(id) {
      return store.get(id) ?? null;
    },
    async list(filters: GeofenceFilters) {
      const values = Array.from(store.values());
      return values.filter((geofence) => {
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
      store.set(geofence.id, geofence);
    },
    async delete(id) {
      store.delete(id);
    },
    async deleteMany(ids) {
      ids.forEach((id) => store.delete(id));
    },
  };
};
