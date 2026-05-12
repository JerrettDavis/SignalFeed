"use client";

import type maplibregl from "maplibre-gl";
import type { GeoJSONSource } from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { config } from "@/shared/config";
import { loadMaplibre } from "@/shared/maplibre";
import type { SightingCard } from "@/data/mock-sightings";
import { useTheme } from "@/hooks/useTheme";
import { EVENTS, dispatchEvent } from "@/shared/events";

type SelectedGeofence = {
  id: string;
  name: string;
  polygon: {
    points: Array<{ lat: number; lng: number }>;
  };
};

type SelectedSighting = {
  id: string;
  title: string;
  category: string;
  description: string;
  location: {
    lat: number;
    lng: number;
  };
};

type Props = {
  sightings: SightingCard[];
  selectedGeofence?: SelectedGeofence | null;
  selectedSighting?: SelectedSighting | null;
};

const importanceRank = {
  critical: 4,
  high: 3,
  normal: 2,
  low: 1,
} as const;

const POINT_SOURCE_ID = "sighting-points";
const CLUSTER_SOURCE_ID = "sighting-clusters";
const CLUSTER_PREVIEW_ZOOM = 15;
const STACK_LABEL_MIN_ZOOM = 12;
const MERCATOR_TILE_SIZE = 512;

const coordinateKey = (location: SightingCard["location"]) =>
  `${location.lat.toFixed(4)}:${location.lng.toFixed(4)}`;

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const getFocusZoom = (currentZoom: number) =>
  Math.min(Math.max(currentZoom + 0.75, 10), 13);

const getDrilldownZoom = (currentZoom: number) =>
  Math.min(Math.max(currentZoom + 1, 11), 14);

const pointPopupHtml = (properties: {
  title?: unknown;
  category?: unknown;
  description?: unknown;
}) => `<div style="font-family: var(--font-body); color: #0c1a24;">
  <div style="font-weight: 600; margin-bottom: 6px;">${escapeHtml(String(properties.title ?? ""))}</div>
  <div style="font-size: 12px; opacity: 0.75;">${escapeHtml(String(properties.category ?? ""))}</div>
  <div style="font-size: 12px; margin-top: 6px;">${escapeHtml(String(properties.description ?? ""))}</div>
</div>`;

const toGeoJson = (sightings: SightingCard[]) => {
  const groups = new Map<string, SightingCard[]>();

  for (const sighting of sightings) {
    const key = coordinateKey(sighting.location);
    groups.set(key, [...(groups.get(key) ?? []), sighting]);
  }

  const stackMetadata = new Map<
    string,
    {
      stackIndex: number;
      stackCount: number;
    }
  >();

  for (const group of groups.values()) {
    const sorted = [...group].sort((a, b) => {
      const importanceDelta =
        importanceRank[b.importance] - importanceRank[a.importance];
      if (importanceDelta !== 0) return importanceDelta;
      return (b.hotScore ?? b.score ?? 0) - (a.hotScore ?? a.score ?? 0);
    });

    sorted.forEach((sighting, index) => {
      stackMetadata.set(sighting.id, {
        stackIndex: index,
        stackCount: sorted.length,
      });
    });
  }

  return {
    type: "FeatureCollection" as const,
    features: sightings.map((sighting) => {
      const stack = stackMetadata.get(sighting.id) ?? {
        stackIndex: 0,
        stackCount: 1,
      };

      return {
        type: "Feature" as const,
        properties: {
          id: sighting.id,
          title: sighting.title,
          category: sighting.category,
          importance: sighting.importance,
          status: sighting.status,
          description: sighting.description,
          score: sighting.score ?? 0,
          hotScore: sighting.hotScore ?? 0,
          stackIndex: stack.stackIndex,
          stackCount: stack.stackCount,
          stackLabel:
            stack.stackCount > 1 && stack.stackIndex === 0
              ? `${stack.stackCount}`
              : "",
        },
        geometry: {
          type: "Point" as const,
          coordinates: [sighting.location.lng, sighting.location.lat],
        },
      };
    }),
  };
};

type SightingGeoJson = ReturnType<typeof toGeoJson>;

const worldSize = (zoom: number) => MERCATOR_TILE_SIZE * 2 ** zoom;

const lngToWorldX = (lng: number, zoom: number) =>
  ((lng + 180) / 360) * worldSize(zoom);

const latToWorldY = (lat: number, zoom: number) => {
  const sinLat = Math.sin((lat * Math.PI) / 180);
  return (
    (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) *
    worldSize(zoom)
  );
};

