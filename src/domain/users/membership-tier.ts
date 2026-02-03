import { err, ok, type DomainError, type Result } from "@/shared/result";

export type MembershipTier = "free" | "paid" | "admin";

export type MembershipTierLimits = {
  tier: MembershipTier;
  maxGeofenceAreaKm2: number | null; // null = unlimited
  maxPolygonPoints: number | null;
  maxSightingTypes: number | null;
  canCreateGlobalSignals: boolean;
};

// Tier limit constants (also stored in DB for flexibility)
export const TIER_LIMITS: Record<MembershipTier, MembershipTierLimits> = {
  free: {
    tier: "free",
    maxGeofenceAreaKm2: 25,
    maxPolygonPoints: 20,
    maxSightingTypes: 10,
    canCreateGlobalSignals: false,
  },
  paid: {
    tier: "paid",
    maxGeofenceAreaKm2: 500,
    maxPolygonPoints: 100,
    maxSightingTypes: 50,
    canCreateGlobalSignals: false,
  },
  admin: {
    tier: "admin",
    maxGeofenceAreaKm2: null, // unlimited
    maxPolygonPoints: null,
    maxSightingTypes: null,
    canCreateGlobalSignals: true,
  },
};

export const getTierLimits = (tier: MembershipTier): MembershipTierLimits => {
  return TIER_LIMITS[tier];
};

// Validation functions
export const validateGeofenceArea = (
  areaKm2: number,
  tier: MembershipTier
): Result<void, DomainError> => {
  const limits = getTierLimits(tier);
  if (limits.maxGeofenceAreaKm2 === null) {
    return ok(undefined); // unlimited
  }
  if (areaKm2 > limits.maxGeofenceAreaKm2) {
    return err({
      code: "membership.geofence_area_exceeded",
      message: `Geofence area ${areaKm2.toFixed(2)} km² exceeds ${tier} tier limit of ${limits.maxGeofenceAreaKm2} km². Upgrade to paid tier for larger geofences.`,
      field: "polygon",
    });
  }
  return ok(undefined);
};

export const validatePolygonPoints = (
  pointCount: number,
  tier: MembershipTier
): Result<void, DomainError> => {
  const limits = getTierLimits(tier);
  if (limits.maxPolygonPoints === null) {
    return ok(undefined);
  }
  if (pointCount > limits.maxPolygonPoints) {
    return err({
      code: "membership.polygon_points_exceeded",
      message: `Polygon has ${pointCount} points, exceeds ${tier} tier limit of ${limits.maxPolygonPoints}. Upgrade to paid tier for more complex polygons.`,
      field: "polygon",
    });
  }
  return ok(undefined);
};

export const validateSightingTypeCount = (
  typeCount: number,
  tier: MembershipTier
): Result<void, DomainError> => {
  const limits = getTierLimits(tier);
  if (limits.maxSightingTypes === null) {
    return ok(undefined);
  }
  if (typeCount > limits.maxSightingTypes) {
    return err({
      code: "membership.sighting_types_exceeded",
      message: `Signal has ${typeCount} sighting types, exceeds ${tier} tier limit of ${limits.maxSightingTypes}. Upgrade to paid tier for more types.`,
      field: "conditions",
    });
  }
  return ok(undefined);
};

export const validateGlobalSignalPermission = (
  tier: MembershipTier
): Result<void, DomainError> => {
  const limits = getTierLimits(tier);
  if (!limits.canCreateGlobalSignals) {
    return err({
      code: "membership.global_signal_not_allowed",
      message: `${tier} tier users cannot create global signals. Only administrators can create global signals.`,
      field: "target",
    });
  }
  return ok(undefined);
};

// Helper: Calculate polygon area using Shoelace formula
export const calculatePolygonAreaKm2 = (
  points: Array<{ lat: number; lng: number }>
): number => {
  if (points.length < 3) return 0;

  // Earth radius in km
  const R = 6371;

  // Convert to radians
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  let area = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];

    const lat1 = toRad(p1.lat);
    const lng1 = toRad(p1.lng);
    const lat2 = toRad(p2.lat);
    const lng2 = toRad(p2.lng);

    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = Math.abs(area * R * R / 2);
  return area;
};
