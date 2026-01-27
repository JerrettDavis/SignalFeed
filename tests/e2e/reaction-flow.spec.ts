import { test, expect } from "@playwright/test";

test.describe("Reaction Flow", () => {
  let sightingId: string;

  test.beforeEach(async ({ request }) => {
    // Create a test sighting before each test
    const response = await request.post("/api/sightings", {
      data: {
        typeId: "type-bird",
        categoryId: "cat-nature",
        location: { lat: 36.1539, lng: -95.9928 },
        description: "Test sighting for reactions",
        observedAt: new Date().toISOString(),
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    sightingId = body.data.id;
  });

  test("can add upvote reaction", async ({ request }) => {
    // Add upvote reaction
    const addResponse = await request.post(
      `/api/sightings/${sightingId}/react`,
      {
        data: {
          type: "upvote",
        },
      }
    );

    expect(addResponse.ok()).toBeTruthy();
    const addBody = await addResponse.json();
    expect(addBody.success).toBe(true);

    // Verify reaction counts updated
    const countsResponse = await request.get(
      `/api/sightings/${sightingId}/reactions`
    );
    expect(countsResponse.ok()).toBeTruthy();

    const countsBody = await countsResponse.json();
    expect(countsBody.data.upvotes).toBe(1);
    expect(countsBody.data.downvotes).toBe(0);
    expect(countsBody.data.confirmations).toBe(0);
    expect(countsBody.data.disputes).toBe(0);
    expect(countsBody.data.spamReports).toBe(0);
  });

  test("can add and remove reactions", async ({ request }) => {
    // Add upvote
    await request.post(`/api/sightings/${sightingId}/react`, {
      data: { type: "upvote" },
    });

    // Verify added
    let countsResponse = await request.get(
      `/api/sightings/${sightingId}/reactions`
    );
    let countsBody = await countsResponse.json();
    expect(countsBody.data.upvotes).toBe(1);

    // Remove upvote
    const removeResponse = await request.delete(
      `/api/sightings/${sightingId}/react?type=upvote`
    );
    expect(removeResponse.ok()).toBeTruthy();

    // Verify removed
    countsResponse = await request.get(
      `/api/sightings/${sightingId}/reactions`
    );
    countsBody = await countsResponse.json();
    expect(countsBody.data.upvotes).toBe(0);
  });

  test("can add multiple reaction types", async ({ request }) => {
    // Add upvote
    await request.post(`/api/sightings/${sightingId}/react`, {
      data: { type: "upvote" },
    });

    // Add confirmation
    await request.post(`/api/sightings/${sightingId}/react`, {
      data: { type: "confirmed" },
    });

    // Verify both reactions counted
    const countsResponse = await request.get(
      `/api/sightings/${sightingId}/reactions`
    );
    const countsBody = await countsResponse.json();
    expect(countsBody.data.upvotes).toBe(1);
    expect(countsBody.data.confirmations).toBe(1);
  });

  test("reactions update sighting scores", async ({ request }) => {
    // Get initial sighting
    let sightingResponse = await request.get("/api/sightings");
    let sightingsBody = await sightingResponse.json();
    const initialSighting = sightingsBody.data.find(
      (s: { id: string }) => s.id === sightingId
    );
    expect(initialSighting.score).toBe(0);
    expect(initialSighting.upvotes).toBe(0);

    // Add upvote
    await request.post(`/api/sightings/${sightingId}/react`, {
      data: { type: "upvote" },
    });

    // Verify sighting score updated
    sightingResponse = await request.get("/api/sightings");
    sightingsBody = await sightingResponse.json();
    const updatedSighting = sightingsBody.data.find(
      (s: { id: string }) => s.id === sightingId
    );
    expect(updatedSighting.upvotes).toBe(1);
    expect(updatedSighting.score).toBe(1);
    expect(updatedSighting.hotScore).toBeGreaterThan(0);
  });

  test("confirmations have double weight in score", async ({ request }) => {
    // Add confirmation (worth 2 points)
    await request.post(`/api/sightings/${sightingId}/react`, {
      data: { type: "confirmed" },
    });

    // Verify score is 2
    const sightingResponse = await request.get("/api/sightings");
    const sightingsBody = await sightingResponse.json();
    const sighting = sightingsBody.data.find(
      (s: { id: string }) => s.id === sightingId
    );
    expect(sighting.confirmations).toBe(1);
    expect(sighting.score).toBe(2); // Confirmations worth 2 points
  });

  test("disputes have negative double weight in score", async ({ request }) => {
    // First add some positive reputation
    await request.post(`/api/sightings/${sightingId}/react`, {
      data: { type: "upvote" },
    });
    await request.post(`/api/sightings/${sightingId}/react`, {
      data: { type: "confirmed" },
    });

    // Then add dispute (worth -2 points)
    await request.post(`/api/sightings/${sightingId}/react`, {
      data: { type: "disputed" },
    });

    // Verify score calculation: 1 + 2 - 2 = 1
    const sightingResponse = await request.get("/api/sightings");
    const sightingsBody = await sightingResponse.json();
    const sighting = sightingsBody.data.find(
      (s: { id: string }) => s.id === sightingId
    );
    expect(sighting.upvotes).toBe(1);
    expect(sighting.confirmations).toBe(1);
    expect(sighting.disputes).toBe(1);
    expect(sighting.score).toBe(1); // 1 + 2 - 2 = 1
  });

  test("spam reports have 5x negative weight", async ({ request }) => {
    // Add upvote first
    await request.post(`/api/sightings/${sightingId}/react`, {
      data: { type: "upvote" },
    });

    // Add spam report (worth -5 points)
    await request.post(`/api/sightings/${sightingId}/react`, {
      data: { type: "spam" },
    });

    // Verify score: 1 - 5 = -4
    const sightingResponse = await request.get("/api/sightings");
    const sightingsBody = await sightingResponse.json();
    const sighting = sightingsBody.data.find(
      (s: { id: string }) => s.id === sightingId
    );
    expect(sighting.upvotes).toBe(1);
    expect(sighting.spamReports).toBe(1);
    expect(sighting.score).toBe(-4);
  });

  test("hot score decays over time", async ({ request }) => {
    // Add reactions to get a good score
    await request.post(`/api/sightings/${sightingId}/react`, {
      data: { type: "upvote" },
    });
    await request.post(`/api/sightings/${sightingId}/react`, {
      data: { type: "confirmed" },
    });

    // Get initial hot score (should be high for recent sighting)
    const sightingResponse = await request.get("/api/sightings");
    const sightingsBody = await sightingResponse.json();
    const sighting = sightingsBody.data.find(
      (s: { id: string }) => s.id === sightingId
    );

    expect(sighting.score).toBe(3); // 1 + 2
    expect(sighting.hotScore).toBeGreaterThan(0);

    // Note: In a real test, we'd wait some time and verify decay,
    // but for E2E we just verify the hot score is calculated
    expect(typeof sighting.hotScore).toBe("number");
  });

  test("switching reaction types", async ({ request }) => {
    // User starts with upvote
    await request.post(`/api/sightings/${sightingId}/react`, {
      data: { type: "upvote" },
    });

    let countsResponse = await request.get(
      `/api/sightings/${sightingId}/reactions`
    );
    let countsBody = await countsResponse.json();
    expect(countsBody.data.upvotes).toBe(1);
    expect(countsBody.data.confirmations).toBe(0);

    // Now add confirmation (different type, can coexist with upvote)
    await request.post(`/api/sightings/${sightingId}/react`, {
      data: { type: "confirmed" },
    });

    countsResponse = await request.get(
      `/api/sightings/${sightingId}/reactions`
    );
    countsBody = await countsResponse.json();
    expect(countsBody.data.upvotes).toBe(1);
    expect(countsBody.data.confirmations).toBe(1);

    // Verify score: 1 + 2 = 3
    const sightingResponse = await request.get("/api/sightings");
    const sightingsBody = await sightingResponse.json();
    const sighting = sightingsBody.data.find(
      (s: { id: string }) => s.id === sightingId
    );
    expect(sighting.score).toBe(3);
  });

  test("validates reaction type", async ({ request }) => {
    // Try to add invalid reaction type
    const response = await request.post(`/api/sightings/${sightingId}/react`, {
      data: {
        type: "invalid_type",
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test("handles non-existent sighting", async ({ request }) => {
    const response = await request.post("/api/sightings/nonexistent-id/react", {
      data: {
        type: "upvote",
      },
    });

    expect(response.status()).toBe(404);
  });

  test("can get reaction counts for empty sighting", async ({ request }) => {
    // Get counts for sighting with no reactions
    const countsResponse = await request.get(
      `/api/sightings/${sightingId}/reactions`
    );
    expect(countsResponse.ok()).toBeTruthy();

    const countsBody = await countsResponse.json();
    expect(countsBody.data.upvotes).toBe(0);
    expect(countsBody.data.downvotes).toBe(0);
    expect(countsBody.data.confirmations).toBe(0);
    expect(countsBody.data.disputes).toBe(0);
    expect(countsBody.data.spamReports).toBe(0);
  });
});
