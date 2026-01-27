import type { LatLng, Polygon } from "@/domain/geo/geo";

export const pointInPolygon = (polygon: Polygon, point: LatLng): boolean => {
  let inside = false;
  const { points } = polygon;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].lng;
    const yi = points[i].lat;
    const xj = points[j].lng;
    const yj = points[j].lat;
    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng <
        ((xj - xi) * (point.lat - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
};

export const polygonWithinPolygon = (inner: Polygon, outer: Polygon): boolean =>
  inner.points.every((point) => pointInPolygon(outer, point));