const worldXToLng = (x: number, zoom: number) =>
  (x / worldSize(zoom)) * 360 - 180;

const worldYToLat = (y: number, zoom: number) => {
  const normalizedY = y / worldSize(zoom);
  return (
    (Math.atan(Math.sinh(Math.PI * (1 - 2 * normalizedY))) * 180) / Math.PI
  );
};

const clusterRadiusForZoom = (zoom: number) => {
  if (zoom < 4) return 180;
  if (zoom < 7) return 130;
  if (zoom < 10) return 92;
  if (zoom < 13) return 62;
  return 38;
};

const toClusterGeoJson = (geoJson: SightingGeoJson, zoom: number) => {
  if (zoom >= CLUSTER_PREVIEW_ZOOM) {
    return { type: "FeatureCollection" as const, features: [] };
  }

  const radius = clusterRadiusForZoom(zoom);
  const groups = new Map<
    string,
    {
      count: number;
      worldXTotal: number;
      worldYTotal: number;
      highestImportance: SightingCard["importance"];
      items: Array<Record<string, unknown>>;
    }
  >();

  for (const feature of geoJson.features) {
    const [lng, lat] = feature.geometry.coordinates;
    const worldX = lngToWorldX(lng, zoom);
    const worldY = latToWorldY(lat, zoom);
    const key = `${Math.floor(worldX / radius)}:${Math.floor(worldY / radius)}`;
    const importance = feature.properties.importance;
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        count: 1,
        worldXTotal: worldX,
        worldYTotal: worldY,
        highestImportance: importance,
        items: [feature.properties],
      });
      continue;
    }

    existing.count += 1;
    existing.worldXTotal += worldX;
    existing.worldYTotal += worldY;
    if (
      importanceRank[importance] > importanceRank[existing.highestImportance]
    ) {
      existing.highestImportance = importance;
    }
    if (existing.items.length < 12) {
      existing.items.push(feature.properties);
    }
  }

  return {
    type: "FeatureCollection" as const,
    features: Array.from(groups.entries())
      .filter(([, group]) => group.count > 1)
      .map(([id, group]) => ({
        type: "Feature" as const,
        properties: {
          id,
          point_count: group.count,
          point_count_abbreviated:
            group.count >= 1000
              ? `${Math.round(group.count / 100) / 10}k`
              : String(group.count),
          importance: group.highestImportance,
          items: JSON.stringify(group.items),
        },
        geometry: {
          type: "Point" as const,
          coordinates: [
            worldXToLng(group.worldXTotal / group.count, zoom),
            worldYToLat(group.worldYTotal / group.count, zoom),
          ],
        },
      })),
  };
};

const updateClusterSource = (map: maplibregl.Map, geoJson: SightingGeoJson) => {
  const source = map.getSource(CLUSTER_SOURCE_ID) as GeoJSONSource | undefined;
  if (source) {
    source.setData(toClusterGeoJson(geoJson, map.getZoom()));
  }
};

