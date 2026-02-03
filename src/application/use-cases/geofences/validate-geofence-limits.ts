import type { Polygon } from "@/domain/geo/geo";
import type { MembershipTier } from "@/domain/users/membership-tier";
import {
  validateGeofenceArea,
  validatePolygonPoints,
  calculatePolygonAreaKm2,
} from "@/domain/users/membership-tier";
import { err, ok, type DomainError, type Result } from "@/shared/result";

export type ValidateGeofenceLimitsInput = {
  polygon: Polygon;
  userTier: MembershipTier;
};

export type ValidateGeofenceLimitsResult = {
  isValid: boolean;
  areaKm2: number;
  pointCount: number;
};

export type ValidateGeofenceLimits = (
  input: ValidateGeofenceLimitsInput
) => Promise<Result<ValidateGeofenceLimitsResult, DomainError>>;

/**
 * Validate Geofence Limits Use Case
 *
 * Validates that a geofence polygon meets the requirements for a user's membership tier:
 * - Area must not exceed tier's maximum area (km²)
 * - Number of points must not exceed tier's maximum
 *
 * Returns validation result with area and point count for informational purposes.
 */
export const buildValidateGeofenceLimits =
  (): ValidateGeofenceLimits => {
    return async (input) => {
      const { polygon, userTier } = input;

      // Calculate polygon area
      const areaKm2 = calculatePolygonAreaKm2(polygon.points);
      const pointCount = polygon.points.length;

      // Validate area against tier limits
      const areaValidation = validateGeofenceArea(areaKm2, userTier);
      if (!areaValidation.ok) {
        return areaValidation;
      }

      // Validate point count against tier limits
      const pointsValidation = validatePolygonPoints(pointCount, userTier);
      if (!pointsValidation.ok) {
        return pointsValidation;
      }

      return ok({
        isValid: true,
        areaKm2,
        pointCount,
      });
    };
  };
