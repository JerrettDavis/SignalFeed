import {
  calculateDistance,
  calculatePopularityScore,
  detectViralBoost,
  calculateCategoryBoost,
  calculateRankScore,
  sortByRankScore,
  getSignalRepresentativePoint,
  calculateViralActivity,
  type ViralDetectionData,
  type CategoryPreference,
  type RankingContext,
  type RankedSignal,
} from "@/domain/signals/signal-ranking";
import type { Signal, SignalId } from "@/domain/signals/signal";
import type { CategoryId } from "@/domain/sightings/sighting";

describe("calculateDistance", () => {
  it("calculates distance of 0 for identical points", () => {
    const point1 = { lat: 35.0, lng: -120.0 };
    const point2 = { lat: 35.0, lng: -120.0 };
    const distance = calculateDistance(point1, point2);
    expect(distance).toBe(0);
  });

  it("calculates distance for nearby points (roughly 1 degree)", () => {
    const point1 = { lat: 35.0, lng: -120.0 };
    const point2 = { lat: 36.0, lng: -120.0 };
    const distance = calculateDistance(point1, point2);
    // 1 degree latitude ≈ 111 km
    expect(distance).toBeGreaterThan(100);
    expect(distance).toBeLessThan(120);
  });

  it("calculates distance for east-west points", () => {
    const point1 = { lat: 35.0, lng: -120.0 };
    const point2 = { lat: 35.0, lng: -121.0 };
    const distance = calculateDistance(point1, point2);
    // 1 degree longitude at 35° latitude ≈ 91 km
    expect(distance).toBeGreaterThan(80);
    expect(distance).toBeLessThan(100);
  });

  it("calculates distance for diagonal points", () => {
    const point1 = { lat: 0, lng: 0 };
    const point2 = { lat: 1, lng: 1 };
    const distance = calculateDistance(point1, point2);
    // Should be sqrt(2) * ~111 km ≈ 157 km
    expect(distance).toBeGreaterThan(150);
    expect(distance).toBeLessThan(160);
  });

  it("calculates long distance correctly (across country)", () => {
    const newYork = { lat: 40.7128, lng: -74.006 };
    const losAngeles = { lat: 34.0522, lng: -118.2437 };
    const distance = calculateDistance(newYork, losAngeles);
    // Roughly 4000 km
    expect(distance).toBeGreaterThan(3500);
    expect(distance).toBeLessThan(4500);
  });

  it("calculates distance across equator", () => {
    const north = { lat: 10, lng: 0 };
    const south = { lat: -10, lng: 0 };
    const distance = calculateDistance(north, south);
    // 20 degrees latitude ≈ 2220 km
    expect(distance).toBeGreaterThan(2000);
    expect(distance).toBeLessThan(2500);
  });

  it("handles negative coordinates correctly", () => {
    const point1 = { lat: -35.0, lng: -120.0 };
    const point2 = { lat: -36.0, lng: -121.0 };
    const distance = calculateDistance(point1, point2);
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeGreaterThan(100);
  });

  it("is symmetric (distance A to B equals distance B to A)", () => {
    const point1 = { lat: 35.0, lng: -120.0 };
    const point2 = { lat: 36.0, lng: -121.0 };
    const distanceAB = calculateDistance(point1, point2);
    const distanceBA = calculateDistance(point2, point1);
    expect(Math.abs(distanceAB - distanceBA)).toBeLessThan(0.001);
  });
});

