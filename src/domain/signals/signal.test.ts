import {
  createSignal,
  updateSignal,
  matchesConditions,
  shouldTrigger,
  describeConditions,
  validateSignalId,
  type NewSignal,
  type Signal,
  type SignalId,
  type SightingMatchData,
  type SignalConditions,
} from "@/domain/signals/signal";

const baseInput: NewSignal = {
  name: "Wildlife Alert",
  description: "Get notified of wildlife sightings",
  ownerId: "user-123",
  target: { kind: "global" },
  triggers: ["new_sighting", "sighting_confirmed"],
  conditions: {
    categoryIds: ["wildlife"],
    importance: ["high", "critical"],
  },
  isActive: true,
};

const testContext = {
  id: "signal-1" as SignalId,
  createdAt: new Date().toISOString(),
};

describe("createSignal", () => {
  it("accepts valid input", () => {
    const result = createSignal(baseInput, testContext);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe(baseInput.name);
      expect(result.value.ownerId).toBe(baseInput.ownerId);
      expect(result.value.isActive).toBe(true);
    }
  });

  it("rejects empty name", () => {
    const result = createSignal({ ...baseInput, name: "   " }, testContext);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("signal.name_required");
    }
  });

  it("rejects name that is too long", () => {
    const result = createSignal(
      { ...baseInput, name: "x".repeat(101) },
      testContext
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("signal.name_too_long");
    }
  });

  it("rejects description that is too long", () => {
    const result = createSignal(
      { ...baseInput, description: "x".repeat(501) },
      testContext
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("signal.description_too_long");
    }
  });

  it("rejects empty owner ID", () => {
    const result = createSignal({ ...baseInput, ownerId: "  " }, testContext);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("signal.owner_required");
    }
  });

  it("rejects empty triggers array", () => {
    const result = createSignal({ ...baseInput, triggers: [] }, testContext);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("signal.triggers_required");
    }
  });

  it("rejects duplicate triggers", () => {
    const result = createSignal(
      { ...baseInput, triggers: ["new_sighting", "new_sighting"] },
      testContext
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("signal.duplicate_triggers");
    }
  });

  it("validates polygon target", () => {
    const result = createSignal(
      {
        ...baseInput,
        target: {
          kind: "polygon",
          polygon: { points: [{ lat: 0, lng: 0 }] }, // Only 1 point (invalid)
        },
      },
      testContext
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("geo.invalid_polygon");
    }
  });

  it("accepts valid polygon target", () => {
    const result = createSignal(
      {
        ...baseInput,
        target: {
          kind: "polygon",
          polygon: {
            points: [
              { lat: 0, lng: 0 },
              { lat: 1, lng: 0 },
              { lat: 0, lng: 1 },
            ],
          },
        },
      },
      testContext
    );
    expect(result.ok).toBe(true);
  });

  it("rejects geofence target without ID", () => {
    const result = createSignal(
      {
        ...baseInput,
        target: { kind: "geofence", geofenceId: "  " },
      },
      testContext
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("signal.geofence_required");
    }
  });

  it("accepts valid geofence target", () => {
    const result = createSignal(
      {
        ...baseInput,
        target: { kind: "geofence", geofenceId: "geofence-123" },
      },
      testContext
    );
    expect(result.ok).toBe(true);
  });

  it("rejects invalid score range", () => {
    const result = createSignal(
      {
        ...baseInput,
        conditions: {
          minScore: 100,
          maxScore: 50,
        },
      },
      testContext
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("signal.invalid_score_range");
    }
  });

  it("accepts valid score range", () => {
    const result = createSignal(
      {
        ...baseInput,
        conditions: {
          minScore: 50,
          maxScore: 100,
        },
      },
      testContext
    );
    expect(result.ok).toBe(true);
  });

  it("defaults isActive to true", () => {
    const result = createSignal(
      { ...baseInput, isActive: undefined },
      testContext
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.isActive).toBe(true);
    }
  });

  it("accepts undefined conditions", () => {
    const result = createSignal(
      { ...baseInput, conditions: undefined },
      testContext
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.conditions).toEqual({});
    }
  });
});