export const SightingsMap = ({
  sightings,
  selectedGeofence,
  selectedSighting,
}: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const reportMarkerRef = useRef<maplibregl.Marker | null>(null);
  const { effectiveTheme } = useTheme();
  const [showHeatmap, setShowHeatmap] = useState(false);

  const geoJson = useMemo(() => toGeoJson(sightings), [sightings]);
  const geoJsonRef = useRef(geoJson);

  useEffect(() => {
    geoJsonRef.current = geoJson;
  }, [geoJson]);

  // Toggle heatmap layer
  const toggleHeatmap = () => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const newShowHeatmap = !showHeatmap;
    setShowHeatmap(newShowHeatmap);

    // Helper to safely set layer visibility
    const setLayerVisibility = (
      layerId: string,
      visibility: "visible" | "none"
    ) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, "visibility", visibility);
      }
    };

    if (newShowHeatmap) {
      // Hide clustered layers
      setLayerVisibility("clusters", "none");
      setLayerVisibility("cluster-count", "none");
      setLayerVisibility("unclustered-point-glow", "none");
      setLayerVisibility("unclustered-point", "none");
      setLayerVisibility("stack-count-label", "none");
      // Show heatmap
      setLayerVisibility("sightings-heatmap", "visible");
    } else {
      // Show clustered layers
      setLayerVisibility("clusters", "visible");
      setLayerVisibility("cluster-count", "visible");
      setLayerVisibility("unclustered-point-glow", "visible");
      setLayerVisibility("unclustered-point", "visible");
      setLayerVisibility("stack-count-label", "visible");
      // Hide heatmap
      setLayerVisibility("sightings-heatmap", "none");
    }
  };

  const showClusterPreview = useCallback(
    async (
      map: maplibregl.Map,
      clusterItems: unknown,
      coordinates: [number, number]
    ) => {
      let leaves: Array<Record<string, unknown>> = [];
      if (typeof clusterItems === "string") {
        try {
          leaves = JSON.parse(clusterItems) as Array<Record<string, unknown>>;
        } catch {
          leaves = [];
        }
      }

      const items = leaves
        .map((properties) => {
          const title = escapeHtml(String(properties.title ?? "Untitled"));
          const category = escapeHtml(String(properties.category ?? ""));
          const importance = escapeHtml(String(properties.importance ?? ""));

          return `<li style="padding: 7px 0; border-top: 1px solid rgba(12,26,36,.1);">
          <div style="font-weight: 650; line-height: 1.25;">${title}</div>
          <div style="font-size: 11px; opacity: .72; margin-top: 2px;">${category} &middot; ${importance}</div>
        </li>`;
        })
        .join("");

      const countLabel =
        leaves.length >= 12 ? "Showing nearby items" : "Stacked nearby items";

      popupRef.current?.remove();
      const maplibre = await loadMaplibre();
      popupRef.current = new maplibre.Popup({
        closeButton: true,
        maxWidth: "320px",
        offset: 16,
      })
        .setLngLat(coordinates)
        .setHTML(
          `<div style="font-family: var(--font-body); color: #0c1a24; min-width: 240px;">
          <div style="font-size: 12px; font-weight: 750; text-transform: uppercase; letter-spacing: .08em; opacity: .65;">${countLabel}</div>
          <ol style="margin: 8px 0 0; padding: 0; list-style: none;">${items}</ol>
        </div>`
        )
        .addTo(map);
    },
    []
  );

  const handleClusterClick = useCallback(
    async (map: maplibregl.Map, event: maplibregl.MapLayerMouseEvent) => {
      const features = map.queryRenderedFeatures(event.point, {
        layers: ["clusters"],
      });
      const feature = features[0];
      if (!feature?.geometry || feature.geometry.type !== "Point") {
        return;
      }

      const coordinates = feature.geometry.coordinates as [number, number];
      const currentZoom = map.getZoom();
      const pointCount = Number(feature.properties?.point_count ?? 0);

      try {
        if (currentZoom >= CLUSTER_PREVIEW_ZOOM - 1 || pointCount <= 3) {
          await showClusterPreview(map, feature.properties?.items, coordinates);
          return;
        }

        map.easeTo({
          center: coordinates,
          zoom: Math.min(
            currentZoom + (currentZoom < 7 ? 2.25 : 1.5),
            CLUSTER_PREVIEW_ZOOM - 1
          ),
          duration: 450,
          essential: true,
        });
      } catch (err) {
        console.error("Failed to inspect cluster:", err);
      }
    },
    [showClusterPreview]
  );

  const showSightingPopup = useCallback(
    async (
      map: maplibregl.Map,
      coordinates: [number, number],
      properties: { title?: unknown; category?: unknown; description?: unknown }
    ) => {
      const maplibreModule = await loadMaplibre();
      popupRef.current?.remove();
      popupRef.current = new maplibreModule.Popup({
        closeButton: false,
        offset: 12,
      })
        .setLngLat(coordinates)
        .setHTML(pointPopupHtml(properties))
        .addTo(map);
    },
    []
  );

  const handlePointClick = useCallback(
    async (map: maplibregl.Map, event: maplibregl.MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (!feature || !event.lngLat) {
        return;
      }

      const coordinates =
        feature.geometry?.type === "Point"
          ? (feature.geometry.coordinates as [number, number])
          : ([event.lngLat.lng, event.lngLat.lat] as [number, number]);

      await showSightingPopup(
        map,
        coordinates,
        feature.properties as Record<string, unknown>
      );

      map.easeTo({
        center: coordinates,
        zoom: getFocusZoom(map.getZoom()),
        duration: 350,
        essential: true,
      });
    },
    [showSightingPopup]
  );

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
      map.addControl(
        new maplibre.AttributionControl({
          compact: true,
          customAttribution: "SightSignal",
        }),
        "bottom-left"
      );

      const onClusterClick = (event: maplibregl.MapLayerMouseEvent) => {
        void handleClusterClick(map, event);
      };
      const onPointClick = (event: maplibregl.MapLayerMouseEvent) => {
        void handlePointClick(map, event);
      };
      const attachInteractionHandlers = () => {
        map.off("click", "clusters", onClusterClick);
        map.off("click", "unclustered-point", onPointClick);
        map.on("click", "clusters", onClusterClick);
        map.on("click", "unclustered-point", onPointClick);
      };
      const refreshClusters = () =>
        updateClusterSource(map, geoJsonRef.current);
      map.on("zoomend", refreshClusters);
      map.on("moveend", refreshClusters);

      map.on("load", () => {
        console.log("Map loaded, mapRef will be set");

        map.addSource(POINT_SOURCE_ID, {
          type: "geojson",
          data: geoJsonRef.current,
        });
        map.addSource(CLUSTER_SOURCE_ID, {
          type: "geojson",
          data: toClusterGeoJson(geoJsonRef.current, map.getZoom()),
        });

        // Heatmap layer (hidden by default) - very subtle like light clouds
        map.addLayer({
          id: "sightings-heatmap",
          type: "heatmap",
          source: POINT_SOURCE_ID,
          layout: {
            visibility: "none",
          },
          paint: {
            // Increase weight for higher hotScore
            "heatmap-weight": [
              "interpolate",
              ["linear"],
              ["get", "hotScore"],
              -10,
              0,
              0,
              0.2,
              10,
              1,
            ],
            // Increase intensity as zoom increases
            "heatmap-intensity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              0.5,
              9,
              1.5,
            ],
            // Color ramp for heatmap - very light opacity like clouds
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(33, 102, 172, 0)",
              0.2,
              "rgba(103, 169, 207, 0.15)",
              0.4,
              "rgba(209, 229, 240, 0.2)",
              0.6,
              "rgba(253, 219, 199, 0.25)",
              0.8,
              "rgba(239, 138, 98, 0.3)",
              1,
              "rgba(178, 24, 43, 0.35)",
            ],
            // Adjust radius by zoom level
            "heatmap-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              2,
              9,
              20,
              14,
              40,
            ],
            // Fade out at high zoom (transition to point view)
            "heatmap-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              7,
              0.8,
              14,
              0.2,
              15,
              0,
            ],
          },
        });

        // Cluster circles
        map.addLayer({
          id: "clusters",
          type: "circle",
          source: CLUSTER_SOURCE_ID,
          filter: ["has", "point_count"],
          layout: {
            visibility: "visible",
          },
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["get", "point_count"],
              2,
              22,
              10,
              32,
              30,
              44,
              100,
              58,
              250,
              70,
            ],
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#3a86ff", // color when count < 10
              10,
              "#f2c94c", // color when count >= 10
              30,
              "#f77f00", // color when count >= 30
              100,
              "#f06449", // color when count >= 100
            ],
            "circle-opacity": 0.88,
            "circle-stroke-width": [
              "interpolate",
              ["linear"],
              ["get", "point_count"],
              2,
              3,
              100,
              5,
            ],
            "circle-stroke-color": "#ffffff",
          },
        });

        // Cluster count labels
        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: CLUSTER_SOURCE_ID,
          filter: ["has", "point_count"],
          layout: {
            visibility: "visible",
            "text-field": [
              "concat",
              ["to-string", ["get", "point_count"]],
              "+",
            ],
            "text-font": ["Noto Sans Regular"],
            "text-size": [
              "interpolate",
              ["linear"],
              ["get", "point_count"],
              2,
              13,
              30,
              16,
              100,
              20,
            ],
            "text-allow-overlap": true,
            "text-ignore-placement": true,
          },
          paint: {
            "text-color": "#ffffff",
            "text-halo-color": "rgba(12, 26, 36, 0.45)",
            "text-halo-width": 1.5,
          },
        });

        // Unclustered points - glow effect
        map.addLayer({
          id: "unclustered-point-glow",
          type: "circle",
          source: POINT_SOURCE_ID,
          layout: {
            visibility: "visible",
          },
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              5,
              7,
              8,
              11,
              14,
              14,
              18,
            ],
            "circle-color": "#f2c94c",
            "circle-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              0.05,
              7,
              0.1,
              11,
              0.18,
            ],
          },
        });

        // Unclustered points (individual sightings)
        map.addLayer({
          id: "unclustered-point",
          type: "circle",
          source: POINT_SOURCE_ID,
          layout: {
            visibility: "visible",
          },
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              2,
              6,
              3,
              10,
              5,
              13,
              7,
            ],
            "circle-color": [
              "match",
              ["get", "importance"],
              "critical",
              "#f06449",
              "high",
              "#f2c94c",
              "low",
              "#1f6f5b",
              "#3a86ff",
            ],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              0.2,
              6,
              0.32,
              10,
              0.75,
              12,
              1,
            ],
            "circle-stroke-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              0.35,
              10,
              0.75,
              12,
              1,
            ],
          },
        });

        map.addLayer({
          id: "stack-count-label",
          type: "symbol",
          source: POINT_SOURCE_ID,
          filter: [
            "all",
            [">", ["get", "stackCount"], 1],
            ["==", ["get", "stackIndex"], 0],
          ],
          layout: {
            visibility: "visible",
            "text-field": "{stackLabel}",
            "text-font": ["Noto Sans Regular"],
            "text-size": 10,
            "text-offset": [0, 0.05],
            "text-allow-overlap": true,
          },
          minzoom: STACK_LABEL_MIN_ZOOM,
          paint: {
            "text-color": "#ffffff",
          },
        });

        attachInteractionHandlers();
        map.moveLayer("clusters");
        map.moveLayer("cluster-count");

        // Cursor handlers for clusters
        map.on("mouseenter", "clusters", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "clusters", () => {
          map.getCanvas().style.cursor = "";
        });

        // Cursor handlers for points
        map.on("mouseenter", "unclustered-point", () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", "unclustered-point", () => {
          map.getCanvas().style.cursor = "";
        });

        map.resize();

        map.on("error", (event) => {
          if (event.error) {
            console.error("Map error:", event.error);
          }
        });
      });

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
  }, []);

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

    const onClusterClick = (event: maplibregl.MapLayerMouseEvent) => {
      void handleClusterClick(map, event);
    };
    const onPointClick = (event: maplibregl.MapLayerMouseEvent) => {
      void handlePointClick(map, event);
    };
    const attachInteractionHandlers = () => {
      map.off("click", "clusters", onClusterClick);
      map.off("click", "unclustered-point", onPointClick);
      map.on("click", "clusters", onClusterClick);
      map.on("click", "unclustered-point", onPointClick);
    };

    map.setStyle(mapStyleUrl);

    // Re-add layers after style loads
    map.once("styledata", () => {
      // Restore view
      map.setCenter(center);
      map.setZoom(zoom);
      map.setPitch(pitch);

      if (!map.getSource(POINT_SOURCE_ID)) {
        map.addSource(POINT_SOURCE_ID, {
          type: "geojson",
          data: geoJsonRef.current,
        });
        map.addSource(CLUSTER_SOURCE_ID, {
          type: "geojson",
          data: toClusterGeoJson(geoJsonRef.current, map.getZoom()),
        });

        // Add all layers (heatmap, clusters, unclustered points)
        map.addLayer({
          id: "sightings-heatmap",
          type: "heatmap",
          source: POINT_SOURCE_ID,
          layout: { visibility: showHeatmap ? "visible" : "none" },
          paint: {
            "heatmap-weight": [
              "interpolate",
              ["linear"],
              ["get", "hotScore"],
              -10,
              0,
              0,
              0.2,
              10,
              1,
            ],
            "heatmap-intensity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              0.5,
              9,
              1.5,
            ],
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(33, 102, 172, 0)",
              0.2,
              "rgba(103, 169, 207, 0.15)",
              0.4,
              "rgba(209, 229, 240, 0.2)",
              0.6,
              "rgba(253, 219, 199, 0.25)",
              0.8,
              "rgba(239, 138, 98, 0.3)",
              1,
              "rgba(178, 24, 43, 0.35)",
            ],
            "heatmap-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              2,
              9,
              20,
              14,
              40,
            ],
            "heatmap-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              7,
              0.8,
              14,
              0.2,
              15,
              0,
            ],
          },
        });

        map.addLayer({
          id: "clusters",
          type: "circle",
          source: CLUSTER_SOURCE_ID,
          filter: ["has", "point_count"],
          layout: { visibility: showHeatmap ? "none" : "visible" },
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["get", "point_count"],
              2,
              22,
              10,
              32,
              30,
              44,
              100,
              58,
              250,
              70,
            ],
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#3a86ff",
              10,
              "#f2c94c",
              30,
              "#f77f00",
              100,
              "#f06449",
            ],
            "circle-opacity": 0.88,
            "circle-stroke-width": [
              "interpolate",
              ["linear"],
              ["get", "point_count"],
              2,
              3,
              100,
              5,
            ],
            "circle-stroke-color": "#ffffff",
          },
        });

        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: CLUSTER_SOURCE_ID,
          filter: ["has", "point_count"],
          layout: {
            visibility: showHeatmap ? "none" : "visible",
            "text-field": [
              "concat",
              ["to-string", ["get", "point_count"]],
              "+",
            ],
            "text-font": ["Noto Sans Regular"],
            "text-size": [
              "interpolate",
              ["linear"],
              ["get", "point_count"],
              2,
              13,
              30,
              16,
              100,
              20,
            ],
            "text-allow-overlap": true,
            "text-ignore-placement": true,
          },
          paint: {
            "text-color": "#ffffff",
            "text-halo-color": "rgba(12, 26, 36, 0.45)",
            "text-halo-width": 1.5,
          },
        });

        map.addLayer({
          id: "unclustered-point-glow",
          type: "circle",
          source: POINT_SOURCE_ID,
          layout: { visibility: showHeatmap ? "none" : "visible" },
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              5,
              7,
              8,
              11,
              14,
              14,
              18,
            ],
            "circle-color": "#f2c94c",
            "circle-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              0.05,
              7,
              0.1,
              11,
              0.18,
            ],
          },
        });

        map.addLayer({
          id: "unclustered-point",
          type: "circle",
          source: POINT_SOURCE_ID,
          layout: { visibility: showHeatmap ? "none" : "visible" },
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              2,
              6,
              3,
              10,
              5,
              13,
              7,
            ],
            "circle-color": [
              "match",
              ["get", "importance"],
              "critical",
              "#f06449",
              "high",
              "#f2c94c",
              "low",
              "#1f6f5b",
              "#3a86ff",
            ],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              0.2,
              6,
              0.32,
              10,
              0.75,
              12,
              1,
            ],
            "circle-stroke-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              0.35,
              10,
              0.75,
              12,
              1,
            ],
          },
        });

        map.addLayer({
          id: "stack-count-label",
          type: "symbol",
          source: POINT_SOURCE_ID,
          filter: [
            "all",
            [">", ["get", "stackCount"], 1],
            ["==", ["get", "stackIndex"], 0],
          ],
          layout: {
            visibility: showHeatmap ? "none" : "visible",
            "text-field": "{stackLabel}",
            "text-font": ["Noto Sans Regular"],
            "text-size": 10,
            "text-offset": [0, 0.05],
            "text-allow-overlap": true,
          },
          minzoom: STACK_LABEL_MIN_ZOOM,
          paint: {
            "text-color": "#ffffff",
          },
        });

        attachInteractionHandlers();
        map.moveLayer("clusters");
        map.moveLayer("cluster-count");

        // Re-add cursor handlers
        map.on(
          "mouseenter",
          "clusters",
          () => (map.getCanvas().style.cursor = "pointer")
        );
        map.on(
          "mouseleave",
          "clusters",
          () => (map.getCanvas().style.cursor = "")
        );
        map.on(
          "mouseenter",
          "unclustered-point",
          () => (map.getCanvas().style.cursor = "pointer")
        );
        map.on(
          "mouseleave",
          "unclustered-point",
          () => (map.getCanvas().style.cursor = "")
        );
      }
    });
  }, [effectiveTheme, handleClusterClick, handlePointClick, showHeatmap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    const pointSource = map.getSource(POINT_SOURCE_ID) as
      | GeoJSONSource
      | undefined;
    if (pointSource) {
      pointSource.setData(geoJson);
    }
    updateClusterSource(map, geoJson);
  }, [geoJson]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedGeofence) {
      console.log("[SightingsMap] No map or selectedGeofence:", {
        hasMap: !!map,
        hasGeofence: !!selectedGeofence,
      });
      return;
    }

    console.log(
      "[SightingsMap] Displaying selected geofence:",
      selectedGeofence
    );
    console.log("[SightingsMap] Polygon:", selectedGeofence.polygon);

    // Ensure style is loaded before manipulating layers
    if (!map.isStyleLoaded()) {
      console.warn("Map style not loaded, deferring geofence display");
      return;
    }

    // Defensive check for polygon structure
    if (!selectedGeofence.polygon || !selectedGeofence.polygon.points) {
      console.error("[SightingsMap] Invalid geofence structure:", {
        hasPolygon: !!selectedGeofence.polygon,
        hasPoints: !!selectedGeofence.polygon?.points,
        geofence: selectedGeofence,
      });
      return;
    }

    const points = selectedGeofence.polygon.points;
    if (!Array.isArray(points) || points.length === 0) {
      console.warn(
        "[SightingsMap] Geofence has no points or invalid points array"
      );
      return;
    }

    console.log(
      `[SightingsMap] Rendering geofence with ${points.length} points`
    );

    // Calculate bounds
    const lngs = points.map((p) => p.lng);
    const lats = points.map((p) => p.lat);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    // Fly to the geofence bounds
    try {
      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        {
          padding: 80,
          maxZoom: 14,
          duration: 1000,
        }
      );
    } catch (error) {
      console.error("Error fitting bounds to geofence:", error);
      return;
    }

    // Add or update the geofence highlight layer
    const geofenceGeoJson = {
      type: "Feature" as const,
      properties: {
        name: selectedGeofence.name,
      },
      geometry: {
        type: "Polygon" as const,
        coordinates: [
          [
            ...points.map((p) => [p.lng, p.lat]),
            [points[0].lng, points[0].lat],
          ],
        ],
      },
    };

    try {
      const source = map.getSource("selected-geofence") as
        | GeoJSONSource
        | undefined;
      if (source) {
        source.setData(geofenceGeoJson);
      } else {
        map.addSource("selected-geofence", {
          type: "geojson",
          data: geofenceGeoJson,
        });

        map.addLayer({
          id: "selected-geofence-fill",
          type: "fill",
          source: "selected-geofence",
          paint: {
            "fill-color": "#f2c94c",
            "fill-opacity": 0.15,
          },
        });

        map.addLayer({
          id: "selected-geofence-outline",
          type: "line",
          source: "selected-geofence",
          paint: {
            "line-color": "#f2c94c",
            "line-width": 3,
          },
        });
      }
    } catch (error) {
      console.error("Error adding geofence layers:", error);
    }
  }, [selectedGeofence]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedSighting) {
      return;
    }

    // Ensure style is loaded before flying to location
    if (!map.isStyleLoaded()) {
      console.warn("Map style not loaded, deferring sighting display");
      return;
    }

    const { lat, lng } = selectedSighting.location;
    const selectedFeature = geoJson.features.find(
      (feature) => feature.properties.id === selectedSighting.id
    );
    const focusCoordinates =
      selectedFeature?.geometry.type === "Point"
        ? (selectedFeature.geometry.coordinates as [number, number])
        : ([lng, lat] as [number, number]);

    try {
      map.easeTo({
        center: focusCoordinates,
        zoom: getDrilldownZoom(map.getZoom()),
        duration: 500,
        essential: true,
      });
    } catch (error) {
      console.error("Error focusing sighting:", error);
      return;
    }

    void showSightingPopup(map, focusCoordinates, selectedSighting);
  }, [geoJson, selectedSighting, showSightingPopup]);

  // Handle report location marker - now depends on mapRef
  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    let mapClickHandler: ((e: maplibregl.MapMouseEvent) => void) | null = null;

    const createOrUpdateMarker = async (
      lng: number,
      lat: number,
      flyTo = false,
      animate = false
    ) => {
      try {
        const maplibre = await loadMaplibre();

        // Create or update marker
        if (!reportMarkerRef.current) {
          const el = document.createElement("div");
          el.className = "report-marker";
          el.style.width = "40px";
          el.style.height = "40px";
          el.style.cursor = "grab";
          el.style.zIndex = "1000";
          el.style.pointerEvents = "auto";

          // Add drop animation if requested
          if (animate) {
            el.style.animation =
              "pinDrop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)";
          }

          el.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#f2c94c" stroke="#0c1a24" stroke-width="2" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" fill="#0c1a24"/>
            </svg>
          `;

          const marker = new maplibre.Marker({
            element: el,
            draggable: true,
            anchor: "bottom",
          })
            .setLngLat([lng, lat])
            .addTo(map);

          marker.on("dragstart", () => {
            el.style.cursor = "grabbing";
          });

          marker.on("drag", () => {
            el.style.animation = "none";
          });

          marker.on("dragend", () => {
            el.style.cursor = "grab";
            const lngLat = marker.getLngLat();
            dispatchEvent(EVENTS.reportLocationUpdated, {
              lat: lngLat.lat,
              lng: lngLat.lng,
            });
          });

          reportMarkerRef.current = marker;

          // Enable map click to place pin (but not on the marker itself)
          mapClickHandler = (e: maplibregl.MapMouseEvent) => {
            // Check if click is on the marker element
            const target = e.originalEvent.target as HTMLElement;
            if (target.closest(".report-marker")) {
              return;
            }
            // Animate pin movement
            el.style.animation = "pinBounce 0.4s ease-out";
            setTimeout(() => {
              el.style.animation = "none";
            }, 400);

            marker.setLngLat(e.lngLat);
            dispatchEvent(EVENTS.reportLocationUpdated, {
              lat: e.lngLat.lat,
              lng: e.lngLat.lng,
            });
          };
          map.on("click", mapClickHandler);
        } else {
          reportMarkerRef.current.setLngLat([lng, lat]);
          const el = reportMarkerRef.current.getElement();
          if (animate) {
            el.style.animation = "pinBounce 0.4s ease-out";
            setTimeout(() => {
              el.style.animation = "none";
            }, 400);
          }
        }

        // Fly to location with zoom
        if (flyTo) {
          map.flyTo({
            center: [lng, lat],
            zoom: Math.max(map.getZoom(), 15),
            duration: 1200,
            essential: true,
          });
        }

        // Dispatch update
        dispatchEvent(EVENTS.reportLocationUpdated, {
          lat,
          lng,
        });
      } catch (error) {
        console.error("Error creating marker:", error);
      }
    };

    const handleFormOpened = () => {
      // Ensure map is loaded before placing pin
      if (!map.isStyleLoaded()) {
        map.once("load", () => {
          const center = map.getCenter();
          const currentZoom = map.getZoom();

          // Zoom in with fly animation
          map.flyTo({
            center: [center.lng, center.lat],
            zoom: Math.max(currentZoom, 15),
            duration: 1000,
            essential: true,
          });

          // Drop pin after slight delay for dramatic effect
          setTimeout(() => {
            void createOrUpdateMarker(center.lng, center.lat, false, true);
          }, 300);
        });
      } else {
        // Map already loaded
        const center = map.getCenter();
        const currentZoom = map.getZoom();

        // Zoom in with fly animation
        map.flyTo({
          center: [center.lng, center.lat],
          zoom: Math.max(currentZoom, 15),
          duration: 1000,
          essential: true,
        });

        // Drop pin after slight delay for dramatic effect
        setTimeout(() => {
          void createOrUpdateMarker(center.lng, center.lat, false, true);
        }, 300);
      }
    };

    const handleLocationSet = async (event: Event) => {
      const detail = (event as CustomEvent).detail as {
        lat: number;
        lng: number;
      };
      await createOrUpdateMarker(detail.lng, detail.lat, true, true);
    };

    const handleFormClosed = () => {
      if (reportMarkerRef.current) {
        reportMarkerRef.current.remove();
        reportMarkerRef.current = null;
      }
      if (mapClickHandler) {
        map.off("click", mapClickHandler);
        mapClickHandler = null;
      }
    };

    window.addEventListener(EVENTS.reportFormOpened, handleFormOpened);
    window.addEventListener(EVENTS.reportLocationSet, handleLocationSet);
    window.addEventListener(EVENTS.reportFormClosed, handleFormClosed);

    return () => {
      window.removeEventListener(EVENTS.reportFormOpened, handleFormOpened);
      window.removeEventListener(EVENTS.reportLocationSet, handleLocationSet);
      window.removeEventListener(EVENTS.reportFormClosed, handleFormClosed);
      if (mapClickHandler) {
        map.off("click", mapClickHandler);
      }
      reportMarkerRef.current?.remove();
      reportMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapRef.current]); // Re-run when map is initialized

  return (
    <div
      data-testid="sightings-map"
      className="absolute inset-0 overflow-hidden z-0"
    >
      <style>{`
        @keyframes pinDrop {
          0% {
            transform: translateY(-200px) scale(0.3);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          70% {
            transform: translateY(10px) scale(1.1);
          }
          85% {
            transform: translateY(-5px) scale(0.95);
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        
        @keyframes pinBounce {
          0%, 100% {
            transform: scale(1) translateY(0);
          }
          30% {
            transform: scale(1.2) translateY(-10px);
          }
          50% {
            transform: scale(0.9) translateY(0);
          }
          70% {
            transform: scale(1.05) translateY(-3px);
          }
        }
        
        .report-marker {
          pointer-events: auto !important;
        }
      `}</style>
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
    </div>
  );
};
