import {
  transformToSighting,
  extractExternalId,
} from "./transform-to-sighting";
import type { FeedItem } from "@/ports/feed-provider";

describe("transformToSighting", () => {
  const baseFeedItem: FeedItem = {
    externalId: "test-123",
    title: "Test Event",
    description: "Test description",
    location: { lat: 37.7749, lng: -122.4194 },
    severity: "normal",
    category: "emergency",
    typeId: "type-fire",
    observedAt: new Date("2024-01-15T10:00:00Z"),
    metadata: {
      source: "test",
      customField: "value",
    },
    sourceUrl: "https://example.com/event/123",
  };

  it("transforms feed item to new sighting", () => {
    const result = transformToSighting(
      baseFeedItem,
      "test-feed",
      "system-test"
    );

    expect(result.typeId).toBe("type-fire");
    expect(result.categoryId).toBe("cat-emergency");
    expect(result.location).toEqual({ lat: 37.7749, lng: -122.4194 });
    expect(result.description).toBe("Test Event");
    expect(result.details).toBe("Test description");
    expect(result.importance).toBe("normal");
    expect(result.observedAt).toBe("2024-01-15T10:00:00.000Z");
    expect(result.reporterId).toBe("system-test");
  });

  it("stores external metadata in fields", () => {
    const result = transformToSighting(
      baseFeedItem,
      "test-feed",
      "system-test"
    );

    expect(result.fields).toEqual({
      externalId: "test-123",
      feedSource: "test-feed",
      sourceUrl: "https://example.com/event/123",
      source: "test",
      customField: "value",
    });
  });

  it("maps severity levels correctly", () => {
    const severities: Array<FeedItem["severity"]> = [
      "low",
      "normal",
      "high",
      "critical",
    ];

    severities.forEach((severity) => {
      const item = { ...baseFeedItem, severity };
      const result = transformToSighting(item, "test-feed", "system-test");
      expect(result.importance).toBe(severity);
    });
  });

  it("maps categories to category IDs", () => {
    const categories = [
      { input: "emergency", expected: "cat-emergency" },
      { input: "traffic", expected: "cat-traffic" },
      { input: "wildlife", expected: "cat-wildlife" },
      { input: "infrastructure", expected: "cat-infrastructure" },
      { input: "unknown", expected: "cat-emergency" }, // fallback
    ];

    categories.forEach(({ input, expected }) => {
      const item = { ...baseFeedItem, category: input };
      const result = transformToSighting(item, "test-feed", "system-test");
      expect(result.categoryId).toBe(expected);
    });
  });

  it("handles missing description", () => {
    const item = { ...baseFeedItem, description: undefined };
    const result = transformToSighting(item, "test-feed", "system-test");

    expect(result.description).toBe("Test Event");
    expect(result.details).toBeUndefined();
  });

  it("handles missing sourceUrl", () => {
    const item = { ...baseFeedItem, sourceUrl: undefined };
    const result = transformToSighting(item, "test-feed", "system-test");

    expect(result.fields?.sourceUrl).toBe("");
  });
});

describe("extractExternalId", () => {
  it("extracts external ID from fields", () => {
    const fields = {
      externalId: "noaa-12345",
      feedSource: "noaa-weather",
    };

    const result = extractExternalId(fields);
    expect(result).toBe("noaa-12345");
  });

  it("returns null if externalId is missing", () => {
    const fields = {
      feedSource: "noaa-weather",
    };

    const result = extractExternalId(fields);
    expect(result).toBeNull();
  });

  it("returns null if externalId is not a string", () => {
    const fields = {
      externalId: 12345,
      feedSource: "noaa-weather",
    };

    const result = extractExternalId(fields);
    expect(result).toBeNull();
  });
});
