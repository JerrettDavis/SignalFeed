import {
  getTierLimits,
  validateGeofenceArea,
  validatePolygonPoints,
  validateSightingTypeCount,
  validateGlobalSignalPermission,
  calculatePolygonAreaKm2,
  TIER_LIMITS,
  type MembershipTier,
} from "@/domain/users/membership-tier";

describe("getTierLimits", () => {
  it("returns correct limits for free tier", () => {
    const limits = getTierLimits("free");
    expect(limits.tier).toBe("free");
    expect(limits.maxGeofenceAreaKm2).toBe(25);
    expect(limits.maxPolygonPoints).toBe(20);
    expect(limits.maxSightingTypes).toBe(10);
    expect(limits.canCreateGlobalSignals).toBe(false);
  });

  it("returns correct limits for paid tier", () => {
    const limits = getTierLimits("paid");
    expect(limits.tier).toBe("paid");
    expect(limits.maxGeofenceAreaKm2).toBe(500);
    expect(limits.maxPolygonPoints).toBe(100);
    expect(limits.maxSightingTypes).toBe(50);
    expect(limits.canCreateGlobalSignals).toBe(false);
  });

  it("returns correct limits for admin tier", () => {
    const limits = getTierLimits("admin");
    expect(limits.tier).toBe("admin");
    expect(limits.maxGeofenceAreaKm2).toBe(null);
    expect(limits.maxPolygonPoints).toBe(null);
    expect(limits.maxSightingTypes).toBe(null);
    expect(limits.canCreateGlobalSignals).toBe(true);
  });
});

describe("validateGeofenceArea", () => {
  it("accepts area within free tier limit", () => {
    const result = validateGeofenceArea(20, "free");
    expect(result.ok).toBe(true);
  });

  it("accepts area exactly at free tier limit", () => {
    const result = validateGeofenceArea(25, "free");
    expect(result.ok).toBe(true);
  });

  it("rejects area exceeding free tier limit", () => {
    const result = validateGeofenceArea(30, "free");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("membership.geofence_area_exceeded");
      expect(result.error.message).toContain("30.00 km²");
      expect(result.error.message).toContain("25 km²");
      expect(result.error.message).toContain("Upgrade to paid tier");
    }
  });

  it("accepts area within paid tier limit", () => {
    const result = validateGeofenceArea(450, "paid");
    expect(result.ok).toBe(true);
  });

  it("rejects area exceeding paid tier limit", () => {
    const result = validateGeofenceArea(600, "paid");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("membership.geofence_area_exceeded");
      expect(result.error.message).toContain("600.00 km²");
      expect(result.error.message).toContain("500 km²");
    }
  });

  it("accepts any area for admin tier", () => {
    const result = validateGeofenceArea(10000, "admin");
    expect(result.ok).toBe(true);
  });

  it("accepts very large area for admin tier", () => {
    const result = validateGeofenceArea(999999, "admin");
    expect(result.ok).toBe(true);
  });

  it("formats decimal areas correctly in error message", () => {
    const result = validateGeofenceArea(25.123456, "free");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("25.12 km²");
    }
  });
});

describe("validatePolygonPoints", () => {
  it("accepts point count within free tier limit", () => {
    const result = validatePolygonPoints(15, "free");
    expect(result.ok).toBe(true);
  });

  it("accepts point count exactly at free tier limit", () => {
    const result = validatePolygonPoints(20, "free");
    expect(result.ok).toBe(true);
  });

  it("rejects point count exceeding free tier limit", () => {
    const result = validatePolygonPoints(25, "free");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("membership.polygon_points_exceeded");
      expect(result.error.message).toContain("25 points");
      expect(result.error.message).toContain("20");
      expect(result.error.message).toContain("Upgrade to paid tier");
      expect(result.error.field).toBe("polygon");
    }
  });

  it("accepts point count within paid tier limit", () => {
    const result = validatePolygonPoints(80, "paid");
    expect(result.ok).toBe(true);
  });

  it("rejects point count exceeding paid tier limit", () => {
    const result = validatePolygonPoints(150, "paid");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("membership.polygon_points_exceeded");
    }
  });

  it("accepts any point count for admin tier", () => {
    const result = validatePolygonPoints(5000, "admin");
    expect(result.ok).toBe(true);
  });

  it("accepts minimum point count for polygon", () => {
    const result = validatePolygonPoints(3, "free");
    expect(result.ok).toBe(true);
  });
});