describe("updateSignal", () => {
  const existingSignal: Signal = {
    id: "signal-1" as SignalId,
    name: "Original Name",
    description: "Original description",
    ownerId: "user-123",
    target: { kind: "global" },
    triggers: ["new_sighting"],
    conditions: {},
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  };

  it("updates name", () => {
    const result = updateSignal(
      existingSignal,
      { name: "Updated Name" },
      { updatedAt: "2024-01-02T00:00:00Z" }
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe("Updated Name");
      expect(result.value.updatedAt).toBe("2024-01-02T00:00:00Z");
    }
  });

  it("updates triggers", () => {
    const result = updateSignal(
      existingSignal,
      { triggers: ["new_sighting", "sighting_confirmed"] },
      { updatedAt: "2024-01-02T00:00:00Z" }
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.triggers).toEqual([
        "new_sighting",
        "sighting_confirmed",
      ]);
    }
  });

  it("updates isActive status", () => {
    const result = updateSignal(
      existingSignal,
      { isActive: false },
      { updatedAt: "2024-01-02T00:00:00Z" }
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.isActive).toBe(false);
    }
  });

  it("preserves ownerId (cannot be changed)", () => {
    const result = updateSignal(
      existingSignal,
      { name: "New Name" },
      { updatedAt: "2024-01-02T00:00:00Z" }
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.ownerId).toBe("user-123");
    }
  });

  it("validates updated values", () => {
    const result = updateSignal(
      existingSignal,
      { name: "" },
      { updatedAt: "2024-01-02T00:00:00Z" }
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("signal.name_required");
    }
  });
});

describe("matchesConditions", () => {
  const baseSighting: SightingMatchData = {
    categoryId: "wildlife",
    typeId: "deer",
    tags: ["mammal", "forest"],
    importance: "high",
    score: 75,
    reporterTrustLevel: "trusted",
  };

  it("matches when all AND conditions are met", () => {
    const conditions: SignalConditions = {
      categoryIds: ["wildlife"],
      importance: ["high", "critical"],
      minScore: 50,
      operator: "AND",
    };
    expect(matchesConditions(conditions, baseSighting)).toBe(true);
  });

  it("does not match when any AND condition fails", () => {
    const conditions: SignalConditions = {
      categoryIds: ["wildlife"],
      importance: ["low"],
      operator: "AND",
    };
    expect(matchesConditions(conditions, baseSighting)).toBe(false);
  });

  it("matches when any OR condition is met", () => {
    const conditions: SignalConditions = {
      categoryIds: ["infrastructure"], // Does not match
      importance: ["high"], // Matches
      operator: "OR",
    };
    expect(matchesConditions(conditions, baseSighting)).toBe(true);
  });

  it("matches category correctly", () => {
    const conditions: SignalConditions = {
      categoryIds: ["wildlife", "nature"],
    };
    expect(matchesConditions(conditions, baseSighting)).toBe(true);
  });

  it("does not match wrong category", () => {
    const conditions: SignalConditions = {
      categoryIds: ["infrastructure"],
    };
    expect(matchesConditions(conditions, baseSighting)).toBe(false);
  });

  it("matches type correctly", () => {
    const conditions: SignalConditions = {
      typeIds: ["deer", "elk"],
    };
    expect(matchesConditions(conditions, baseSighting)).toBe(true);
  });

  it("matches tags (any tag matches)", () => {
    const conditions: SignalConditions = {
      tags: ["mammal"],
    };
    expect(matchesConditions(conditions, baseSighting)).toBe(true);
  });

  it("matches when at least one tag overlaps", () => {
    const conditions: SignalConditions = {
      tags: ["bird", "mammal", "reptile"],
    };
    expect(matchesConditions(conditions, baseSighting)).toBe(true);
  });

  it("does not match when no tags overlap", () => {
    const conditions: SignalConditions = {
      tags: ["bird", "reptile"],
    };
    expect(matchesConditions(conditions, baseSighting)).toBe(false);
  });

  it("matches importance correctly", () => {
    const conditions: SignalConditions = {
      importance: ["high", "critical"],
    };
    expect(matchesConditions(conditions, baseSighting)).toBe(true);
  });

  it("checks min trust level correctly", () => {
    const conditions: SignalConditions = {
      minTrustLevel: "new",
    };
    expect(matchesConditions(conditions, baseSighting)).toBe(true);
  });

  it("rejects below min trust level", () => {
    const conditions: SignalConditions = {
      minTrustLevel: "verified",
    };
    expect(matchesConditions(conditions, baseSighting)).toBe(false);
  });

  it("checks min score correctly", () => {
    const conditions: SignalConditions = {
      minScore: 50,
    };
    expect(matchesConditions(conditions, baseSighting)).toBe(true);
  });

  it("rejects below min score", () => {
    const conditions: SignalConditions = {
      minScore: 100,
    };
    expect(matchesConditions(conditions, baseSighting)).toBe(false);
  });

  it("checks max score correctly", () => {
    const conditions: SignalConditions = {
      maxScore: 100,
    };
    expect(matchesConditions(conditions, baseSighting)).toBe(true);
  });

  it("rejects above max score", () => {
    const conditions: SignalConditions = {
      maxScore: 50,
    };
    expect(matchesConditions(conditions, baseSighting)).toBe(false);
  });

  it("checks score range correctly", () => {
    const conditions: SignalConditions = {
      minScore: 50,
      maxScore: 100,
    };
    expect(matchesConditions(conditions, baseSighting)).toBe(true);
  });

  it("matches everything when no conditions specified", () => {
    const conditions: SignalConditions = {};
    expect(matchesConditions(conditions, baseSighting)).toBe(true);
  });

  it("defaults to AND operator", () => {
    const conditions: SignalConditions = {
      categoryIds: ["wildlife"],
      importance: ["low"], // Will fail
    };
    expect(matchesConditions(conditions, baseSighting)).toBe(false);
  });
});

