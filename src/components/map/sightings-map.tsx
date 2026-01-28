"use client";

import type maplibregl from "maplibre-gl";
import type { GeoJSONSource } from "maplibre-gl";
import { useEffect, useMemo, useRef } from "react";
import { config } from "@/shared/config";
import { loadMaplibre } from "@/shared/maplibre";
import type { SightingCard } from "@/data/mock-sightings";
import { useTheme } from "@/hooks/useTheme";

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

const toGeoJson = (sightings: SightingCard[]) => ({
  type: "FeatureCollection" as const,
  features: sightings.map((sighting) => ({
    type: "Feature" as const,
    properties: {
      id: sighting.id,
      title: sighting.title,
      category: sighting.category,
      importance: sighting.importance,
      status: sighting.status,
      description: sighting.description,
    },
    geometry: {
      type: "Point" as const,
      coordinates: [sighting.location.lng, sighting.location.lat],
    },
  })),
});

export const SightingsMap = ({
  sightings,
  selectedGeofence,
  selectedSighting,
}: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const { effectiveTheme } = useTheme();

  const geoJson = useMemo(() => toGeoJson(sightings), [sightings]);
  const geoJsonRef = useRef(geoJson);

  useEffect(() => {
    geoJsonRef.current = geoJson;
  }, [geoJson]);

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
        map.addSource("sightings", {
          type: "geojson",
          data: geoJsonRef.current,
        });

        map.addLayer({
          id: "sightings-glow",
          type: "circle",
          source: "sightings",
          paint: {
            "circle-radius": 16,
            "circle-color": "#f2c94c",
            "circle-opacity": 0.2,
          },
        });

        map.addLayer({
          id: "sightings",
          type: "circle",
          source: "sightings",
          paint: {
            "circle-radius": 7,
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

          // Save lngLat before setTimeout
          const lngLat = { lng: event.lngLat.lng, lat: event.lngLat.lat };

          // Zoom to the sighting with smooth animation
          map.flyTo({
            center: [lngLat.lng, lngLat.lat],
            zoom: 15,
            duration: 1000,
            essential: true,
          });

          // Show popup after a brief delay to let the zoom settle
          setTimeout(async () => {
            const maplibreModule = await loadMaplibre();
            popupRef.current?.remove();
            popupRef.current = new maplibreModule.Popup({
              closeButton: false,
              offset: 12,
            })
              .setLngLat([lngLat.lng, lngLat.lat])
              .setHTML(
                `<div style="font-family: var(--font-body); color: #0c1a24;">
                  <div style="font-weight: 600; margin-bottom: 6px;">${properties.title}</div>
                  <div style="font-size: 12px; opacity: 0.75;">${properties.category}</div>
                  <div style="font-size: 12px; margin-top: 6px;">${properties.description}</div>
                </div>`
              )
              .addTo(map);
          }, 500);
        });

        // Change cursor on hover
        map.on("mouseenter", "sightings", () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", "sightings", () => {
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
            "circle-radius": 16,
            "circle-color": "#f2c94c",
            "circle-opacity": 0.2,
          },
        });

        map.addLayer({
          id: "sightings",
          type: "circle",
          source: "sightings",
          paint: {
            "circle-radius": 7,
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

      // Re-add geofence layer if it exists
      if (selectedGeofence && !map.getSource("selected-geofence")) {
        const points = selectedGeofence.polygon.points;
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
    });
  }, [effectiveTheme, selectedGeofence]);

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

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedGeofence) {
      return;
    }

    const points = selectedGeofence.polygon.points;
    if (points.length === 0) {
      return;
    }

    // Calculate bounds
    const lngs = points.map((p) => p.lng);
    const lats = points.map((p) => p.lat);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    // Fly to the geofence bounds
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
  }, [selectedGeofence]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedSighting) {
      return;
    }

    const { lat, lng } = selectedSighting.location;

    // Zoom to the sighting with smooth animation
    map.flyTo({
      center: [lng, lat],
      zoom: 15,
      duration: 1000,
      essential: true,
    });

    // Import maplibre dynamically to show popup
    void loadMaplibre().then((maplibre) => {
      setTimeout(() => {
        popupRef.current?.remove();
        popupRef.current = new maplibre.Popup({
          closeButton: false,
          offset: 12,
        })
          .setLngLat([lng, lat])
          .setHTML(
            `<div style="font-family: var(--font-body); color: #0c1a24;">
              <div style="font-weight: 600; margin-bottom: 6px;">${selectedSighting.title}</div>
              <div style="font-size: 12px; opacity: 0.75;">${selectedSighting.category}</div>
              <div style="font-size: 12px; margin-top: 6px;">${selectedSighting.description}</div>
            </div>`
          )
          .addTo(map);
      }, 500);
    });
  }, [selectedSighting]);

  return (
    <div
      data-testid="sightings-map"
      className="absolute inset-0 overflow-hidden"
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
    </div>
  );
};
