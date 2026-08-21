import type * as maplibregl from "maplibre-gl";

type MapLibreModule = typeof maplibregl;

let maplibrePromise: Promise<MapLibreModule> | null = null;

export const loadMaplibre = async () => {
  if (!maplibrePromise) {
    maplibrePromise = (async () => {
      const maplibre = await import("maplibre-gl");
      if (typeof window !== "undefined" && maplibre.setWorkerUrl) {
        // public/maplibre-worker.js + public/maplibre-gl-shared.mjs are manual
        // copies of node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs and
        // maplibre-gl-shared.mjs. They must be re-copied whenever maplibre-gl
        // is upgraded, or the worker will run a mismatched protocol version.
        maplibre.setWorkerUrl("/maplibre-worker.js");
      }
      return maplibre;
    })();
  }

  return maplibrePromise;
};
