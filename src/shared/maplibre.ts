import type maplibregl from "maplibre-gl";

type MapLibreModule = typeof maplibregl & {
  setWorkerUrl?: (url: string) => void;
};

let maplibrePromise: Promise<MapLibreModule> | null = null;

export const loadMaplibre = async () => {
  if (!maplibrePromise) {
    maplibrePromise = (async () => {
      const maplibreModule = await import("maplibre-gl");
      const maplibre = (maplibreModule.default ??
        maplibreModule) as MapLibreModule;
      if (typeof window !== "undefined" && maplibre.setWorkerUrl) {
        maplibre.setWorkerUrl("/maplibre-worker.js");
      }
      return maplibre;
    })();
  }

  return maplibrePromise;
};