describe("calculatePopularityScore", () => {
  it("calculates score with all metrics at zero", () => {
    const signal = createMockSignal({
      analytics: {
        viewCount: 0,
        uniqueViewers: 0,
        activeViewers: 0,
        subscriberCount: 0,
        sightingCount: 0,
      },
    });
    const score = calculatePopularityScore(signal);
    expect(score).toBe(0);
  });

  it("calculates score with only views", () => {
    const signal = createMockSignal({
      analytics: {
        viewCount: 100,
        uniqueViewers: 50,
        activeViewers: 10,
        subscriberCount: 0,
        sightingCount: 0,
      },
    });
    const score = calculatePopularityScore(signal);
    expect(score).toBe(100 * 1); // viewCount * 1
  });

  it("calculates score with only subscribers", () => {
    const signal = createMockSignal({
      analytics: {
        viewCount: 0,
        uniqueViewers: 0,
        activeViewers: 0,
        subscriberCount: 10,
        sightingCount: 0,
      },
    });
    const score = calculatePopularityScore(signal);
    expect(score).toBe(10 * 10); // subscriberCount * 10
  });

  it("calculates score with only sightings", () => {
    const signal = createMockSignal({
      analytics: {
        viewCount: 0,
        uniqueViewers: 0,
        activeViewers: 0,
        subscriberCount: 0,
        sightingCount: 20,
      },
    });
    const score = calculatePopularityScore(signal);
    expect(score).toBe(20 * 5); // sightingCount * 5
  });

  it("calculates weighted score with all metrics", () => {
    const signal = createMockSignal({
      analytics: {
        viewCount: 100,
        uniqueViewers: 50,
        activeViewers: 10,
        subscriberCount: 10,
        sightingCount: 20,
      },
    });
    const score = calculatePopularityScore(signal);
    // 100*1 + 10*10 + 20*5 = 100 + 100 + 100 = 300
    expect(score).toBe(300);
  });

  it("weights subscribers highest", () => {
    const subscriberSignal = createMockSignal({
      analytics: {
        viewCount: 0,
        uniqueViewers: 0,
        activeViewers: 0,
        subscriberCount: 10,
        sightingCount: 0,
      },
    });
    const viewSignal = createMockSignal({
      analytics: {
        viewCount: 100,
        uniqueViewers: 0,
        activeViewers: 0,
        subscriberCount: 0,
        sightingCount: 0,
      },
    });
    expect(calculatePopularityScore(subscriberSignal)).toBe(100);
    expect(calculatePopularityScore(viewSignal)).toBe(100);
  });

  it("handles missing subscriberCount (defaults to 0)", () => {
    const signal = createMockSignal({
      analytics: {
        viewCount: 50,
        uniqueViewers: 25,
        activeViewers: 5,
        subscriberCount: 0,
        sightingCount: 10,
      },
    });
    const score = calculatePopularityScore(signal);
    // 50*1 + 0*10 + 10*5 = 50 + 0 + 50 = 100
    expect(score).toBe(100);
  });
});

describe("detectViralBoost", () => {
  it("returns false when no activity", () => {
    const data: ViralDetectionData = {
      last24hActivity: 0,
      previous7DayAverage: 0,
    };
    expect(detectViralBoost(data)).toBe(false);
  });

  it("returns true for new signals with >10 activity", () => {
    const data: ViralDetectionData = {
      last24hActivity: 15,
      previous7DayAverage: 0,
    };
    expect(detectViralBoost(data)).toBe(true);
  });

  it("returns false for new signals with ≤10 activity", () => {
    const data: ViralDetectionData = {
      last24hActivity: 10,
      previous7DayAverage: 0,
    };
    expect(detectViralBoost(data)).toBe(false);
  });

  it("returns false when 24h activity is exactly 3x the 7-day average (edge case)", () => {
    const data: ViralDetectionData = {
      last24hActivity: 30,
      previous7DayAverage: 10,
    };
    // 30 is NOT > 10 * 3, it equals it
    expect(detectViralBoost(data)).toBe(false);
  });

  it("returns true when 24h activity is more than 3x the 7-day average", () => {
    const data: ViralDetectionData = {
      last24hActivity: 31,
      previous7DayAverage: 10,
    };
    expect(detectViralBoost(data)).toBe(true);
  });

  it("returns false when 24h activity is less than 3x the 7-day average", () => {
    const data: ViralDetectionData = {
      last24hActivity: 25,
      previous7DayAverage: 10,
    };
    expect(detectViralBoost(data)).toBe(false);
  });

  it("returns false when 24h activity equals 7-day average", () => {
    const data: ViralDetectionData = {
      last24hActivity: 10,
      previous7DayAverage: 10,
    };
    expect(detectViralBoost(data)).toBe(false);
  });

  it("handles decimal values correctly", () => {
    const data: ViralDetectionData = {
      last24hActivity: 32,
      previous7DayAverage: 10.5,
    };
    // 32 > 10.5 * 3 (31.5), so should be true
    expect(detectViralBoost(data)).toBe(true);
  });
});

