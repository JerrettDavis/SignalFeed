"use client";

import type maplibregl from "maplibre-gl";
import type { GeoJSONSource } from "maplibre-gl";
import { useEffect, useMemo, useRef } from "react";
import type { LatLng, Polygon } from "@/domain/geo/geo";
import { config } from "@/shared/config";
import { loadMaplibre } from "@/shared/maplibre";
import { useTheme } from "@/hooks/useTheme";

type Props = {
  geofences: {
    id: string;
    name: string;
    polygon: Polygon;
    visibility: string;
  }[];
  draftPoints: LatLng[];
  onMapClick?: (point: LatLng) => void;
};

const closePolygon = (points: LatLng[]) => {
  if (points.length === 0) {
    return [];
  }
  const first = points[0];
  const last = points[points.length - 1];
  if (first.lat === last.lat && first.lng === last.lng) {
    return points;
  }
  return [...points, first];
};

const toGeofenceCollection = (geofences: Props["geofences"]) => ({
  type: "FeatureCollection" as const,
  features: geofences.map((geofence) => ({
    type: "Feature" as const,
    properties: {
      id: geofence.id,
      name: geofence.name,
      visibility: geofence.visibility,
    },
    geometry: {
      type: "Polygon" as const,
      coordinates: [
        closePolygon(geofence.polygon.points).map((point) => [
          point.lng,
          point.lat,
        ]),
      ],
    },
  })),
});

const toDraftCollection = (points: LatLng[]) => ({
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      properties: { kind: "line" },
      geometry: {
        type: "LineString" as const,
        coordinates: points.map((point) => [point.lng, point.lat]),
      },
    },
    ...(points.length >= 3
      ? [
          {
            type: "Feature" as const,
            properties: { kind: "polygon" },
            geometry: {
              type: "Polygon" as const,
              coordinates: [
                closePolygon(points).map((point) => [point.lng, point.lat]),
              ],
            },
          },
        ]
      : []),
  ],
});

export const GeofenceMap = ({ geofences, draftPoints, onMapClick }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const { effectiveTheme } = useTheme();

  const geofenceGeoJson = useMemo(
    () => toGeofenceCollection(geofences),
    [geofences]
  );
  const draftGeoJson = useMemo(
    () => toDraftCollection(draftPoints),
    [draftPoints]
  );
  const geofenceRef = useRef(geofenceGeoJson);
  const draftRef = useRef(draftGeoJson);

  useEffect(() => {
    geofenceRef.current = geofenceGeoJson;
  }, [geofenceGeoJson]);

  useEffect(() => {
    draftRef.current = draftGeoJson;
  }, [draftGeoJson]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    let cancelled = false;
    let mapInstance: maplibregl.Map | null = null;

    const init = async () => {
      const maplibre = await loadMaplibre();
      if (cancelled || !containerRef.current) {
        return;
      }

      // Use theme-appropriate map style
      const mapStyleUrl =
        effectiveTheme === "dark" ? "/map-style-dark.json" : config.mapStyleUrl;

      const map = new maplibre.Map({
        container: containerRef.current,
        style: mapStyleUrl,
        center: [-98.5795, 39.8283],
        zoom: 4,
        pitch: 0,
        attributionControl: false,
      });

      map.addControl(
        new maplibre.NavigationControl({ visualizePitch: true }),
        "bottom-right"
      );
      map.on("load", () => {
        map.addSource("geofences", {
          type: "geojson",
          data: geofenceRef.current,
        });
        map.addSource("draft", {
          type: "geojson",
          data: draftRef.current,
        });

        map.addLayer({
          id: "geofences-fill",
          type: "fill",
          source: "geofences",
          paint: {
            "fill-color": "#1f6f5b",
            "fill-opacity": 0.15,
          },
        });
        map.addLayer({
          id: "geofences-line",
          type: "line",
          source: "geofences",
          paint: {
            "line-color": "#1f6f5b",
            "line-width": 2,
          },
        });

        map.addLayer({
          id: "draft-line",
          type: "line",
          source: "draft",
          filter: ["==", ["get", "kind"], "line"],
          paint: {
            "line-color": "#f06449",
            "line-width": 2,
            "line-dasharray": [1.2, 1.2],
          },
        });
        map.addLayer({
          id: "draft-fill",
          type: "fill",
          source: "draft",
          filter: ["==", ["get", "kind"], "polygon"],
          paint: {
            "fill-color": "#f06449",
            "fill-opacity": 0.15,
          },
        });

        map.resize();
      });

      map.on("error", (event) => {
        if (event.error) {
          console.error("Map error:", event.error);
        }
      });

      if (onMapClick) {
        map.on("click", (event) => {
          onMapClick({ lat: event.lngLat.lat, lng: event.lngLat.lng });
        });
      }

      mapRef.current = map;
      mapInstance = map;
    };

    void init();

    return () => {
      cancelled = true;
      mapInstance?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onMapClick]);

  // Update map style when theme changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const mapStyleUrl =
      effectiveTheme === "dark" ? "/map-style-dark.json" : config.mapStyleUrl;

    // Get current center and zoom to preserve view
    const center = map.getCenter();
    const zoom = map.getZoom();
    const pitch = map.getPitch();

    map.setStyle(mapStyleUrl);

    // Re-add layers after style loads
    map.once("styledata", () => {
      // Restore view
      map.setCenter(center);
      map.setZoom(zoom);
      map.setPitch(pitch);

      // Re-add geofences source and layers
      if (!map.getSource("geofences")) {
        map.addSource("geofences", {
          type: "geojson",
          data: geofenceRef.current,
        });

        map.addLayer({
          id: "geofences-fill",
          type: "fill",
          source: "geofences",
          paint: {
            "fill-color": "#1f6f5b",
            "fill-opacity": 0.15,
          },
        });

        map.addLayer({
          id: "geofences-line",
          type: "line",
          source: "geofences",
          paint: {
            "line-color": "#1f6f5b",
            "line-width": 2,
          },
        });
      }

      // Re-add draft source and layers
      if (!map.getSource("draft")) {
        map.addSource("draft", {
          type: "geojson",
          data: draftRef.current,
        });

        map.addLayer({
          id: "draft-line",
          type: "line",
          source: "draft",
          filter: ["==", ["get", "kind"], "line"],
          paint: {
            "line-color": "#f06449",
            "line-width": 2,
            "line-dasharray": [1.2, 1.2],
          },
        });

        map.addLayer({
          id: "draft-fill",
          type: "fill",
          source: "draft",
          filter: ["==", ["get", "kind"], "polygon"],
          paint: {
            "fill-color": "#f06449",
            "fill-opacity": 0.15,
          },
        });
      }
    });
  }, [effectiveTheme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    const geofenceSource = map.getSource("geofences") as
      | GeoJSONSource
      | undefined;
    const draftSource = map.getSource("draft") as GeoJSONSource | undefined;
    geofenceSource?.setData(geofenceGeoJson);
    draftSource?.setData(draftGeoJson);
  }, [geofenceGeoJson, draftGeoJson]);

  return (
    <div
      data-testid="geofence-map"
      className="relative h-[420px] w-full overflow-hidden rounded-3xl border border-white/50 bg-white/70 shadow-[var(--shadow-soft)]"
    >
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
        }}
      />
      <div className="pointer-events-none absolute left-5 top-5 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--ink)] shadow-md">
        Geofence studio
      </div>
    </div>
  );
};
