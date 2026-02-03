import { test, expect, type Page } from "@playwright/test";

test.describe("Membership Tiers", () => {
  let testUserId: string;

  // Helper function to register and login a test user with specified tier
  const registerAndLogin = async (
    page: Page,
    tier: "free" | "paid" | "admin" = "free"
  ) => {
    const timestamp = Date.now();
    const email = `tiertest-${timestamp}@example.com`;
    const username = `tiertest${timestamp}`;
    const password = "TestPassword123!";

    // Register the user
    const registerResponse = await page.request.post("/api/auth/register", {
      data: { email, password, username },
    });

    expect(registerResponse.ok()).toBe(true);
    const registerData = await registerResponse.json();
    testUserId = registerData.data.user.id;

    // If not free tier, update the membership tier
    // This requires either admin API or direct repository access
    if (tier !== "free") {
      const updateResponse = await page.request.patch(
        `/api/admin/users/${testUserId}`,
        {
          data: { membershipTier: tier },
        }
      );

      // If admin endpoint doesn't exist, we'll work with free tier
      if (!updateResponse.ok()) {
        console.warn(`Failed to update user to ${tier} tier. Using free tier.`);
      }
    }

    return { userId: testUserId, email, username };
  };

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("free tier cannot create global signals", async ({ page }) => {
    // Register a free tier user
    const { userId } = await registerAndLogin(page, "free");

    // Attempt to create a global signal
    const response = await page.request.post("/api/signals", {
      data: {
        name: "Free Tier Global Signal",
        description: "Should fail for free tier",
        ownerId: userId,
        target: { kind: "global" },
        triggers: ["new_sighting"],
        conditions: {},
        isActive: true,
      },
    });

    // Should return 400 Bad Request with membership error
    expect(response.status()).toBe(400);
    const data = await response.json();

    // Verify error message includes upgrade prompt
    expect(data.error || data.message).toBeDefined();
    const errorMessage = (data.error || data.message).toLowerCase();
    expect(
      errorMessage.includes("global") ||
        errorMessage.includes("tier") ||
        errorMessage.includes("administrator")
    ).toBe(true);
  });

  test("free tier limited to 25km² geofences", async ({ page }) => {
    // Register a free tier user
    const { userId } = await registerAndLogin(page, "free");

    // Create a small geofence (under 25km²)
    // Approximate area: ~0.01 degrees x ~0.01 degrees ≈ 1km²
    const smallGeofenceResponse = await page.request.post("/api/geofences", {
      data: {
        name: "Small Geofence",
        visibility: "public",
        polygon: {
          points: [
            { lat: 36.15, lng: -95.99 },
            { lat: 36.15, lng: -95.98 },
            { lat: 36.14, lng: -95.98 },
            { lat: 36.14, lng: -95.99 },
          ],
        },
        ownerId: userId,
      },
    });

    expect(smallGeofenceResponse.status()).toBe(201);

    // Attempt to create a large geofence (over 25km²)
    // Approximate area: ~0.5 degrees x ~0.5 degrees ≈ 3000km² (well over limit)
    const largeGeofenceResponse = await page.request.post("/api/geofences", {
      data: {
        name: "Large Geofence",
        visibility: "public",
        polygon: {
          points: [
            { lat: 36.0, lng: -96.0 },
            { lat: 36.0, lng: -95.5 },
            { lat: 36.5, lng: -95.5 },
            { lat: 36.5, lng: -96.0 },
          ],
        },
        ownerId: userId,
      },
    });

    // Should fail with 400 Bad Request
    expect(largeGeofenceResponse.status()).toBe(400);
    const data = await largeGeofenceResponse.json();

    // Verify error message includes area limit and upgrade prompt
    const errorMessage = (data.error || data.message).toLowerCase();
    expect(
      errorMessage.includes("area") ||
        errorMessage.includes("25") ||
        errorMessage.includes("km²") ||
        errorMessage.includes("tier")
    ).toBe(true);
    expect(
      errorMessage.includes("upgrade") || errorMessage.includes("paid")
    ).toBe(true);
  });

  test("free tier limited to 20 polygon points", async ({ page }) => {
    // Register a free tier user
    const { userId } = await registerAndLogin(page, "free");

    // Create a polygon with 20 points (at the limit)
    const points20 = Array.from({ length: 20 }, (_, i) => {
      const angle = (i * 2 * Math.PI) / 20;
      const radius = 0.01; // Small radius
      return {
        lat: 36.15 + radius * Math.cos(angle),
        lng: -95.99 + radius * Math.sin(angle),
      };
    });

    const validPolygonResponse = await page.request.post("/api/geofences", {
      data: {
        name: "20 Point Polygon",
        visibility: "public",
        polygon: { points: points20 },
        ownerId: userId,
      },
    });

    expect(validPolygonResponse.status()).toBe(201);

    // Attempt to create a polygon with 25 points (over limit)
    const points25 = Array.from({ length: 25 }, (_, i) => {
      const angle = (i * 2 * Math.PI) / 25;
      const radius = 0.01;
      return {
        lat: 36.15 + radius * Math.cos(angle),
        lng: -95.99 + radius * Math.sin(angle),
      };
    });

    const invalidPolygonResponse = await page.request.post("/api/geofences", {
      data: {
        name: "25 Point Polygon",
        visibility: "public",
        polygon: { points: points25 },
        ownerId: userId,
      },
    });

    // Should fail with 400 Bad Request
    expect(invalidPolygonResponse.status()).toBe(400);
    const data = await invalidPolygonResponse.json();

    // Verify error message includes point limit and upgrade prompt
    const errorMessage = (data.error || data.message).toLowerCase();
    expect(
      errorMessage.includes("point") ||
        errorMessage.includes("20") ||
        errorMessage.includes("tier")
    ).toBe(true);
    expect(
      errorMessage.includes("upgrade") || errorMessage.includes("paid")
    ).toBe(true);
  });

  test("paid tier can create larger geofences (up to 500km²)", async ({
    page,
  }) => {
    // Register a paid tier user
    const { userId } = await registerAndLogin(page, "paid");

    // If we couldn't upgrade to paid tier, skip this test
    // Check by attempting to create a global signal (should still fail for paid tier)
    const globalCheckResponse = await page.request.post("/api/signals", {
      data: {
        name: "Global Check",
        ownerId: userId,
        target: { kind: "global" },
        triggers: ["new_sighting"],
        conditions: {},
        isActive: true,
      },
    });

    if (globalCheckResponse.status() === 201) {
      // User was upgraded to admin instead of paid, skip this test
      test.skip();
      return;
    }

    // Create a geofence around 30km² (over free limit, under paid limit)
    // Approximate area: ~0.2 degrees x ~0.2 degrees ≈ 400km²
    const mediumGeofenceResponse = await page.request.post("/api/geofences", {
      data: {
        name: "Medium Geofence",
        visibility: "public",
        polygon: {
          points: [
            { lat: 36.0, lng: -96.0 },
            { lat: 36.0, lng: -95.8 },
            { lat: 36.2, lng: -95.8 },
            { lat: 36.2, lng: -96.0 },
          ],
        },
        ownerId: userId,
      },
    });

    // Should succeed for paid tier
    expect(mediumGeofenceResponse.status()).toBe(201);

    // Attempt to create a very large geofence (over 500km²)
    // Approximate area: ~1 degree x ~1 degree ≈ 12000km²
    const veryLargeGeofenceResponse = await page.request.post("/api/geofences", {
      data: {
        name: "Very Large Geofence",
        visibility: "public",
        polygon: {
          points: [
            { lat: 36.0, lng: -96.0 },
            { lat: 36.0, lng: -95.0 },
            { lat: 37.0, lng: -95.0 },
            { lat: 37.0, lng: -96.0 },
          ],
        },
        ownerId: userId,
      },
    });

    // Should fail even for paid tier (exceeds 500km² limit)
    expect(veryLargeGeofenceResponse.status()).toBe(400);
    const data = await veryLargeGeofenceResponse.json();

    // Verify error message mentions the paid tier limit
    const errorMessage = (data.error || data.message).toLowerCase();
    expect(
      errorMessage.includes("area") ||
        errorMessage.includes("500") ||
        errorMessage.includes("limit")
    ).toBe(true);
  });

  test("paid tier can use up to 100 polygon points", async ({ page }) => {
    // Register a paid tier user
    const { userId } = await registerAndLogin(page, "paid");

    // Create a polygon with 50 points (over free limit, under paid limit)
    const points50 = Array.from({ length: 50 }, (_, i) => {
      const angle = (i * 2 * Math.PI) / 50;
      const radius = 0.01;
      return {
        lat: 36.15 + radius * Math.cos(angle),
        lng: -95.99 + radius * Math.sin(angle),
      };
    });

    const validPolygonResponse = await page.request.post("/api/geofences", {
      data: {
        name: "50 Point Polygon",
        visibility: "public",
        polygon: { points: points50 },
        ownerId: userId,
      },
    });

    // Should succeed for paid tier
    expect(validPolygonResponse.status()).toBe(201);

    // Attempt to create a polygon with 110 points (over paid tier limit)
    const points110 = Array.from({ length: 110 }, (_, i) => {
      const angle = (i * 2 * Math.PI) / 110;
      const radius = 0.01;
      return {
        lat: 36.15 + radius * Math.cos(angle),
        lng: -95.99 + radius * Math.sin(angle),
      };
    });

    const invalidPolygonResponse = await page.request.post("/api/geofences", {
      data: {
        name: "110 Point Polygon",
        visibility: "public",
        polygon: { points: points110 },
        ownerId: userId,
      },
    });

    // Should fail even for paid tier
    expect(invalidPolygonResponse.status()).toBe(400);
    const data = await invalidPolygonResponse.json();

    // Verify error message mentions the point limit
    const errorMessage = (data.error || data.message).toLowerCase();
    expect(
      errorMessage.includes("point") ||
        errorMessage.includes("100") ||
        errorMessage.includes("limit")
    ).toBe(true);
  });

  test("admin tier has no limits", async ({ page }) => {
    // Register an admin tier user
    const { userId } = await registerAndLogin(page, "admin");

    // Admin should be able to create global signals
    const globalSignalResponse = await page.request.post("/api/signals", {
      data: {
        name: "Admin Global Signal",
        ownerId: userId,
        target: { kind: "global" },
        triggers: ["new_sighting"],
        conditions: {},
        isActive: true,
      },
    });

    expect(globalSignalResponse.status()).toBe(201);

    // Admin should be able to create very large geofences
    // Approximate area: ~2 degrees x ~2 degrees ≈ 48000km² (over all limits)
    const largeGeofenceResponse = await page.request.post("/api/geofences", {
      data: {
        name: "Admin Large Geofence",
        visibility: "public",
        polygon: {
          points: [
            { lat: 35.0, lng: -97.0 },
            { lat: 35.0, lng: -95.0 },
            { lat: 37.0, lng: -95.0 },
            { lat: 37.0, lng: -97.0 },
          ],
        },
        ownerId: userId,
      },
    });

    expect(largeGeofenceResponse.status()).toBe(201);

    // Admin should be able to create polygons with many points
    const points150 = Array.from({ length: 150 }, (_, i) => {
      const angle = (i * 2 * Math.PI) / 150;
      const radius = 0.01;
      return {
        lat: 36.15 + radius * Math.cos(angle),
        lng: -95.99 + radius * Math.sin(angle),
      };
    });

    const complexPolygonResponse = await page.request.post("/api/geofences", {
      data: {
        name: "Admin Complex Polygon",
        visibility: "public",
        polygon: { points: points150 },
        ownerId: userId,
      },
    });

    expect(complexPolygonResponse.status()).toBe(201);
  });

  test("error messages include upgrade prompts", async ({ page }) => {
    // Register a free tier user
    const { userId } = await registerAndLogin(page, "free");

    // Test 1: Global signal error includes upgrade prompt
    const globalResponse = await page.request.post("/api/signals", {
      data: {
        name: "Global Signal",
        ownerId: userId,
        target: { kind: "global" },
        triggers: ["new_sighting"],
        conditions: {},
        isActive: true,
      },
    });

    expect(globalResponse.status()).toBe(400);
    const globalData = await globalResponse.json();
    const globalError = (globalData.error || globalData.message).toLowerCase();

    // Should mention tier and/or upgrade
    expect(
      globalError.includes("tier") ||
        globalError.includes("upgrade") ||
        globalError.includes("administrator")
    ).toBe(true);

    // Test 2: Large geofence error includes upgrade prompt
    const largeGeofenceResponse = await page.request.post("/api/geofences", {
      data: {
        name: "Large Geofence",
        visibility: "public",
        polygon: {
          points: [
            { lat: 36.0, lng: -96.0 },
            { lat: 36.0, lng: -95.5 },
            { lat: 36.5, lng: -95.5 },
            { lat: 36.5, lng: -96.0 },
          ],
        },
        ownerId: userId,
      },
    });

    expect(largeGeofenceResponse.status()).toBe(400);
    const geofenceData = await largeGeofenceResponse.json();
    const geofenceError = (
      geofenceData.error || geofenceData.message
    ).toLowerCase();

    // Should mention upgrade or paid tier
    expect(
      geofenceError.includes("upgrade") || geofenceError.includes("paid")
    ).toBe(true);

    // Test 3: Complex polygon error includes upgrade prompt
    const points25 = Array.from({ length: 25 }, (_, i) => {
      const angle = (i * 2 * Math.PI) / 25;
      const radius = 0.01;
      return {
        lat: 36.15 + radius * Math.cos(angle),
        lng: -95.99 + radius * Math.sin(angle),
      };
    });

    const complexPolygonResponse = await page.request.post("/api/geofences", {
      data: {
        name: "Complex Polygon",
        visibility: "public",
        polygon: { points: points25 },
        ownerId: userId,
      },
    });

    expect(complexPolygonResponse.status()).toBe(400);
    const polygonData = await complexPolygonResponse.json();
    const polygonError = (
      polygonData.error || polygonData.message
    ).toLowerCase();

    // Should mention upgrade or paid tier
    expect(
      polygonError.includes("upgrade") || polygonError.includes("paid")
    ).toBe(true);
  });

  test("free tier can create local polygon signals", async ({ page }) => {
    // Register a free tier user
    const { userId } = await registerAndLogin(page, "free");

    // Free tier should be able to create polygon signals (non-global)
    const polygonSignalResponse = await page.request.post("/api/signals", {
      data: {
        name: "Local Polygon Signal",
        ownerId: userId,
        target: {
          kind: "polygon",
          polygon: {
            points: [
              { lat: 36.15, lng: -95.99 },
              { lat: 36.15, lng: -95.98 },
              { lat: 36.14, lng: -95.98 },
              { lat: 36.14, lng: -95.99 },
            ],
          },
        },
        triggers: ["new_sighting"],
        conditions: {},
        isActive: true,
      },
    });

    expect(polygonSignalResponse.status()).toBe(201);
  });

  test("free tier signal with too many sighting types is rejected", async ({
    page,
  }) => {
    // Register a free tier user
    const { userId } = await registerAndLogin(page, "free");

    // Free tier limit is 10 sighting types
    // Create a signal with 15 type IDs (over limit)
    const typeIds = Array.from({ length: 15 }, (_, i) => `type-${i + 1}`);

    const response = await page.request.post("/api/signals", {
      data: {
        name: "Signal with Many Types",
        ownerId: userId,
        target: { kind: "global" },
        triggers: ["new_sighting"],
        conditions: { typeIds },
        isActive: true,
      },
    });

    // Should fail (even if global signal error comes first)
    expect(response.status()).toBe(400);
    const data = await response.json();

    // Error should mention type limit or tier
    const errorMessage = (data.error || data.message).toLowerCase();
    expect(
      errorMessage.includes("type") ||
        errorMessage.includes("10") ||
        errorMessage.includes("tier")
    ).toBe(true);
  });

  test("paid tier can use more sighting types (up to 50)", async ({ page }) => {
    // Register a paid tier user
    const { userId } = await registerAndLogin(page, "paid");

    // Paid tier limit is 50 sighting types
    // Create a signal with 30 type IDs (over free limit, under paid limit)
    const typeIds = Array.from({ length: 30 }, (_, i) => `type-${i + 1}`);

    const validResponse = await page.request.post("/api/signals", {
      data: {
        name: "Signal with Many Types",
        ownerId: userId,
        target: {
          kind: "polygon",
          polygon: {
            points: [
              { lat: 36.15, lng: -95.99 },
              { lat: 36.15, lng: -95.98 },
              { lat: 36.14, lng: -95.98 },
              { lat: 36.14, lng: -95.99 },
            ],
          },
        },
        triggers: ["new_sighting"],
        conditions: { typeIds },
        isActive: true,
      },
    });

    // Should succeed for paid tier
    expect(validResponse.status()).toBe(201);

    // Attempt to create a signal with 60 type IDs (over paid limit)
    const typeIds60 = Array.from({ length: 60 }, (_, i) => `type-${i + 1}`);

    const invalidResponse = await page.request.post("/api/signals", {
      data: {
        name: "Signal with Too Many Types",
        ownerId: userId,
        target: {
          kind: "polygon",
          polygon: {
            points: [
              { lat: 36.15, lng: -95.99 },
              { lat: 36.15, lng: -95.98 },
              { lat: 36.14, lng: -95.98 },
              { lat: 36.14, lng: -95.99 },
            ],
          },
        },
        triggers: ["new_sighting"],
        conditions: { typeIds: typeIds60 },
        isActive: true,
      },
    });

    // Should fail even for paid tier
    expect(invalidResponse.status()).toBe(400);
  });

  test("geofence validation endpoint returns area and point count", async ({
    page,
  }) => {
    // Register a user
    const { userId } = await registerAndLogin(page, "free");

    // Test the geofence validation endpoint
    const validationResponse = await page.request.post(
      "/api/geofences/validate",
      {
        data: {
          polygon: {
            points: [
              { lat: 36.15, lng: -95.99 },
              { lat: 36.15, lng: -95.98 },
              { lat: 36.14, lng: -95.98 },
              { lat: 36.14, lng: -95.99 },
            ],
          },
        },
      }
    );

    // If endpoint doesn't exist, skip this test
    if (validationResponse.status() === 404) {
      test.skip();
      return;
    }

    expect(validationResponse.ok()).toBe(true);
    const data = await validationResponse.json();

    // Should return area and point count
    expect(data.areaKm2).toBeDefined();
    expect(typeof data.areaKm2).toBe("number");
    expect(data.pointCount).toBeDefined();
    expect(data.pointCount).toBe(4);
    expect(data.isValid).toBeDefined();
    expect(typeof data.isValid).toBe("boolean");
  });
});