describe("calculateCategoryBoost", () => {
  const mockSignal = createMockSignal({
    conditions: {
      categoryIds: ["wildlife" as CategoryId],
    },
  });

  const preferences: CategoryPreference[] = [
    { categoryId: "wildlife" as CategoryId, interactionScore: 100 },
    { categoryId: "nature" as CategoryId, interactionScore: 80 },
    { categoryId: "urban" as CategoryId, interactionScore: 60 },
  ];

  it("returns 1.0 when personalization disabled", () => {
    const boost = calculateCategoryBoost(mockSignal, preferences, false);
    expect(boost).toBe(1.0);
  });

  it("returns 1.0 when no preferences provided", () => {
    const boost = calculateCategoryBoost(mockSignal, [], true);
    expect(boost).toBe(1.0);
  });

  it("returns 1.0 when signal has no category filters", () => {
    const noFilterSignal = createMockSignal({
      conditions: {},
    });
    const boost = calculateCategoryBoost(noFilterSignal, preferences, true);
    expect(boost).toBe(1.0);
  });

  it("returns 3.0 for top preference match", () => {
    const boost = calculateCategoryBoost(mockSignal, preferences, true);
    expect(boost).toBe(3.0);
  });

  it("returns 2.0 for second preference match", () => {
    const signal = createMockSignal({
      conditions: {
        categoryIds: ["nature" as CategoryId],
      },
    });
    const boost = calculateCategoryBoost(signal, preferences, true);
    expect(boost).toBe(2.0);
  });

  it("returns 1.5 for third preference match", () => {
    const signal = createMockSignal({
      conditions: {
        categoryIds: ["urban" as CategoryId],
      },
    });
    const boost = calculateCategoryBoost(signal, preferences, true);
    expect(boost).toBe(1.5);
  });

  it("returns 1.0 for no preference match", () => {
    const signal = createMockSignal({
      conditions: {
        categoryIds: ["infrastructure" as CategoryId],
      },
    });
    const boost = calculateCategoryBoost(signal, preferences, true);
    expect(boost).toBe(1.0);
  });

  it("considers only top 3 preferences", () => {
    const manyPreferences: CategoryPreference[] = [
      { categoryId: "cat1" as CategoryId, interactionScore: 100 },
      { categoryId: "cat2" as CategoryId, interactionScore: 90 },
      { categoryId: "cat3" as CategoryId, interactionScore: 80 },
      { categoryId: "cat4" as CategoryId, interactionScore: 70 },
      { categoryId: "cat5" as CategoryId, interactionScore: 60 },
    ];

    const signal = createMockSignal({
      conditions: {
        categoryIds: ["cat4" as CategoryId],
      },
    });

    const boost = calculateCategoryBoost(signal, manyPreferences, true);
    expect(boost).toBe(1.0); // cat4 is not in top 3
  });

  it("handles signal with multiple categories (matches any)", () => {
    const signal = createMockSignal({
      conditions: {
        categoryIds: ["infrastructure" as CategoryId, "nature" as CategoryId],
      },
    });
    const boost = calculateCategoryBoost(signal, preferences, true);
    expect(boost).toBe(2.0); // Matches "nature" which is 2nd preference
  });

  it("matches highest ranking preference when signal has multiple categories", () => {
    const signal = createMockSignal({
      conditions: {
        categoryIds: ["urban" as CategoryId, "wildlife" as CategoryId],
      },
    });
    const boost = calculateCategoryBoost(signal, preferences, true);
    expect(boost).toBe(3.0); // Matches "wildlife" which is 1st preference
  });
});