describe("shouldTrigger", () => {
  const signal: Signal = {
    id: "signal-1" as SignalId,
    name: "Test Signal",
    ownerId: "user-123",
    target: { kind: "global" },
    triggers: ["new_sighting", "sighting_confirmed"],
    conditions: {},
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  };

  it("triggers when signal is active and trigger is included", () => {
    expect(shouldTrigger(signal, "new_sighting")).toBe(true);
    expect(shouldTrigger(signal, "sighting_confirmed")).toBe(true);
  });

  it("does not trigger when trigger is not included", () => {
    expect(shouldTrigger(signal, "sighting_disputed")).toBe(false);
    expect(shouldTrigger(signal, "score_threshold")).toBe(false);
  });

  it("does not trigger when signal is inactive", () => {
    const inactiveSignal = { ...signal, isActive: false };
    expect(shouldTrigger(inactiveSignal, "new_sighting")).toBe(false);
  });
});

describe("describeConditions", () => {
  it("describes empty conditions", () => {
    const result = describeConditions({});
    expect(result).toBe("All sightings");
  });

  it("describes category conditions", () => {
    const result = describeConditions({
      categoryIds: ["wildlife", "nature"],
    });
    expect(result).toContain("Categories: wildlife, nature");
  });

  it("describes multiple conditions with AND", () => {
    const result = describeConditions({
      categoryIds: ["wildlife"],
      importance: ["high", "critical"],
      minTrustLevel: "trusted",
      operator: "AND",
    });
    expect(result).toContain("Categories: wildlife");
    expect(result).toContain("Importance: high, critical");
    expect(result).toContain("Min trust: trusted");
    expect(result).toContain(" AND ");
  });

  it("describes multiple conditions with OR", () => {
    const result = describeConditions({
      categoryIds: ["wildlife"],
      tags: ["urgent"],
      operator: "OR",
    });
    expect(result).toContain(" OR ");
  });

  it("describes score range", () => {
    const result = describeConditions({
      minScore: 50,
      maxScore: 100,
    });
    expect(result).toContain("Score: 50 to 100");
  });

  it("describes open-ended score range", () => {
    const result = describeConditions({
      minScore: 50,
    });
    expect(result).toContain("Score: 50 to ∞");
  });
});

describe("validateSignalId", () => {
  it("accepts valid signal ID", () => {
    const result = validateSignalId("signal-123");
    expect(result.ok).toBe(true);
  });

  it("rejects empty signal ID", () => {
    const result = validateSignalId("");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("signal.invalid_id");
    }
  });

  it("rejects whitespace-only signal ID", () => {
    const result = validateSignalId("   ");
    expect(result.ok).toBe(false);
  });
});
