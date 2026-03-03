import { describe, it, expect } from "vitest";
import {
  SightingSchema,
  CreateSightingRequestSchema,
  CustomFieldValueSchema,
} from "./sighting";

describe("SightingSchema", () => {
  it("should validate sighting with null values in fields", () => {
    const sighting = {
      id: "01KGR76327S7WZD2SSG9XNR4RT",
      typeId: "type-earthquake",
      categoryId: "cat-emergency",
      location: { lat: 53.575, lng: -166.336 },
      description: "M 2.7 - 35 km SSE of Unalaska, Alaska",
      details: "Magnitude 2.7 earthquake",
      importance: "low" as const,
      status: "active" as const,
      observedAt: "2026-02-05T03:34:14.676Z",
      createdAt: "2026-02-06T00:56:12.104Z",
      fields: {
        felt: null,
        alert: null,
        depth: 90.7,
        place: "35 km SSE of Unalaska, Alaska",
        magnitude: 2.7,
      },
      reporterId: "system-usgs",
      upvotes: 0,
      downvotes: 0,
      confirmations: 0,
      disputes: 0,
      spamReports: 0,
      score: 0,
      hotScore: 0,
      timeAdjustedScore: 0,
      relevanceScore: 1,
      lastScoreUpdate: "2026-02-06T00:56:12.104Z",
      flairCount: 0,
      visibilityState: "visible",
    };

    const result = SightingSchema.safeParse(sighting);
    expect(result.success).toBe(true);
  });

  it("should validate sighting without optional fields", () => {
    const sighting = {
      id: "test-id",
      typeId: "type-test",
      categoryId: "cat-test",
      location: { lat: 0, lng: 0 },
      description: "Test sighting",
      status: "active" as const,
      observedAt: "2026-02-05T00:00:00.000Z",
      createdAt: "2026-02-05T00:00:00.000Z",
      upvotes: 0,
      downvotes: 0,
      confirmations: 0,
      disputes: 0,
      spamReports: 0,
      score: 0,
      hotScore: 0,
    };

    const result = SightingSchema.safeParse(sighting);
    expect(result.success).toBe(true);
  });

  it("should allow null values in CustomFieldValueSchema", () => {
    expect(CustomFieldValueSchema.safeParse(null).success).toBe(true);
    expect(CustomFieldValueSchema.safeParse("string").success).toBe(true);
    expect(CustomFieldValueSchema.safeParse(123).success).toBe(true);
    expect(CustomFieldValueSchema.safeParse(true).success).toBe(true);
  });

  it("should reject invalid CustomFieldValueSchema types", () => {
    expect(CustomFieldValueSchema.safeParse({}).success).toBe(false);
    expect(CustomFieldValueSchema.safeParse([]).success).toBe(false);
    expect(CustomFieldValueSchema.safeParse(undefined).success).toBe(false);
  });
});