describe("calculateRankScore", () => {
  const baseContext: RankingContext = {
    userTier: "free",
    categoryPreferences: [],
    hiddenSignalIds: [],
    pinnedSignalIds: [],
    unimportantSignalIds: [],
    enablePersonalization: false,
    enableLocationRanking: false,
  };

  it("gives official global signals highest priority", () => {
    const signal = createMockSignal({
      classification: "official",
      target: { kind: "global" },
    });
    const score = calculateRankScore(signal, baseContext, false);
    expect(score).toBeGreaterThan(10000);
  });

  it("gives community signals marked unimportant negative score", () => {
    const signal = createMockSignal({
      classification: "community",
    });
    const context: RankingContext = {
      ...baseContext,
      unimportantSignalIds: [signal.id],
    };
    const score = calculateRankScore(signal, context, false);
    expect(score).toBe(-1000);
  });

  it("applies 2x viral multiplier", () => {
    const signal = createMockSignal({
      classification: "personal",
      analytics: {
        viewCount: 100,
        uniqueViewers: 50,
        activeViewers: 10,
        subscriberCount: 10,
        sightingCount: 10,
      },
    });
    const normalScore = calculateRankScore(signal, baseContext, false);
    const viralScore = calculateRankScore(signal, baseContext, true);

    // Viral score should be roughly 2x normal score (plus classification bonus)
    expect(viralScore).toBeGreaterThan(normalScore);
  });

  it("calculates base score using popularity formula", () => {
    const signal = createMockSignal({
      classification: "personal",
      analytics: {
        viewCount: 100,
        uniqueViewers: 50,
        activeViewers: 10,
        subscriberCount: 0,
        sightingCount: 0,
      },
    });
    const score = calculateRankScore(signal, baseContext, false);
    // (100 * 100) / (0 + 1) = 10000, plus classification bonus of 0
    expect(score).toBe(10000);
  });

  it("applies distance penalty when location ranking enabled", () => {
    const signal = createMockSignal({
      classification: "personal",
      analytics: {
        viewCount: 100,
        uniqueViewers: 50,
        activeViewers: 10,
        subscriberCount: 0,
        sightingCount: 0,
      },
    });
    const context: RankingContext = {
      ...baseContext,
      enableLocationRanking: true,
      userLocation: { lat: 35.0, lng: -120.0 },
    };

    const nearScore = calculateRankScore(signal, context, false, 10);
    const farScore = calculateRankScore(signal, context, false, 100);

    expect(nearScore).toBeGreaterThan(farScore);
  });

  it("applies category boost to effective distance", () => {
    const signal = createMockSignal({
      classification: "personal",
      conditions: {
        categoryIds: ["wildlife" as CategoryId],
      },
      analytics: {
        viewCount: 100,
        uniqueViewers: 50,
        activeViewers: 10,
        subscriberCount: 0,
        sightingCount: 0,
      },
    });

    const preferences: CategoryPreference[] = [
      { categoryId: "wildlife" as CategoryId, interactionScore: 100 },
    ];

    const contextWithPref: RankingContext = {
      ...baseContext,
      enableLocationRanking: true,
      enablePersonalization: true,
      categoryPreferences: preferences,
      userLocation: { lat: 35.0, lng: -120.0 },
    };

    const contextWithoutPref: RankingContext = {
      ...baseContext,
      enableLocationRanking: true,
      userLocation: { lat: 35.0, lng: -120.0 },
    };

    const scoreWithBoost = calculateRankScore(
      signal,
      contextWithPref,
      false,
      30
    );
    const scoreWithoutBoost = calculateRankScore(
      signal,
      contextWithoutPref,
      false,
      30
    );

    // Category boost reduces effective distance, increasing score
    expect(scoreWithBoost).toBeGreaterThan(scoreWithoutBoost);
  });

  it("adds classification bonus to final score", () => {
    const personalSignal = createMockSignal({
      classification: "personal",
    });
    const verifiedSignal = createMockSignal({
      classification: "verified",
    });
    const communitySignal = createMockSignal({
      classification: "community",
    });

    const personalScore = calculateRankScore(
      personalSignal,
      baseContext,
      false
    );
    const verifiedScore = calculateRankScore(
      verifiedSignal,
      baseContext,
      false
    );
    const communityScore = calculateRankScore(
      communitySignal,
      baseContext,
      false
    );

    expect(verifiedScore).toBeGreaterThan(personalScore);
    expect(communityScore).toBeGreaterThan(verifiedScore);
  });

  it("treats all signals as local when location ranking disabled", () => {
    const signal = createMockSignal({
      classification: "personal",
      analytics: {
        viewCount: 100,
        uniqueViewers: 50,
        activeViewers: 10,
        subscriberCount: 0,
        sightingCount: 0,
      },
    });

    const nearScore = calculateRankScore(signal, baseContext, false, 10);
    const farScore = calculateRankScore(signal, baseContext, false, 1000);

    // Distance should not matter when location ranking is disabled
    expect(nearScore).toBe(farScore);
  });
});

