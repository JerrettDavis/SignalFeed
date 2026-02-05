import { buildIngestFeedData } from "./ingest-feed-data";
import type { FeedProvider, FeedItem } from "@/ports/feed-provider";
import type { SightingRepository } from "@/ports/sighting-repository";
import type { IdGenerator } from "@/ports/id-generator";
import type { Clock } from "@/ports/clock";
import type { Sighting, SightingId } from "@/domain/sightings/sighting";

// Mock feed provider
class MockFeedProvider implements FeedProvider {
  name = "mock-feed";
  private items: FeedItem[];

  constructor(items: FeedItem[]) {
    this.items = items;
  }

  async fetch(): Promise<FeedItem[]> {
    return this.items;
  }
}

// Mock repository
const createMockRepository = (): SightingRepository => {
  const sightings = new Map<SightingId, Sighting>();

  return {
    async create(sighting: Sighting) {
      sightings.set(sighting.id, sighting);
    },
    async getById(id: SightingId) {
      return sightings.get(id) || null;
    },
    async findByExternalId(externalId: string) {
      for (const sighting of sightings.values()) {
        if (sighting.fields.externalId === externalId) {
          return sighting;
        }
      }
      return null;
    },
    async list() {
      return Array.from(sightings.values());
    },
    async update(sighting: Sighting) {
      sightings.set(sighting.id, sighting);
    },
    async delete(id: SightingId) {
      sightings.delete(id);
    },
    async deleteMany(ids: SightingId[]) {
      ids.forEach((id) => sightings.delete(id));
    },
  };
};

// Mock ID generator with counter to ensure unique IDs
let idCounter = 0;
const mockIdGenerator: IdGenerator = {
  nextId: () => `sight-${Date.now()}-${idCounter++}` as SightingId,
};

// Mock clock
const mockClock: Clock = {
  now: () => new Date("2024-01-15T10:00:00Z").toISOString(),
};

describe("ingestFeedData", () => {
  it("creates new sightings from feed items", async () => {
    const feedItems: FeedItem[] = [
      {
        externalId: "test-1",
        title: "Test Event 1",
        location: { lat: 37.7749, lng: -122.4194 },
        severity: "normal",
        category: "emergency",
        typeId: "type-fire",
        observedAt: new Date("2024-01-15T09:00:00Z"),
        metadata: {},
      },
      {
        externalId: "test-2",
        title: "Test Event 2",
        location: { lat: 37.775, lng: -122.4195 },
        severity: "high",
        category: "emergency",
        typeId: "type-medical",
        observedAt: new Date("2024-01-15T09:30:00Z"),
        metadata: {},
      },
    ];

    const feedProvider = new MockFeedProvider(feedItems);
    const repository = createMockRepository();
    const ingestFeedData = buildIngestFeedData({
      repository,
      idGenerator: mockIdGenerator,
      clock: mockClock,
    });

    const result = await ingestFeedData(feedProvider, "system-test");

    expect(result.created).toBe(2);
    expect(result.updated).toBe(0);
    expect(result.failed).toBe(0);

    const sightings = await repository.list({});
    expect(sightings).toHaveLength(2);
    expect(sightings[0].fields.externalId).toBe("test-1");
    expect(sightings[1].fields.externalId).toBe("test-2");
  });

  it("updates existing sightings when externalId matches", async () => {
    const repository = createMockRepository();
    const ingestFeedData = buildIngestFeedData({
      repository,
      idGenerator: mockIdGenerator,
      clock: mockClock,
    });

    // First ingestion - create
    const feedProvider1 = new MockFeedProvider([
      {
        externalId: "test-1",
        title: "Original Title",
        location: { lat: 37.7749, lng: -122.4194 },
        severity: "normal",
        category: "emergency",
        typeId: "type-fire",
        observedAt: new Date("2024-01-15T09:00:00Z"),
        metadata: { version: 1 },
      },
    ]);

    const result1 = await ingestFeedData(feedProvider1, "system-test");
    expect(result1.created).toBe(1);
    expect(result1.updated).toBe(0);

    // Second ingestion - update
    const feedProvider2 = new MockFeedProvider([
      {
        externalId: "test-1",
        title: "Updated Title",
        location: { lat: 37.7749, lng: -122.4194 },
        severity: "high",
        category: "emergency",
        typeId: "type-fire",
        observedAt: new Date("2024-01-15T09:00:00Z"),
        metadata: { version: 2 },
      },
    ]);

    const result2 = await ingestFeedData(feedProvider2, "system-test");
    expect(result2.created).toBe(0);
    expect(result2.updated).toBe(1);

    const sightings = await repository.list({});
    expect(sightings).toHaveLength(1);
    expect(sightings[0].description).toBe("Updated Title");
    expect(sightings[0].importance).toBe("high");
    expect(sightings[0].fields.version).toBe(2);
  });

  it("handles validation errors gracefully", async () => {
    const feedItems: FeedItem[] = [
      {
        externalId: "test-valid",
        title: "Valid Event",
        location: { lat: 37.7749, lng: -122.4194 },
        severity: "normal",
        category: "emergency",
        typeId: "type-fire",
        observedAt: new Date("2024-01-15T09:00:00Z"),
        metadata: {},
      },
      {
        externalId: "test-invalid",
        title: "", // Empty title will fail validation
        location: { lat: 37.7749, lng: -122.4194 },
        severity: "normal",
        category: "emergency",
        typeId: "type-fire",
        observedAt: new Date("2024-01-15T09:00:00Z"),
        metadata: {},
      },
    ];

    const feedProvider = new MockFeedProvider(feedItems);
    const repository = createMockRepository();
    const ingestFeedData = buildIngestFeedData({
      repository,
      idGenerator: mockIdGenerator,
      clock: mockClock,
    });

    const result = await ingestFeedData(feedProvider, "system-test");

    expect(result.created).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].externalId).toBe("test-invalid");
  });

  it("returns empty result when feed is empty", async () => {
    const feedProvider = new MockFeedProvider([]);
    const repository = createMockRepository();
    const ingestFeedData = buildIngestFeedData({
      repository,
      idGenerator: mockIdGenerator,
      clock: mockClock,
    });

    const result = await ingestFeedData(feedProvider, "system-test");

    expect(result.created).toBe(0);
    expect(result.updated).toBe(0);
    expect(result.failed).toBe(0);
  });

  it("stores reporterId from system user", async () => {
    const feedItems: FeedItem[] = [
      {
        externalId: "test-1",
        title: "Test Event",
        location: { lat: 37.7749, lng: -122.4194 },
        severity: "normal",
        category: "emergency",
        typeId: "type-fire",
        observedAt: new Date("2024-01-15T09:00:00Z"),
        metadata: {},
      },
    ];

    const feedProvider = new MockFeedProvider(feedItems);
    const repository = createMockRepository();
    const ingestFeedData = buildIngestFeedData({
      repository,
      idGenerator: mockIdGenerator,
      clock: mockClock,
    });

    await ingestFeedData(feedProvider, "system-noaa");

    const sightings = await repository.list({});
    expect(sightings[0].reporterId).toBe("system-noaa");
  });
});