describe("validateSightingTypeCount", () => {
  it("accepts type count within free tier limit", () => {
    const result = validateSightingTypeCount(8, "free");
    expect(result.ok).toBe(true);
  });

  it("accepts type count exactly at free tier limit", () => {
    const result = validateSightingTypeCount(10, "free");
    expect(result.ok).toBe(true);
  });

  it("rejects type count exceeding free tier limit", () => {
    const result = validateSightingTypeCount(15, "free");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("membership.sighting_types_exceeded");
      expect(result.error.message).toContain("15 sighting types");
      expect(result.error.message).toContain("10");
      expect(result.error.message).toContain("Upgrade to paid tier");
      expect(result.error.field).toBe("conditions");
    }
  });

  it("accepts type count within paid tier limit", () => {
    const result = validateSightingTypeCount(40, "paid");
    expect(result.ok).toBe(true);
  });

  it("rejects type count exceeding paid tier limit", () => {
    const result = validateSightingTypeCount(60, "paid");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("membership.sighting_types_exceeded");
    }
  });

  it("accepts any type count for admin tier", () => {
    const result = validateSightingTypeCount(1000, "admin");
    expect(result.ok).toBe(true);
  });

  it("accepts zero type count", () => {
    const result = validateSightingTypeCount(0, "free");
    expect(result.ok).toBe(true);
  });

  it("accepts single type count", () => {
    const result = validateSightingTypeCount(1, "free");
    expect(result.ok).toBe(true);
  });
});

describe("validateGlobalSignalPermission", () => {
  it("rejects global signals for free tier", () => {
    const result = validateGlobalSignalPermission("free");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("membership.global_signal_not_allowed");
      expect(result.error.message).toContain("free tier");
      expect(result.error.message).toContain("cannot create global signals");
      expect(result.error.message).toContain("Only administrators");
      expect(result.error.field).toBe("target");
    }
  });

  it("rejects global signals for paid tier", () => {
    const result = validateGlobalSignalPermission("paid");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("membership.global_signal_not_allowed");
      expect(result.error.message).toContain("paid tier");
    }
  });

  it("accepts global signals for admin tier", () => {
    const result = validateGlobalSignalPermission("admin");
    expect(result.ok).toBe(true);
  });
});