describe("sortByRankScore", () => {
  const createRankedSignal = (id: string, rankScore: number): RankedSignal => ({
    ...createMockSignal({ id: id as SignalId }),
    rankScore,
    isViralBoosted: false,
    categoryBoost: 1.0,
  });

  it("sorts signals by rank score descending", () => {
    const signals: RankedSignal[] = [
      createRankedSignal("sig1", 100),
      createRankedSignal("sig2", 300),
      createRankedSignal("sig3", 200),
    ];

    const sorted = sortByRankScore(signals, []);

    expect(sorted[0].id).toBe("sig2");
    expect(sorted[1].id).toBe("sig3");
    expect(sorted[2].id).toBe("sig1");
  });

  it("places pinned signals at top", () => {
    const signals: RankedSignal[] = [
      createRankedSignal("sig1", 300),
      createRankedSignal("sig2", 100),
      createRankedSignal("sig3", 200),
    ];

    const sorted = sortByRankScore(signals, ["sig2" as SignalId]);

    expect(sorted[0].id).toBe("sig2"); // Pinned
    expect(sorted[1].id).toBe("sig1"); // Highest score
    expect(sorted[2].id).toBe("sig3");
  });

  it("maintains order of multiple pinned signals", () => {
    const signals: RankedSignal[] = [
      createRankedSignal("sig1", 100),
      createRankedSignal("sig2", 200),
      createRankedSignal("sig3", 300),
    ];

    const sorted = sortByRankScore(signals, [
      "sig2" as SignalId,
      "sig1" as SignalId,
    ]);

    // Pinned signals should be at top, in their original order in the array
    expect(sorted[0].id).toBe("sig2");
    expect(sorted[1].id).toBe("sig1");
    expect(sorted[2].id).toBe("sig3");
  });

  it("does not modify original array", () => {
    const signals: RankedSignal[] = [
      createRankedSignal("sig1", 100),
      createRankedSignal("sig2", 200),
    ];

    const originalOrder = signals.map((s) => s.id);
    sortByRankScore(signals, []);

    expect(signals.map((s) => s.id)).toEqual(originalOrder);
  });

  it("handles empty signal array", () => {
    const sorted = sortByRankScore([], []);
    expect(sorted).toEqual([]);
  });

  it("handles empty pinned array", () => {
    const signals: RankedSignal[] = [
      createRankedSignal("sig1", 100),
      createRankedSignal("sig2", 200),
    ];

    const sorted = sortByRankScore(signals, []);

    expect(sorted[0].id).toBe("sig2");
    expect(sorted[1].id).toBe("sig1");
  });

  it("handles signals with same rank score", () => {
    const signals: RankedSignal[] = [
      createRankedSignal("sig1", 100),
      createRankedSignal("sig2", 100),
      createRankedSignal("sig3", 100),
    ];

    const sorted = sortByRankScore(signals, []);

    // Should maintain stable sort
    expect(sorted).toHaveLength(3);
    sorted.forEach((s) => expect(s.rankScore).toBe(100));
  });
});

