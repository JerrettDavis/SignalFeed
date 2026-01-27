import { test, expect } from "@playwright/test";

test.describe("Signals Integration Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("creates a global signal via API", async ({ page }) => {
    // Create a signal via API
    const response = await page.request.post("/api/signals", {
      data: {
        name: "Global Test Signal",
        description: "Test signal that monitors all areas",
        ownerId: "test-user-001",
        target: { kind: "global" },
        triggers: ["new_sighting"],
        conditions: {},
        isActive: true,
      },
    });

    expect(response.ok()).toBe(true);
    const data = await response.json();
    expect(data.data).toBeDefined();
    expect(data.data.name).toBe("Global Test Signal");
    expect(data.data.target.kind).toBe("global");
    expect(data.data.isActive).toBe(true);
  });

  test("creates a geofence signal via API", async ({ page }) => {
    // First create a geofence
    const geofenceResponse = await page.request.post("/api/geofences", {
      data: {
        name: "Signal Test Geofence",
        visibility: "public",
        polygon: {
          points: [
            { lat: 36.15, lng: -95.99 },
            { lat: 36.15, lng: -95.98 },
            { lat: 36.14, lng: -95.98 },
            { lat: 36.14, lng: -95.99 },
          ],
        },
        ownerId: "test-user-001",
      },
    });

    expect(geofenceResponse.ok()).toBe(true);
    const geofenceData = await geofenceResponse.json();
    const geofenceId = geofenceData.data.id;

    // Create a signal for this geofence
    const signalResponse = await page.request.post("/api/signals", {
      data: {
        name: "Geofence Alert Signal",
        description: "Monitors specific geofence area",
        ownerId: "test-user-001",
        target: { kind: "geofence", geofenceId },
        triggers: ["new_sighting", "sighting_confirmed"],
        conditions: {
          categoryIds: ["cat-public-safety"],
          importance: "high",
        },
        isActive: true,
      },
    });

    expect(signalResponse.ok()).toBe(true);
    const signalData = await signalResponse.json();
    expect(signalData.data.name).toBe("Geofence Alert Signal");
    expect(signalData.data.target.kind).toBe("geofence");
    expect(signalData.data.target.geofenceId).toBe(geofenceId);
    expect(signalData.data.triggers).toContain("new_sighting");
    expect(signalData.data.triggers).toContain("sighting_confirmed");
  });

  test("creates a polygon signal via API", async ({ page }) => {
    const response = await page.request.post("/api/signals", {
      data: {
        name: "Custom Area Signal",
        description: "Monitors custom drawn polygon",
        ownerId: "test-user-001",
        target: {
          kind: "polygon",
          polygon: {
            points: [
              { lat: 36.16, lng: -96.0 },
              { lat: 36.16, lng: -95.99 },
              { lat: 36.15, lng: -95.99 },
              { lat: 36.15, lng: -96.0 },
            ],
          },
        },
        triggers: ["score_threshold"],
        conditions: {
          minScore: 10,
        },
        isActive: true,
      },
    });

    expect(response.ok()).toBe(true);
    const data = await response.json();
    expect(data.data.target.kind).toBe("polygon");
    expect(data.data.target.polygon.points).toHaveLength(4);
    expect(data.data.conditions.minScore).toBe(10);
  });

  test("lists signals via API", async ({ page }) => {
    const response = await page.request.get("/api/signals");

    expect(response.ok()).toBe(true);
    const data = await response.json();
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);

    // Each signal should have required fields
    if (data.data.length > 0) {
      const signal = data.data[0];
      expect(signal.id).toBeDefined();
      expect(signal.name).toBeDefined();
      expect(signal.target).toBeDefined();
      expect(signal.triggers).toBeDefined();
      expect(signal.isActive).toBeDefined();
    }
  });

  test("filters signals by isActive", async ({ page }) => {
    // Create an active signal
    await page.request.post("/api/signals", {
      data: {
        name: "Active Signal",
        ownerId: "test-user-001",
        target: { kind: "global" },
        triggers: ["new_sighting"],
        conditions: {},
        isActive: true,
      },
    });

    // Create an inactive signal
    await page.request.post("/api/signals", {
      data: {
        name: "Inactive Signal",
        ownerId: "test-user-001",
        target: { kind: "global" },
        triggers: ["new_sighting"],
        conditions: {},
        isActive: false,
      },
    });

    // Fetch all signals
    const allResponse = await page.request.get("/api/signals");
    const allData = await allResponse.json();

    // Fetch only active signals
    const activeResponse = await page.request.get("/api/signals?isActive=true");
    const activeData = await activeResponse.json();

    // All count should be >= active count
    expect(allData.data.length).toBeGreaterThanOrEqual(activeData.data.length);

    // All active signals should have isActive: true
    for (const signal of activeData.data) {
      expect(signal.isActive).toBe(true);
    }
  });

  test("gets signal by ID via API", async ({ page }) => {
    // Create a signal
    const createResponse = await page.request.post("/api/signals", {
      data: {
        name: "Test Signal by ID",
        ownerId: "test-user-001",
        target: { kind: "global" },
        triggers: ["new_sighting"],
        conditions: {},
        isActive: true,
      },
    });

    const createData = await createResponse.json();
    const signalId = createData.data.id;

    // Get the signal by ID
    const getResponse = await page.request.get(`/api/signals/${signalId}`);
    expect(getResponse.ok()).toBe(true);

    const getData = await getResponse.json();
    expect(getData.data.id).toBe(signalId);
    expect(getData.data.name).toBe("Test Signal by ID");
  });

  test("returns 404 for non-existent signal", async ({ page }) => {
    const response = await page.request.get("/api/signals/non-existent-id");
    expect(response.status()).toBe(404);
  });

  test("validates required fields when creating signal", async ({ page }) => {
    // Missing name
    const noNameResponse = await page.request.post("/api/signals", {
      data: {
        ownerId: "test-user-001",
        target: { kind: "global" },
        triggers: ["new_sighting"],
        conditions: {},
        isActive: true,
      },
    });
    expect(noNameResponse.status()).toBe(400);

    // Missing target
    const noTargetResponse = await page.request.post("/api/signals", {
      data: {
        name: "Test",
        ownerId: "test-user-001",
        triggers: ["new_sighting"],
        conditions: {},
        isActive: true,
      },
    });
    expect(noTargetResponse.status()).toBe(400);

    // Missing triggers
    const noTriggersResponse = await page.request.post("/api/signals", {
      data: {
        name: "Test",
        ownerId: "test-user-001",
        target: { kind: "global" },
        conditions: {},
        isActive: true,
      },
    });
    expect(noTriggersResponse.status()).toBe(400);
  });

  test("validates geofence target has geofenceId", async ({ page }) => {
    const response = await page.request.post("/api/signals", {
      data: {
        name: "Invalid Geofence Signal",
        ownerId: "test-user-001",
        target: { kind: "geofence" }, // Missing geofenceId
        triggers: ["new_sighting"],
        conditions: {},
        isActive: true,
      },
    });

    expect(response.status()).toBe(400);
  });

  test("validates polygon target has polygon points", async ({ page }) => {
    const response = await page.request.post("/api/signals", {
      data: {
        name: "Invalid Polygon Signal",
        ownerId: "test-user-001",
        target: { kind: "polygon" }, // Missing polygon
        triggers: ["new_sighting"],
        conditions: {},
        isActive: true,
      },
    });

    expect(response.status()).toBe(400);
  });

  test("validates trigger types", async ({ page }) => {
    const response = await page.request.post("/api/signals", {
      data: {
        name: "Invalid Trigger Signal",
        ownerId: "test-user-001",
        target: { kind: "global" },
        triggers: ["invalid_trigger"], // Invalid trigger type
        conditions: {},
        isActive: true,
      },
    });

    expect(response.status()).toBe(400);
  });

  test("signal appears in UI after creation", async ({ page }) => {
    // Create a signal via API
    await page.request.post("/api/signals", {
      data: {
        name: "UI Test Signal",
        description: "Should appear in signals list",
        ownerId: "test-user-001",
        target: { kind: "global" },
        triggers: ["new_sighting"],
        conditions: {},
        isActive: true,
      },
    });

    // Open signals sidebar
    await page.getByRole("button", { name: "Explore" }).click();
    await page.getByRole("button", { name: "Signals" }).click();
    await page.waitForTimeout(500);

    // Should see the signal in the list
    await expect(page.getByText("UI Test Signal")).toBeVisible();
  });

  test("inactive signal appears only in 'All' and 'Inactive' filters", async ({
    page,
  }) => {
    // Create an inactive signal
    await page.request.post("/api/signals", {
      data: {
        name: "Inactive Filter Test",
        ownerId: "test-user-001",
        target: { kind: "global" },
        triggers: ["new_sighting"],
        conditions: {},
        isActive: false,
      },
    });

    // Open signals sidebar
    await page.getByRole("button", { name: "Explore" }).click();
    await page.getByRole("button", { name: "Signals" }).click();
    await page.waitForTimeout(500);

    // Should NOT appear in Active filter (default)
    await page.getByRole("button", { name: "Active" }).click();
    await page.waitForTimeout(200);
    await expect(page.getByText("Inactive Filter Test")).not.toBeVisible();

    // Should appear in All filter
    await page.getByRole("button", { name: "All" }).click();
    await page.waitForTimeout(200);
    await expect(page.getByText("Inactive Filter Test")).toBeVisible();

    // Should appear in Inactive filter
    await page.getByRole("button", { name: "Inactive" }).click();
    await page.waitForTimeout(200);
    await expect(page.getByText("Inactive Filter Test")).toBeVisible();
  });

  test("signal with conditions displays correctly", async ({ page }) => {
    // Create signal with multiple conditions
    await page.request.post("/api/signals", {
      data: {
        name: "Complex Conditions Signal",
        description: "Has category, type, and importance filters",
        ownerId: "test-user-001",
        target: { kind: "global" },
        triggers: ["new_sighting", "sighting_confirmed"],
        conditions: {
          categoryIds: ["cat-public-safety"],
          typeIds: ["type-road-hazards"],
          importance: "high",
        },
        isActive: true,
      },
    });

    // Open signals sidebar
    await page.getByRole("button", { name: "Explore" }).click();
    await page.getByRole("button", { name: "Signals" }).click();
    await page.waitForTimeout(500);

    // Should see the signal
    await expect(page.getByText("Complex Conditions Signal")).toBeVisible();

    // Should show trigger count (2 triggers)
    await expect(page.getByText("2 triggers")).toBeVisible();
  });

  test("creates signal subscription via API", async ({ page }) => {
    // First create a signal
    const signalResponse = await page.request.post("/api/signals", {
      data: {
        name: "Subscription Test Signal",
        ownerId: "test-user-001",
        target: { kind: "global" },
        triggers: ["new_sighting"],
        conditions: {},
        isActive: true,
      },
    });

    const signalData = await signalResponse.json();
    const signalId = signalData.data.id;

    // Subscribe to the signal
    const subscriptionResponse = await page.request.post(
      "/api/signal-subscriptions",
      {
        data: {
          signalId,
          subscriberId: "test-user-001",
          deliveryMethod: "email",
          deliveryTarget: "test@example.com",
          isActive: true,
        },
      }
    );

    expect(subscriptionResponse.ok()).toBe(true);
    const subscriptionData = await subscriptionResponse.json();
    expect(subscriptionData.data.signalId).toBe(signalId);
    expect(subscriptionData.data.deliveryMethod).toBe("email");
    expect(subscriptionData.data.deliveryTarget).toBe("test@example.com");
  });

  test("lists signal subscriptions via API", async ({ page }) => {
    const response = await page.request.get("/api/signal-subscriptions");

    expect(response.ok()).toBe(true);
    const data = await response.json();
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);
  });

  test("validates signal subscription fields", async ({ page }) => {
    // Missing signalId
    const noSignalResponse = await page.request.post(
      "/api/signal-subscriptions",
      {
        data: {
          subscriberId: "test-user-001",
          deliveryMethod: "email",
          deliveryTarget: "test@example.com",
          isActive: true,
        },
      }
    );
    expect(noSignalResponse.status()).toBe(400);

    // Invalid delivery method
    const invalidMethodResponse = await page.request.post(
      "/api/signal-subscriptions",
      {
        data: {
          signalId: "some-signal-id",
          subscriberId: "test-user-001",
          deliveryMethod: "invalid",
          deliveryTarget: "test@example.com",
          isActive: true,
        },
      }
    );
    expect(invalidMethodResponse.status()).toBe(400);
  });
});