describe("calculatePolygonAreaKm2", () => {
  it("returns 0 for polygon with less than 3 points", () => {
    const area = calculatePolygonAreaKm2([]);
    expect(area).toBe(0);
  });

  it("returns 0 for polygon with 1 point", () => {
    const area = calculatePolygonAreaKm2([{ lat: 0, lng: 0 }]);
    expect(area).toBe(0);
  });

  it("returns 0 for polygon with 2 points", () => {
    const area = calculatePolygonAreaKm2([
      { lat: 0, lng: 0 },
      { lat: 1, lng: 1 },
    ]);
    expect(area).toBe(0);
  });

  it("calculates area for small triangle (roughly 1 degree square)", () => {
    const area = calculatePolygonAreaKm2([
      { lat: 0, lng: 0 },
      { lat: 1, lng: 0 },
      { lat: 0, lng: 1 },
    ]);
    // Area should be positive
    expect(area).toBeGreaterThan(0);
    // Area of ~0.5 degree² triangle at equator should be thousands of km²
    expect(area).toBeGreaterThan(1000);
    expect(area).toBeLessThan(20000);
  });

  it("calculates area for square polygon", () => {
    const area = calculatePolygonAreaKm2([
      { lat: 0, lng: 0 },
      { lat: 1, lng: 0 },
      { lat: 1, lng: 1 },
      { lat: 0, lng: 1 },
    ]);
    // Area should be positive
    expect(area).toBeGreaterThan(0);
    // Area of 1 degree² square at equator should be ~12,000 km²
    expect(area).toBeGreaterThan(10000);
    expect(area).toBeLessThan(15000);
  });

  it("calculates area for polygon at different latitudes", () => {
    // Same size polygon at higher latitude should have smaller area
    const equatorArea = calculatePolygonAreaKm2([
      { lat: 0, lng: 0 },
      { lat: 1, lng: 0 },
      { lat: 1, lng: 1 },
      { lat: 0, lng: 1 },
    ]);

    const polarArea = calculatePolygonAreaKm2([
      { lat: 60, lng: 0 },
      { lat: 61, lng: 0 },
      { lat: 61, lng: 1 },
      { lat: 60, lng: 1 },
    ]);

    // Polar area should be smaller due to Earth's curvature
    expect(polarArea).toBeLessThan(equatorArea);
    expect(polarArea).toBeGreaterThan(0);
  });

  it("calculates area for complex polygon (pentagon)", () => {
    const area = calculatePolygonAreaKm2([
      { lat: 0, lng: 0 },
      { lat: 1, lng: 0 },
      { lat: 1.5, lng: 0.5 },
      { lat: 1, lng: 1 },
      { lat: 0, lng: 1 },
    ]);
    expect(area).toBeGreaterThan(0);
  });

  it("returns absolute value (handles clockwise and counter-clockwise)", () => {
    // Clockwise
    const clockwise = calculatePolygonAreaKm2([
      { lat: 0, lng: 0 },
      { lat: 1, lng: 0 },
      { lat: 1, lng: 1 },
      { lat: 0, lng: 1 },
    ]);

    // Counter-clockwise
    const counterClockwise = calculatePolygonAreaKm2([
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 },
      { lat: 1, lng: 1 },
      { lat: 1, lng: 0 },
    ]);

    // Should be same area (absolute value)
    expect(Math.abs(clockwise - counterClockwise)).toBeLessThan(0.01);
  });

  it("calculates reasonable area for real-world geofence (small city park)", () => {
    // Roughly 500m x 500m square
    const area = calculatePolygonAreaKm2([
      { lat: 35.0, lng: -120.0 },
      { lat: 35.005, lng: -120.0 },
      { lat: 35.005, lng: -120.005 },
      { lat: 35.0, lng: -120.005 },
    ]);
    // Should be around 0.25 km² (250,000 m²)
    expect(area).toBeGreaterThan(0.2);
    expect(area).toBeLessThan(0.4);
  });

  it("handles very small polygon (few meters)", () => {
    // Roughly 10m x 10m square
    const area = calculatePolygonAreaKm2([
      { lat: 35.0, lng: -120.0 },
      { lat: 35.0001, lng: -120.0 },
      { lat: 35.0001, lng: -120.0001 },
      { lat: 35.0, lng: -120.0001 },
    ]);
    // Should be very small but positive
    expect(area).toBeGreaterThan(0);
    expect(area).toBeLessThan(0.001); // Less than 1000 m²
  });
});

describe("TIER_LIMITS constant", () => {
  it("defines all three tiers", () => {
    expect(Object.keys(TIER_LIMITS)).toEqual(["free", "paid", "admin"]);
  });

  it("free tier has restrictive limits", () => {
    expect(TIER_LIMITS.free.maxGeofenceAreaKm2).toBeLessThan(100);
    expect(TIER_LIMITS.free.maxPolygonPoints).toBeLessThan(50);
    expect(TIER_LIMITS.free.maxSightingTypes).toBeLessThan(20);
    expect(TIER_LIMITS.free.canCreateGlobalSignals).toBe(false);
  });

  it("paid tier has expanded limits", () => {
    expect(TIER_LIMITS.paid.maxGeofenceAreaKm2).toBeGreaterThan(
      TIER_LIMITS.free.maxGeofenceAreaKm2 || 0
    );
    expect(TIER_LIMITS.paid.maxPolygonPoints).toBeGreaterThan(
      TIER_LIMITS.free.maxPolygonPoints || 0
    );
    expect(TIER_LIMITS.paid.maxSightingTypes).toBeGreaterThan(
      TIER_LIMITS.free.maxSightingTypes || 0
    );
    expect(TIER_LIMITS.paid.canCreateGlobalSignals).toBe(false);
  });

  it("admin tier has unlimited limits", () => {
    expect(TIER_LIMITS.admin.maxGeofenceAreaKm2).toBe(null);
    expect(TIER_LIMITS.admin.maxPolygonPoints).toBe(null);
    expect(TIER_LIMITS.admin.maxSightingTypes).toBe(null);
    expect(TIER_LIMITS.admin.canCreateGlobalSignals).toBe(true);
  });
});
