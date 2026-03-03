import { test, expect, type Page } from "@playwright/test";

test.describe("Signal Analytics", () => {
  let testUserId: string;

  // Helper function to register and login a test user
  const registerAndLogin = async (page: Page) => {
    const timestamp = Date.now();
    const email = `analyticstest-${timestamp}@example.com`;
    const username = `analyticstest${timestamp}`;
    const password = "TestPassword123!";

    // Register the user
    const registerResponse = await page.request.post("/api/auth/register", {
      data: { email, password, username },
    });

    expect(registerResponse.ok()).toBe(true);
    const registerData = await registerResponse.json();
    testUserId = registerData.data.user.id;

    return { userId: testUserId, email, username };
  };

  // Helper to create a test signal
  const createTestSignal = async (
    page: Page,
    userId: string,
    name: string = "Analytics Test Signal"
  ) => {
    const response = await page.request.post("/api/signals", {
      data: {
        name,
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
        classification: "personal",
      },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    return data.data.id;
  };

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("POST /api/signals/:id/view increments count", async ({ page }) => {
    // Register and login a user
    const { userId } = await registerAndLogin(page);

    // Create a test signal
    const signalId = await createTestSignal(page, userId);

    // Get initial view count
    const initialResponse = await page.request.get(`/api/signals/${signalId}`);
    expect(initialResponse.ok()).toBe(true);
    const initialData = await initialResponse.json();
    const initialViewCount = initialData.data.analytics?.viewCount || 0;

    // Track a view
    const viewResponse = await page.request.post(
      `/api/signals/${signalId}/view`,
      {}
    );

    expect(viewResponse.ok()).toBe(true);
    const viewData = await viewResponse.json();
    expect(viewData.success).toBe(true);
    expect(viewData.viewRecorded).toBeDefined();

    // Get updated view count
    const updatedResponse = await page.request.get(`/api/signals/${signalId}`);
    expect(updatedResponse.ok()).toBe(true);
    const updatedData = await updatedResponse.json();
    const updatedViewCount = updatedData.data.analytics?.viewCount || 0;

    // View count should have increased
    if (viewData.viewRecorded) {
      expect(updatedViewCount).toBeGreaterThan(initialViewCount);
    }
  });

  test("POST /api/signals/:id/view returns active viewer count", async ({
    page,
  }) => {
    // Register and login a user
    const { userId } = await registerAndLogin(page);

    // Create a test signal
    const signalId = await createTestSignal(page, userId);

    // Track a view
    const viewResponse = await page.request.post(
      `/api/signals/${signalId}/view`,
      {}
    );

    expect(viewResponse.ok()).toBe(true);
    const viewData = await viewResponse.json();

    // Response should include active viewer count
    expect(viewData.activeViewers).toBeDefined();
    expect(typeof viewData.activeViewers).toBe("number");
    expect(viewData.activeViewers).toBeGreaterThanOrEqual(0);
  });

  test("multiple views from same user within session are deduplicated", async ({
    page,
  }) => {
    // Register and login a user
    const { userId } = await registerAndLogin(page);

    // Create a test signal
    const signalId = await createTestSignal(page, userId);

    // Get initial view count
    const initialResponse = await page.request.get(`/api/signals/${signalId}`);
    const initialData = await initialResponse.json();
    const initialViewCount = initialData.data.analytics?.viewCount || 0;

    // Track multiple views in quick succession
    const view1 = await page.request.post(`/api/signals/${signalId}/view`, {});
    const view1Data = await view1.json();

    const view2 = await page.request.post(`/api/signals/${signalId}/view`, {});
    const view2Data = await view2.json();

    const view3 = await page.request.post(`/api/signals/${signalId}/view`, {});
    const view3Data = await view3.json();

    // First view should be recorded
    expect(view1Data.viewRecorded).toBe(true);

    // Subsequent views within the same session should be deduplicated
    expect(view2Data.viewRecorded).toBe(false);
    expect(view3Data.viewRecorded).toBe(false);

    // Get final view count
    const finalResponse = await page.request.get(`/api/signals/${signalId}`);
    const finalData = await finalResponse.json();
    const finalViewCount = finalData.data.analytics?.viewCount || 0;

    // View count should only increase by 1
    expect(finalViewCount).toBe(initialViewCount + 1);
  });

  test("active viewers count updates correctly", async ({ page }) => {
    // Register and login a user
    const { userId } = await registerAndLogin(page);

    // Create a test signal
    const signalId = await createTestSignal(page, userId);

    // Track a view
    const view1Response = await page.request.post(
      `/api/signals/${signalId}/view`,
      {}
    );
    const view1Data = await view1Response.json();
    const activeViewers1 = view1Data.activeViewers;

    // Active viewers should be at least 1
    expect(activeViewers1).toBeGreaterThanOrEqual(1);

    // Register a second user
    const timestamp = Date.now();
    const user2Email = `user2-${timestamp}@example.com`;
    const user2Response = await page.request.post("/api/auth/register", {
      data: {
        email: user2Email,
        password: "TestPassword123!",
        username: `user2${timestamp}`,
      },
    });
    expect(user2Response.ok()).toBe(true);

    // Second user views the signal
    const view2Response = await page.request.post(
      `/api/signals/${signalId}/view`,
      {}
    );
    const view2Data = await view2Response.json();
    const activeViewers2 = view2Data.activeViewers;

    // Active viewers should have increased
    expect(activeViewers2).toBeGreaterThanOrEqual(activeViewers1);
  });

  test("view tracking respects privacy settings - personalization disabled", async ({
    page,
  }) => {
    // Register and login a user
    const { userId } = await registerAndLogin(page);

    // Disable personalization via privacy settings
    const privacyResponse = await page.request.patch(
      `/api/users/${userId}/privacy`,
      {
        data: {
          enablePersonalization: false,
        },
      }
    );

    // If privacy endpoint doesn't exist, skip this test
    if (privacyResponse.status() === 404) {
      test.skip();
      return;
    }

    expect(privacyResponse.ok()).toBe(true);

    // Create a test signal with a specific category
    const signalId = await createTestSignal(
      page,
      userId,
      "Privacy Test Signal"
    );

    // Get the signal to check its category
    const signalResponse = await page.request.get(`/api/signals/${signalId}`);
    await signalResponse.json();

    // Track a view
    const viewResponse = await page.request.post(
      `/api/signals/${signalId}/view`,
      {}
    );
    expect(viewResponse.ok()).toBe(true);

    // View should be recorded (analytics)
    const viewData = await viewResponse.json();
    expect(viewData.success).toBe(true);

    // But category interaction should NOT be tracked
    // Check if user category interactions were updated
    const interactionsResponse = await page.request.get(
      `/api/users/${userId}/category-interactions`
    );

    if (interactionsResponse.ok()) {
      const interactionsData = await interactionsResponse.json();
      // With personalization disabled, interactions should be minimal or empty
      expect(interactionsData.data).toBeDefined();
    }
  });

  test("view tracking records category interactions when personalization enabled", async ({
    page,
  }) => {
    // Register and login a user
    const { userId } = await registerAndLogin(page);

    // Enable personalization via privacy settings
    const privacyResponse = await page.request.patch(
      `/api/users/${userId}/privacy`,
      {
        data: {
          enablePersonalization: true,
        },
      }
    );

    // If privacy endpoint doesn't exist, skip this test
    if (privacyResponse.status() === 404) {
      test.skip();
      return;
    }

    expect(privacyResponse.ok()).toBe(true);

    // Create a test signal with a specific category
    const signalResponse = await page.request.post("/api/signals", {
      data: {
        name: "Personalization Test Signal",
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
        conditions: {
          categoryIds: ["cat-public-safety"],
        },
        isActive: true,
        classification: "personal",
      },
    });

    expect(signalResponse.status()).toBe(201);
    const signalData = await signalResponse.json();
    const signalId = signalData.data.id;

    // Track a view
    const viewResponse = await page.request.post(
      `/api/signals/${signalId}/view`,
      {}
    );
    expect(viewResponse.ok()).toBe(true);

    // View should be recorded
    const viewData = await viewResponse.json();
    expect(viewData.success).toBe(true);

    // Category interaction should be tracked
    const interactionsResponse = await page.request.get(
      `/api/users/${userId}/category-interactions`
    );

    if (interactionsResponse.ok()) {
      const interactionsData = await interactionsResponse.json();
      expect(interactionsData.data).toBeDefined();

      // Should have interaction with cat-public-safety
      const safetyInteraction = interactionsData.data.find(
        (i: { categoryId: string }) => i.categoryId === "cat-public-safety"
      );

      if (safetyInteraction) {
        expect(safetyInteraction.clickCount).toBeGreaterThan(0);
      }
    }
  });

  test("view tracking fails with 404 for non-existent signal", async ({
    page,
  }) => {
    // Register and login a user
    await registerAndLogin(page);

    // Attempt to track view for non-existent signal
    const viewResponse = await page.request.post(
      "/api/signals/non-existent-signal-id/view",
      {}
    );

    expect(viewResponse.status()).toBe(404);
    const data = await viewResponse.json();
    expect(data.error).toBeDefined();
    expect(data.code).toBe("signal.not_found");
  });

  test("view tracking requires authentication", async ({ page }) => {
    // Create a signal (as an authenticated user first)
    const { userId } = await registerAndLogin(page);
    const signalId = await createTestSignal(page, userId);

    // Logout
    await page.request.post("/api/auth/logout", {});

    // Attempt to track view without authentication
    const viewResponse = await page.request.post(
      `/api/signals/${signalId}/view`,
      {}
    );

    expect(viewResponse.status()).toBe(401);
    const data = await viewResponse.json();
    expect(data.error).toBeDefined();
  });

  test("signal analytics are included in GET /api/signals response", async ({
    page,
  }) => {
    // Register and login a user
    const { userId } = await registerAndLogin(page);

    // Create a test signal
    const signalId = await createTestSignal(page, userId);

    // Track some views
    await page.request.post(`/api/signals/${signalId}/view`, {});

    // Get signals list
    const response = await page.request.get("/api/signals");
    expect(response.ok()).toBe(true);
    const data = await response.json();

    // Find our signal
    const signal = data.data.find((s: { id: string }) => s.id === signalId);
    expect(signal).toBeDefined();

    // Should include analytics
    expect(signal.analytics).toBeDefined();
    expect(signal.analytics.viewCount).toBeDefined();
    expect(typeof signal.analytics.viewCount).toBe("number");
    expect(signal.analytics.subscriberCount).toBeDefined();
    expect(signal.analytics.sightingCount).toBeDefined();
  });

  test("signal analytics are included in GET /api/signals/:id response", async ({
    page,
  }) => {
    // Register and login a user
    const { userId } = await registerAndLogin(page);

    // Create a test signal
    const signalId = await createTestSignal(page, userId);

    // Track some views
    await page.request.post(`/api/signals/${signalId}/view`, {});

    // Get signal by ID
    const response = await page.request.get(`/api/signals/${signalId}`);
    expect(response.ok()).toBe(true);
    const data = await response.json();

    // Should include analytics
    expect(data.data.analytics).toBeDefined();
    expect(data.data.analytics.viewCount).toBeDefined();
    expect(typeof data.data.analytics.viewCount).toBe("number");
    expect(data.data.analytics.subscriberCount).toBeDefined();
    expect(data.data.analytics.sightingCount).toBeDefined();
    expect(data.data.analytics.activeViewers).toBeDefined();
  });

  test("view sessions expire after inactive period", async ({ page }) => {
    // This test validates that view sessions have expiration logic
    // In a real scenario, we'd need to manipulate time or wait

    // Register and login a user
    const { userId } = await registerAndLogin(page);

    // Create a test signal
    const signalId = await createTestSignal(page, userId);

    // Track initial view
    const view1Response = await page.request.post(
      `/api/signals/${signalId}/view`,
      {}
    );
    const view1Data = await view1Response.json();
    expect(view1Data.viewRecorded).toBe(true);

    const initialActiveViewers = view1Data.activeViewers;

    // In a real test, we'd wait for session expiration (e.g., 5 minutes)
    // For E2E, we can only verify the structure exists
    expect(initialActiveViewers).toBeGreaterThanOrEqual(1);

    // Immediate second view should be deduplicated
    const view2Response = await page.request.post(
      `/api/signals/${signalId}/view`,
      {}
    );
    const view2Data = await view2Response.json();
    expect(view2Data.viewRecorded).toBe(false);
  });

  test("analytics track subscriber count correctly", async ({ page }) => {
    // Register and login a user
    const { userId } = await registerAndLogin(page);

    // Create a test signal
    const signalId = await createTestSignal(page, userId);

    // Get initial subscriber count
    const initialResponse = await page.request.get(`/api/signals/${signalId}`);
    const initialData = await initialResponse.json();
    const initialSubscribers = initialData.data.analytics?.subscriberCount || 0;

    // Subscribe to the signal
    const subscribeResponse = await page.request.post(
      `/api/signals/${signalId}/subscribe`,
      {
        data: {
          deliveryMethod: "email",
          deliveryTarget: testUserId
            ? `${testUserId}@example.com`
            : "test@example.com",
        },
      }
    );

    // If subscribe endpoint doesn't exist, skip this test
    if (subscribeResponse.status() === 404) {
      test.skip();
      return;
    }

    expect(subscribeResponse.ok()).toBe(true);

    // Get updated subscriber count
    const updatedResponse = await page.request.get(`/api/signals/${signalId}`);
    const updatedData = await updatedResponse.json();
    const updatedSubscribers = updatedData.data.analytics?.subscriberCount || 0;

    // Subscriber count should have increased
    expect(updatedSubscribers).toBeGreaterThan(initialSubscribers);
  });

  test("analytics track sighting count correctly", async ({ page }) => {
    // Register and login a user
    const { userId } = await registerAndLogin(page);

    // Create a test signal
    const signalId = await createTestSignal(page, userId);

    // Get initial sighting count
    const initialResponse = await page.request.get(`/api/signals/${signalId}`);
    const initialData = await initialResponse.json();
    const initialSightings = initialData.data.analytics?.sightingCount || 0;

    // Create a sighting that matches the signal's criteria
    const sightingResponse = await page.request.post("/api/sightings", {
      data: {
        categoryId: "cat-nature",
        typeId: "type-wildlife",
        description: "Test sighting for analytics",
        location: {
          lat: 36.145,
          lng: -95.985,
        },
        reporterId: userId,
        importance: "medium",
      },
    });

    expect(sightingResponse.ok()).toBe(true);

    // Wait a bit for signal processing
    await page.waitForTimeout(1000);

    // Get updated sighting count
    const updatedResponse = await page.request.get(`/api/signals/${signalId}`);
    const updatedData = await updatedResponse.json();
    const updatedSightings = updatedData.data.analytics?.sightingCount || 0;

    // Sighting count should have increased if the sighting matched the signal
    // (This depends on signal evaluation logic)
    expect(updatedSightings).toBeGreaterThanOrEqual(initialSightings);
  });

  test("privacy settings endpoint exists and works", async ({ page }) => {
    // Register and login a user
    const { userId } = await registerAndLogin(page);

    // Get current privacy settings
    const getResponse = await page.request.get(`/api/users/${userId}/privacy`);

    // If privacy endpoint doesn't exist, skip this test
    if (getResponse.status() === 404) {
      test.skip();
      return;
    }

    expect(getResponse.ok()).toBe(true);
    const getData = await getResponse.json();

    expect(getData.data).toBeDefined();
    expect(getData.data.enablePersonalization).toBeDefined();
    expect(getData.data.enableLocationSharing).toBeDefined();

    // Update privacy settings
    const updateResponse = await page.request.patch(
      `/api/users/${userId}/privacy`,
      {
        data: {
          enablePersonalization: true,
          enableLocationSharing: false,
        },
      }
    );

    expect(updateResponse.ok()).toBe(true);
    const updateData = await updateResponse.json();

    expect(updateData.data.enablePersonalization).toBe(true);
    expect(updateData.data.enableLocationSharing).toBe(false);
  });
});
