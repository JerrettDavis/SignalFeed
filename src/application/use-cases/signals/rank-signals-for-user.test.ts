import {
  buildRankSignalsForUser,
  type RankSignalsForUserInput,
} from "@/application/use-cases/signals/rank-signals-for-user";
import type { SignalRepository } from "@/ports/signal-repository";
import type { UserRepository } from "@/ports/user-repository";
import type { UserPrivacySettingsRepository } from "@/ports/user-privacy-settings-repository";
import type { UserCategoryInteractionRepository } from "@/ports/user-category-interaction-repository";
import type { UserSignalPreferenceRepository } from "@/ports/user-signal-preference-repository";
import type { SignalActivitySnapshotRepository } from "@/ports/signal-activity-snapshot-repository";
import type { GeofenceRepository } from "@/ports/geofence-repository";
import type { Signal, SignalId } from "@/domain/signals/signal";
import type { User, UserId } from "@/domain/users/user";
import type { UserPrivacySettings } from "@/domain/users/user-privacy-settings";
import type { CategoryId } from "@/domain/sightings/sighting";

describe("buildRankSignalsForUser", () => {
  // Mock repositories
  let mockSignalRepo: SignalRepository;
  let mockUserRepo: UserRepository;
  let mockPrivacyRepo: UserPrivacySettingsRepository;
  let mockCategoryInteractionRepo: UserCategoryInteractionRepository;
  let mockSignalPreferenceRepo: UserSignalPreferenceRepository;
  let mockActivitySnapshotRepo: SignalActivitySnapshotRepository;
  let mockGeofenceRepo: GeofenceRepository;

  const mockUser: User = {
    id: "user-123" as UserId,
    email: "test@example.com",
    role: "user",
    status: "active",
    membershipTier: "free",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockSignal1: Signal = {
    id: "signal-1" as SignalId,
    name: "Wildlife Alert",
    ownerId: "user-123",
    target: { kind: "global" },
    triggers: ["new_sighting"],
    conditions: {
      categoryIds: ["wildlife" as CategoryId],
    },
    isActive: true,
    classification: "personal",
    analytics: {
      viewCount: 20,
      uniqueViewers: 10,
      activeViewers: 2,
      subscriberCount: 2,
      sightingCount: 4,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockSignal2: Signal = {
    id: "signal-2" as SignalId,
    name: "Nature Alert",
    ownerId: "user-456",
    target: {
      kind: "polygon",
      polygon: {
        points: [
          { lat: 35.0, lng: -120.0 },
          { lat: 35.1, lng: -120.0 },
          { lat: 35.1, lng: -120.1 },
          { lat: 35.0, lng: -120.1 },
        ],
      },
    },
    triggers: ["new_sighting"],
    conditions: {
      categoryIds: ["nature" as CategoryId],
    },
    isActive: true,
    classification: "community",
    analytics: {
      viewCount: 10,
      uniqueViewers: 5,
      activeViewers: 1,
      subscriberCount: 1,
      sightingCount: 2,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockSignal3: Signal = {
    id: "signal-3" as SignalId,
    name: "Official Alert",
    ownerId: "admin-1",
    target: { kind: "global" },
    triggers: ["new_sighting"],
    conditions: {},
    isActive: true,
    classification: "official",
    analytics: {
      viewCount: 1000,
      uniqueViewers: 500,
      activeViewers: 100,
      subscriberCount: 100,
      sightingCount: 200,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    // Setup mock repositories with default implementations
    mockUserRepo = {
      getById: async (id: string) => (id === "user-123" ? mockUser : null),
    } as UserRepository;

    mockSignalRepo = {
      list: async () => [mockSignal1, mockSignal2, mockSignal3],
    } as SignalRepository;

    mockPrivacyRepo = {
      getByUserId: async () => null,
    } as UserPrivacySettingsRepository;

    mockCategoryInteractionRepo = {
      getTopCategoriesForUser: async () => [],
    } as UserCategoryInteractionRepository;

    mockSignalPreferenceRepo = {
      getHiddenSignalIds: async () => [],
      getPinnedSignalIds: async () => [],
      getUnimportantSignalIds: async () => [],
    } as UserSignalPreferenceRepository;

    mockActivitySnapshotRepo = {
      getRecentForSignal: async () => [],
    } as SignalActivitySnapshotRepository;

    mockGeofenceRepo = {} as GeofenceRepository;
  });

  it("returns error when user not found", async () => {
    const rankSignals = buildRankSignalsForUser({
      signalRepository: mockSignalRepo,
      userRepository: mockUserRepo,
      userPrivacySettingsRepository: mockPrivacyRepo,
      userCategoryInteractionRepository: mockCategoryInteractionRepo,
      userSignalPreferenceRepository: mockSignalPreferenceRepo,
      signalActivitySnapshotRepository: mockActivitySnapshotRepo,
      geofenceRepository: mockGeofenceRepo,
    });

    const input: RankSignalsForUserInput = {
      userId: "nonexistent",
    };

    const result = await rankSignals(input);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("user.not_found");
    }
  });

  it("returns ranked signals for valid user", async () => {
    const rankSignals = buildRankSignalsForUser({
      signalRepository: mockSignalRepo,
      userRepository: mockUserRepo,
      userPrivacySettingsRepository: mockPrivacyRepo,
      userCategoryInteractionRepository: mockCategoryInteractionRepo,
      userSignalPreferenceRepository: mockSignalPreferenceRepo,
      signalActivitySnapshotRepository: mockActivitySnapshotRepo,
      geofenceRepository: mockGeofenceRepo,
    });

    const input: RankSignalsForUserInput = {
      userId: "user-123",
    };

    const result = await rankSignals(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(3);
      expect(result.value[0]).toHaveProperty("rankScore");
      expect(result.value[0]).toHaveProperty("isViralBoosted");
      expect(result.value[0]).toHaveProperty("categoryBoost");
    }
  });

  it("places official global signals at top", async () => {
    const rankSignals = buildRankSignalsForUser({
      signalRepository: mockSignalRepo,
      userRepository: mockUserRepo,
      userPrivacySettingsRepository: mockPrivacyRepo,
      userCategoryInteractionRepository: mockCategoryInteractionRepo,
      userSignalPreferenceRepository: mockSignalPreferenceRepo,
      signalActivitySnapshotRepository: mockActivitySnapshotRepo,
      geofenceRepository: mockGeofenceRepo,
    });

    const input: RankSignalsForUserInput = {
      userId: "user-123",
    };

    const result = await rankSignals(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Find the official signal
      const officialSignal = result.value.find(
        (s) => s.classification === "official"
      );
      expect(officialSignal).toBeDefined();
      expect(officialSignal?.id).toBe("signal-3");
      // Official signal should have very high rank score
      expect(officialSignal?.rankScore).toBeGreaterThan(10000);
      // Official signal should be first
      expect(result.value[0].id).toBe("signal-3");
    }
  });

  it("filters out hidden signals by default", async () => {
    mockSignalPreferenceRepo = {
      ...mockSignalPreferenceRepo,
      getHiddenSignalIds: async () => ["signal-1" as SignalId],
    };

    const rankSignals = buildRankSignalsForUser({
      signalRepository: mockSignalRepo,
      userRepository: mockUserRepo,
      userPrivacySettingsRepository: mockPrivacyRepo,
      userCategoryInteractionRepository: mockCategoryInteractionRepo,
      userSignalPreferenceRepository: mockSignalPreferenceRepo,
      signalActivitySnapshotRepository: mockActivitySnapshotRepo,
      geofenceRepository: mockGeofenceRepo,
    });

    const input: RankSignalsForUserInput = {
      userId: "user-123",
    };

    const result = await rankSignals(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      expect(result.value.find((s) => s.id === "signal-1")).toBeUndefined();
    }
  });

  it("includes hidden signals when requested", async () => {
    mockSignalPreferenceRepo = {
      ...mockSignalPreferenceRepo,
      getHiddenSignalIds: async () => ["signal-1" as SignalId],
    };

    const rankSignals = buildRankSignalsForUser({
      signalRepository: mockSignalRepo,
      userRepository: mockUserRepo,
      userPrivacySettingsRepository: mockPrivacyRepo,
      userCategoryInteractionRepository: mockCategoryInteractionRepo,
      userSignalPreferenceRepository: mockSignalPreferenceRepo,
      signalActivitySnapshotRepository: mockActivitySnapshotRepo,
      geofenceRepository: mockGeofenceRepo,
    });

    const input: RankSignalsForUserInput = {
      userId: "user-123",
      includeHidden: true,
    };

    const result = await rankSignals(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(3);
      expect(result.value.find((s) => s.id === "signal-1")).toBeDefined();
    }
  });

  it("places pinned signals at top", async () => {
    mockSignalPreferenceRepo = {
      ...mockSignalPreferenceRepo,
      getPinnedSignalIds: async () => ["signal-1" as SignalId],
    };

    const rankSignals = buildRankSignalsForUser({
      signalRepository: mockSignalRepo,
      userRepository: mockUserRepo,
      userPrivacySettingsRepository: mockPrivacyRepo,
      userCategoryInteractionRepository: mockCategoryInteractionRepo,
      userSignalPreferenceRepository: mockSignalPreferenceRepo,
      signalActivitySnapshotRepository: mockActivitySnapshotRepo,
      geofenceRepository: mockGeofenceRepo,
    });

    const input: RankSignalsForUserInput = {
      userId: "user-123",
    };

    const result = await rankSignals(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0].id).toBe("signal-1");
    }
  });

  it("penalizes unimportant community signals", async () => {
    mockSignalPreferenceRepo = {
      ...mockSignalPreferenceRepo,
      getUnimportantSignalIds: async () => ["signal-2" as SignalId],
    };

    const rankSignals = buildRankSignalsForUser({
      signalRepository: mockSignalRepo,
      userRepository: mockUserRepo,
      userPrivacySettingsRepository: mockPrivacyRepo,
      userCategoryInteractionRepository: mockCategoryInteractionRepo,
      userSignalPreferenceRepository: mockSignalPreferenceRepo,
      signalActivitySnapshotRepository: mockActivitySnapshotRepo,
      geofenceRepository: mockGeofenceRepo,
    });

    const input: RankSignalsForUserInput = {
      userId: "user-123",
    };

    const result = await rankSignals(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const signal2 = result.value.find((s) => s.id === "signal-2");
      expect(signal2?.rankScore).toBe(-1000);
      // Should be at the bottom
      expect(result.value[result.value.length - 1].id).toBe("signal-2");
    }
  });

  it("respects privacy settings for personalization", async () => {
    mockPrivacyRepo = {
      getByUserId: async () =>
        ({
          enablePersonalization: false,
        }) as UserPrivacySettings,
    };

    mockCategoryInteractionRepo = {
      getTopCategoriesForUser: async () => [
        {
          categoryId: "wildlife" as CategoryId,
          clickCount: 50,
          subscriptionCount: 5,
        },
      ],
    };

    const rankSignals = buildRankSignalsForUser({
      signalRepository: mockSignalRepo,
      userRepository: mockUserRepo,
      userPrivacySettingsRepository: mockPrivacyRepo,
      userCategoryInteractionRepository: mockCategoryInteractionRepo,
      userSignalPreferenceRepository: mockSignalPreferenceRepo,
      signalActivitySnapshotRepository: mockActivitySnapshotRepo,
      geofenceRepository: mockGeofenceRepo,
    });

    const input: RankSignalsForUserInput = {
      userId: "user-123",
    };

    const result = await rankSignals(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      // All signals should have categoryBoost of 1.0 (no personalization)
      result.value.forEach((signal) => {
        expect(signal.categoryBoost).toBe(1.0);
      });
    }
  });

  it("applies category preference boost when personalization enabled", async () => {
    mockPrivacyRepo = {
      getByUserId: async () =>
        ({
          enablePersonalization: true,
        }) as UserPrivacySettings,
    };

    mockCategoryInteractionRepo = {
      getTopCategoriesForUser: async () => [
        {
          categoryId: "wildlife" as CategoryId,
          clickCount: 50,
          subscriptionCount: 5,
        },
      ],
    };

    const rankSignals = buildRankSignalsForUser({
      signalRepository: mockSignalRepo,
      userRepository: mockUserRepo,
      userPrivacySettingsRepository: mockPrivacyRepo,
      userCategoryInteractionRepository: mockCategoryInteractionRepo,
      userSignalPreferenceRepository: mockSignalPreferenceRepo,
      signalActivitySnapshotRepository: mockActivitySnapshotRepo,
      geofenceRepository: mockGeofenceRepo,
    });

    const input: RankSignalsForUserInput = {
      userId: "user-123",
    };

    const result = await rankSignals(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const wildlifeSignal = result.value.find((s) => s.id === "signal-1");
      expect(wildlifeSignal?.categoryBoost).toBe(3.0); // Top preference
    }
  });

  it("calculates distance when location ranking enabled", async () => {
    mockPrivacyRepo = {
      getByUserId: async () =>
        ({
          enableLocationSharing: true,
        }) as UserPrivacySettings,
    };

    const rankSignals = buildRankSignalsForUser({
      signalRepository: mockSignalRepo,
      userRepository: mockUserRepo,
      userPrivacySettingsRepository: mockPrivacyRepo,
      userCategoryInteractionRepository: mockCategoryInteractionRepo,
      userSignalPreferenceRepository: mockSignalPreferenceRepo,
      signalActivitySnapshotRepository: mockActivitySnapshotRepo,
      geofenceRepository: mockGeofenceRepo,
    });

    const input: RankSignalsForUserInput = {
      userId: "user-123",
      userLocation: { lat: 35.05, lng: -120.05 },
    };

    const result = await rankSignals(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const polygonSignal = result.value.find((s) => s.id === "signal-2");
      expect(polygonSignal?.distanceKm).toBeDefined();
      expect(polygonSignal?.distanceKm).toBeGreaterThan(0);
    }
  });

  it("does not calculate distance when location ranking disabled", async () => {
    mockPrivacyRepo = {
      getByUserId: async () =>
        ({
          enableLocationSharing: false,
        }) as UserPrivacySettings,
    };

    const rankSignals = buildRankSignalsForUser({
      signalRepository: mockSignalRepo,
      userRepository: mockUserRepo,
      userPrivacySettingsRepository: mockPrivacyRepo,
      userCategoryInteractionRepository: mockCategoryInteractionRepo,
      userSignalPreferenceRepository: mockSignalPreferenceRepo,
      signalActivitySnapshotRepository: mockActivitySnapshotRepo,
      geofenceRepository: mockGeofenceRepo,
    });

    const input: RankSignalsForUserInput = {
      userId: "user-123",
      userLocation: { lat: 35.05, lng: -120.05 },
    };

    const result = await rankSignals(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const polygonSignal = result.value.find((s) => s.id === "signal-2");
      expect(polygonSignal?.distanceKm).toBeUndefined();
    }
  });

  it("detects viral boost from activity snapshots", async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    mockActivitySnapshotRepo = {
      getRecentForSignal: async (signalId) => {
        if (signalId === ("signal-1" as SignalId)) {
          return [
            {
              signalId: signalId,
              snapshotDate: yesterday.toISOString(),
              newSubscribers: 50,
              newSightings: 50,
              viewCount: 100,
            },
            {
              signalId: signalId,
              snapshotDate: threeDaysAgo.toISOString(),
              newSubscribers: 10,
              newSightings: 10,
              viewCount: 10,
            },
          ];
        }
        return [];
      },
    } as SignalActivitySnapshotRepository;

    const rankSignals = buildRankSignalsForUser({
      signalRepository: mockSignalRepo,
      userRepository: mockUserRepo,
      userPrivacySettingsRepository: mockPrivacyRepo,
      userCategoryInteractionRepository: mockCategoryInteractionRepo,
      userSignalPreferenceRepository: mockSignalPreferenceRepo,
      signalActivitySnapshotRepository: mockActivitySnapshotRepo,
      geofenceRepository: mockGeofenceRepo,
    });

    const input: RankSignalsForUserInput = {
      userId: "user-123",
    };

    const result = await rankSignals(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const viralSignal = result.value.find((s) => s.id === "signal-1");
      expect(viralSignal?.isViralBoosted).toBe(true);
    }
  });

  it("applies filters to signal list", async () => {
    mockSignalRepo = {
      list: async (filters) => {
        expect(filters).toEqual({ ownerId: "user-123" });
        return [mockSignal1];
      },
    } as SignalRepository;

    const rankSignals = buildRankSignalsForUser({
      signalRepository: mockSignalRepo,
      userRepository: mockUserRepo,
      userPrivacySettingsRepository: mockPrivacyRepo,
      userCategoryInteractionRepository: mockCategoryInteractionRepo,
      userSignalPreferenceRepository: mockSignalPreferenceRepo,
      signalActivitySnapshotRepository: mockActivitySnapshotRepo,
      geofenceRepository: mockGeofenceRepo,
    });

    const input: RankSignalsForUserInput = {
      userId: "user-123",
      filters: {
        ownerId: "user-123",
      },
    };

    const result = await rankSignals(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
    }
  });

  it("combines multiple preference factors correctly", async () => {
    mockPrivacyRepo = {
      getByUserId: async () =>
        ({
          enablePersonalization: true,
          enableLocationSharing: true,
        }) as UserPrivacySettings,
    };

    mockCategoryInteractionRepo = {
      getTopCategoriesForUser: async () => [
        {
          categoryId: "nature" as CategoryId,
          clickCount: 50,
          subscriptionCount: 5,
        },
      ],
    };

    mockSignalPreferenceRepo = {
      ...mockSignalPreferenceRepo,
      getPinnedSignalIds: async () => ["signal-2" as SignalId],
    };

    const rankSignals = buildRankSignalsForUser({
      signalRepository: mockSignalRepo,
      userRepository: mockUserRepo,
      userPrivacySettingsRepository: mockPrivacyRepo,
      userCategoryInteractionRepository: mockCategoryInteractionRepo,
      userSignalPreferenceRepository: mockSignalPreferenceRepo,
      signalActivitySnapshotRepository: mockActivitySnapshotRepo,
      geofenceRepository: mockGeofenceRepo,
    });

    const input: RankSignalsForUserInput = {
      userId: "user-123",
      userLocation: { lat: 35.05, lng: -120.05 },
    };

    const result = await rankSignals(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Pinned signal should be at top
      expect(result.value[0].id).toBe("signal-2");
      // Should have category boost
      expect(result.value[0].categoryBoost).toBe(3.0);
      // Should have distance calculated
      expect(result.value[0].distanceKm).toBeDefined();
    }
  });

  it("handles empty signal list", async () => {
    mockSignalRepo = {
      list: async () => [],
    } as SignalRepository;

    const rankSignals = buildRankSignalsForUser({
      signalRepository: mockSignalRepo,
      userRepository: mockUserRepo,
      userPrivacySettingsRepository: mockPrivacyRepo,
      userCategoryInteractionRepository: mockCategoryInteractionRepo,
      userSignalPreferenceRepository: mockSignalPreferenceRepo,
      signalActivitySnapshotRepository: mockActivitySnapshotRepo,
      geofenceRepository: mockGeofenceRepo,
    });

    const input: RankSignalsForUserInput = {
      userId: "user-123",
    };

    const result = await rankSignals(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
  });

  it("defaults privacy settings when not configured", async () => {
    mockPrivacyRepo = {
      getByUserId: async () => null,
    };

    const rankSignals = buildRankSignalsForUser({
      signalRepository: mockSignalRepo,
      userRepository: mockUserRepo,
      userPrivacySettingsRepository: mockPrivacyRepo,
      userCategoryInteractionRepository: mockCategoryInteractionRepo,
      userSignalPreferenceRepository: mockSignalPreferenceRepo,
      signalActivitySnapshotRepository: mockActivitySnapshotRepo,
      geofenceRepository: mockGeofenceRepo,
    });

    const input: RankSignalsForUserInput = {
      userId: "user-123",
      userLocation: { lat: 35.0, lng: -120.0 },
    };

    const result = await rankSignals(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Should default to privacy-first settings (no personalization/location)
      result.value.forEach((signal) => {
        expect(signal.categoryBoost).toBe(1.0);
        expect(signal.distanceKm).toBeUndefined();
      });
    }
  });

  it("ranks based on popularity when no user preferences", async () => {
    const rankSignals = buildRankSignalsForUser({
      signalRepository: mockSignalRepo,
      userRepository: mockUserRepo,
      userPrivacySettingsRepository: mockPrivacyRepo,
      userCategoryInteractionRepository: mockCategoryInteractionRepo,
      userSignalPreferenceRepository: mockSignalPreferenceRepo,
      signalActivitySnapshotRepository: mockActivitySnapshotRepo,
      geofenceRepository: mockGeofenceRepo,
    });

    const input: RankSignalsForUserInput = {
      userId: "user-123",
    };

    const result = await rankSignals(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Official signal should be first
      expect(result.value[0].id).toBe("signal-3");
      // Personal signal with higher popularity should be second
      expect(result.value[1].id).toBe("signal-1");
      // Community signal with lower popularity should be third
      expect(result.value[2].id).toBe("signal-2");
    }
  });
});
