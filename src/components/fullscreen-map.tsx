"use client";

import type maplibregl from "maplibre-gl";
import type { GeoJSONSource } from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { SightingSchema } from "@/contracts/sighting";
import { EVENTS } from "@/shared/events";
import { loadMaplibre } from "@/shared/maplibre";
import { config } from "@/shared/config";
import { useTheme } from "@/hooks/useTheme";

type ApiResponse<T> = {
  data: T;
};

type SightingRecord = z.infer<typeof SightingSchema>;

const toGeoJson = (sightings: SightingRecord[]) => ({
  type: "FeatureCollection" as const,
  features: sightings.map((sighting) => ({
    type: "Feature" as const,
    properties: {
      id: sighting.id,
      title: sighting.description,
      category: sighting.categoryId,
      importance: sighting.importance ?? "normal",
      status: sighting.status,
      description: sighting.description,
    },
    geometry: {
      type: "Point" as const,
      coordinates: [sighting.location.lng, sighting.location.lat],
    },
  })),
});

export const FullscreenMap = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const { effectiveTheme } = useTheme();

  const [sightings, setSightings] = useState<SightingRecord[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [mapStatus, setMapStatus] = useState<"loading" | "loaded" | "error">(
    "loading"
  );

  const geoJson = useMemo(() => toGeoJson(sightings), [sightings]);
  const geoJsonRef = useRef(geoJson);

  useEffect(() => {
    geoJsonRef.current = geoJson;
  }, [geoJson]);

  const loadSightings = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await fetch("/api/sightings");
      if (!response.ok) {
        throw new Error("Request failed.");
      }
      const payload = (await response.json()) as ApiResponse<unknown>;
      const parsed = SightingSchema.array().safeParse(payload.data);
      if (!parsed.success) {
        throw new Error("Invalid payload.");
      }
      setSightings(parsed.data);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadSightings();
  }, [loadSightings]);

  useEffect(() => {
    const handler = () => {
      void loadSightings();
    };
    window.addEventListener(EVENTS.sightingsUpdated, handler);
    return () => window.removeEventListener(EVENTS.sightingsUpdated, handler);
  }, [loadSightings]);

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

      map.on("load", () => {
        setMapStatus("loaded");
        map.addSource("sightings", {
          type: "geojson",
          data: geoJsonRef.current,
        });

        map.addLayer({
          id: "sightings-glow",
          type: "circle",
          source: "sightings",
          paint: {
            "circle-radius": 20,
            "circle-color": "#f2c94c",
            "circle-opacity": 0.2,
          },
        });

        map.addLayer({
          id: "sightings",
          type: "circle",
          source: "sightings",
          paint: {
            "circle-radius": 8,
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
            "circle-stroke-color": "#0c1a24",
          },
        });

        map.on("click", "sightings", (event) => {
          const feature = event.features?.[0];
          if (!feature || !event.lngLat) {
            return;
          }
          const properties = feature.properties as Record<string, string>;
          popupRef.current?.remove();
          popupRef.current = new maplibre.Popup({
            closeButton: false,
            offset: 12,
          })
            .setLngLat(event.lngLat)
            .setHTML(
              `<div style="font-family: var(--font-body); color: #0c1a24;">
                <div style="font-weight: 600; margin-bottom: 6px;">${properties.title}</div>
                <div style="font-size: 12px; opacity: 0.75;">${properties.category}</div>
                <div style="font-size: 12px; margin-top: 6px;">${properties.description}</div>
              </div>`
            )
            .addTo(map);
        });

        map.on("error", (event) => {
          if (event.error) {
            console.error("Map error:", event.error);
            setMapStatus("error");
          }
        });

        map.resize();
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
    if (!map || mapStatus !== "loaded") return;

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

      // Re-add sightings source and layers
      if (!map.getSource("sightings")) {
        map.addSource("sightings", {
          type: "geojson",
          data: geoJsonRef.current,
        });

        map.addLayer({
          id: "sightings-glow",
          type: "circle",
          source: "sightings",
          paint: {
            "circle-radius": 20,
            "circle-color": "#f2c94c",
            "circle-opacity": 0.2,
          },
        });

        map.addLayer({
          id: "sightings",
          type: "circle",
          source: "sightings",
          paint: {
            "circle-radius": 8,
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
            "circle-stroke-color": "#0c1a24",
          },
        });
      }
    });
  }, [effectiveTheme, mapStatus]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    const source = map.getSource("sightings") as GeoJSONSource | undefined;
    if (source) {
      source.setData(geoJson);
    }
  }, [geoJson]);

  return (
    <div className="fixed inset-0 bg-gray-100">
      <div
        ref={containerRef}
        className="absolute inset-0 z-0"
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
      {mapStatus === "loading" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="text-lg font-semibold text-[color:var(--ink)]">
              Loading map...
            </div>
            <div className="mt-2 text-sm text-[color:var(--slate)]">
              Initializing MapLibre
            </div>
          </div>
        </div>
      )}
      {mapStatus === "error" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100">
          <div className="max-w-md rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center">
            <div className="text-lg font-semibold text-rose-800">
              Map failed to load
            </div>
            <div className="mt-2 text-sm text-rose-600">
              Check console for details
            </div>
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute left-6 top-6 z-10 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink)] shadow-md">
        Live signals
      </div>
      <div className="pointer-events-none absolute right-6 top-6 z-10 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--slate)] shadow-md">
        {status === "loading"
          ? "Loading..."
          : status === "error"
            ? "Map data offline"
            : `${sightings.length} signals`}
      </div>
      <Link
        href="/"
        className="absolute left-6 bottom-6 z-10 rounded-full border border-[color:var(--ink)]/10 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--ink)] shadow-md"
      >
        Back home
      </Link>
    </div>
  );
};