describe("getSignalRepresentativePoint", () => {
  it("returns null for global signal", () => {
    const signal = createMockSignal({
      target: { kind: "global" },
    });
    const point = getSignalRepresentativePoint(signal);
    expect(point).toBe(null);
  });

  it("returns centroid for polygon signal", () => {
    const signal = createMockSignal({
      target: {
        kind: "polygon",
        polygon: {
          points: [
            { lat: 0, lng: 0 },
            { lat: 2, lng: 0 },
            { lat: 2, lng: 2 },
            { lat: 0, lng: 2 },
          ],
        },
      },
    });
    const point = getSignalRepresentativePoint(signal);
    expect(point).toEqual({ lat: 1, lng: 1 });
  });

  it("returns centroid for triangle polygon", () => {
    const signal = createMockSignal({
      target: {
        kind: "polygon",
        polygon: {
          points: [
            { lat: 0, lng: 0 },
            { lat: 3, lng: 0 },
            { lat: 0, lng: 3 },
          ],
        },
      },
    });
    const point = getSignalRepresentativePoint(signal);
    expect(point).toEqual({ lat: 1, lng: 1 });
  });

  it("returns null for polygon with no points", () => {
    const signal = createMockSignal({
      target: {
        kind: "polygon",
        polygon: {
          points: [],
        },
      },
    });
    const point = getSignalRepresentativePoint(signal);
    expect(point).toBe(null);
  });

  it("returns null for geofence signal (requires repository lookup)", () => {
    const signal = createMockSignal({
      target: {
        kind: "geofence",
        geofenceId: "geofence-123",
      },
    });
    const point = getSignalRepresentativePoint(signal);
    expect(point).toBe(null);
  });

  it("handles negative coordinates correctly", () => {
    const signal = createMockSignal({
      target: {
        kind: "polygon",
        polygon: {
          points: [
            { lat: -2, lng: -2 },
            { lat: -2, lng: 0 },
            { lat: 0, lng: 0 },
            { lat: 0, lng: -2 },
          ],
        },
      },
    });
    const point = getSignalRepresentativePoint(signal);
    expect(point).toEqual({ lat: -1, lng: -1 });
  });
});

describe("calculateViralActivity", () => {
  it("calculates activity for empty snapshots", () => {
    const data = calculateViralActivity([]);
    expect(data.last24hActivity).toBe(0);
    expect(data.previous7DayAverage).toBe(0);
  });

  it("calculates last 24h activity correctly", () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago

    const snapshots = [
      { date: yesterday.toISOString(), activity: 50 },
      { date: now.toISOString(), activity: 30 },
    ];

    const data = calculateViralActivity(snapshots);
    expect(data.last24hActivity).toBe(80);
  });

  it("excludes old activity from last 24h", () => {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const recent = new Date(now.getTime() - 12 * 60 * 60 * 1000);

    const snapshots = [
      { date: twoDaysAgo.toISOString(), activity: 100 },
      { date: recent.toISOString(), activity: 50 },
    ];

    const data = calculateViralActivity(snapshots);
    expect(data.last24hActivity).toBe(50);
  });

  it("calculates 7-day average excluding last 24h", () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 25 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    const snapshots = [
      { date: fiveDaysAgo.toISOString(), activity: 70 },
      { date: threeDaysAgo.toISOString(), activity: 140 },
      { date: yesterday.toISOString(), activity: 140 },
    ];

    const data = calculateViralActivity(snapshots);
    // (70 + 140 + 140) / 7 = 50
    expect(data.previous7DayAverage).toBe(50);
  });

  it("excludes data older than 8 days", () => {
    const now = new Date();
    const nineDaysAgo = new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    const snapshots = [
      { date: nineDaysAgo.toISOString(), activity: 1000 },
      { date: fiveDaysAgo.toISOString(), activity: 70 },
    ];

    const data = calculateViralActivity(snapshots);
    expect(data.previous7DayAverage).toBe(10); // 70 / 7
  });

  it("handles single recent snapshot", () => {
    const now = new Date();
    const recent = new Date(now.getTime() - 6 * 60 * 60 * 1000);

    const snapshots = [{ date: recent.toISOString(), activity: 25 }];

    const data = calculateViralActivity(snapshots);
    expect(data.last24hActivity).toBe(25);
    expect(data.previous7DayAverage).toBe(0);
  });
});

// Helper function to create mock signals
function createMockSignal(overrides: Partial<Signal> = {}): Signal {
  return {
    id: "signal-test" as SignalId,
    name: "Test Signal",
    ownerId: "user-123",
    target: { kind: "global" },
    triggers: ["new_sighting"],
    conditions: {},
    isActive: true,
    classification: "personal",
    analytics: {
      viewCount: 0,
      uniqueViewers: 0,
      activeViewers: 0,
      subscriberCount: 0,
      sightingCount: 0,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
