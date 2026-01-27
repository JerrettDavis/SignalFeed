import {
  createUserReputation,
  applyReputationEvent,
  getReputationTier,
  createReputationEvent,
  REPUTATION_AMOUNTS,
  type UserId,
  type ReputationEventId,
  type ReputationReason,
} from "@/domain/reputation/reputation";

describe("getReputationTier", () => {
  it("returns 'verified' for verified users regardless of score", () => {
    expect(getReputationTier(0, true)).toBe("verified");
    expect(getReputationTier(100, true)).toBe("verified");
    expect(getReputationTier(-10, true)).toBe("verified");
  });

  it("returns 'trusted' for score >= 50", () => {
    expect(getReputationTier(50, false)).toBe("trusted");
    expect(getReputationTier(100, false)).toBe("trusted");
    expect(getReputationTier(1000, false)).toBe("trusted");
  });

  it("returns 'new' for score 10-49", () => {
    expect(getReputationTier(10, false)).toBe("new");
    expect(getReputationTier(25, false)).toBe("new");
    expect(getReputationTier(49, false)).toBe("new");
  });

  it("returns 'unverified' for score < 10", () => {
    expect(getReputationTier(0, false)).toBe("unverified");
    expect(getReputationTier(5, false)).toBe("unverified");
    expect(getReputationTier(9, false)).toBe("unverified");
    expect(getReputationTier(-5, false)).toBe("unverified");
  });
});

describe("createUserReputation", () => {
  it("creates reputation with default score of 0", () => {
    const now = new Date().toISOString();
    const reputation = createUserReputation("user1" as UserId, {
      createdAt: now,
    });

    expect(reputation.userId).toBe("user1");
    expect(reputation.score).toBe(0);
    expect(reputation.createdAt).toBe(now);
    expect(reputation.updatedAt).toBe(now);
  });
});

describe("createReputationEvent", () => {
  it("creates event with correct amount from REPUTATION_AMOUNTS", () => {
    const now = new Date().toISOString();
    const event = createReputationEvent(
      {
        userId: "user1" as UserId,
        reason: "sighting_created" as ReputationReason,
        referenceId: "sighting-123",
      },
      {
        id: "event1" as ReputationEventId,
        createdAt: now,
      }
    );

    expect(event.userId).toBe("user1");
    expect(event.reason).toBe("sighting_created");
    expect(event.amount).toBe(REPUTATION_AMOUNTS.sighting_created);
    expect(event.referenceId).toBe("sighting-123");
    expect(event.createdAt).toBe(now);
  });

  it("creates event without reference ID", () => {
    const now = new Date().toISOString();
    const event = createReputationEvent(
      {
        userId: "user1" as UserId,
        reason: "signal_verified" as ReputationReason,
      },
      {
        id: "event1" as ReputationEventId,
        createdAt: now,
      }
    );

    expect(event.referenceId).toBeUndefined();
  });

  it("handles all reputation reasons correctly", () => {
    const reasons: ReputationReason[] = [
      "sighting_created",
      "sighting_upvoted",
      "sighting_confirmed",
      "sighting_disputed",
      "signal_created",
      "signal_subscribed",
      "signal_verified",
      "report_upheld",
    ];

    reasons.forEach((reason) => {
      const event = createReputationEvent(
        { userId: "user1" as UserId, reason },
        {
          id: `event-${reason}` as ReputationEventId,
          createdAt: new Date().toISOString(),
        }
      );

      expect(event.amount).toBe(REPUTATION_AMOUNTS[reason]);
    });
  });
});

describe("applyReputationEvent", () => {
  it("adds positive reputation", () => {
    const now = new Date().toISOString();
    let reputation = createUserReputation("user1" as UserId, {
      createdAt: now,
    });

    const event = createReputationEvent(
      {
        userId: "user1" as UserId,
        reason: "sighting_created" as ReputationReason,
      },
      { id: "event1" as ReputationEventId, createdAt: now }
    );

    reputation = applyReputationEvent(reputation, event);

    expect(reputation.score).toBe(1); // sighting_created = +1
    expect(reputation.updatedAt).toBe(now);
  });

  it("prevents score from going below zero", () => {
    const now = new Date().toISOString();
    let reputation = createUserReputation("user1" as UserId, {
      createdAt: now,
    });
    expect(reputation.score).toBe(0);

    const event = createReputationEvent(
      {
        userId: "user1" as UserId,
        reason: "report_upheld" as ReputationReason,
      },
      { id: "event1" as ReputationEventId, createdAt: now }
    );

    reputation = applyReputationEvent(reputation, event);

    expect(reputation.score).toBe(0); // Can't go below 0
  });

  it("applies multiple events cumulatively", () => {
    const now = new Date().toISOString();
    let reputation = createUserReputation("user1" as UserId, {
      createdAt: now,
    });

    // Event 1: +1
    const event1 = createReputationEvent(
      {
        userId: "user1" as UserId,
        reason: "sighting_created" as ReputationReason,
      },
      { id: "event1" as ReputationEventId, createdAt: now }
    );

    reputation = applyReputationEvent(reputation, event1);
    expect(reputation.score).toBe(1);

    // Event 2: +2
    const event2 = createReputationEvent(
      {
        userId: "user1" as UserId,
        reason: "sighting_confirmed" as ReputationReason,
      },
      { id: "event2" as ReputationEventId, createdAt: now }
    );

    reputation = applyReputationEvent(reputation, event2);
    expect(reputation.score).toBe(3); // 0 + 1 + 2 = 3
  });

  it("allows reputation to decrease but not below zero", () => {
    const now = new Date().toISOString();
    let reputation = createUserReputation("user1" as UserId, {
      createdAt: now,
    });

    // First add some positive reputation
    const positiveEvent = createReputationEvent(
      {
        userId: "user1" as UserId,
        reason: "sighting_confirmed" as ReputationReason,
      },
      { id: "event1" as ReputationEventId, createdAt: now }
    );
    reputation = applyReputationEvent(reputation, positiveEvent);
    expect(reputation.score).toBe(2);

    // Then subtract reputation
    const negativeEvent = createReputationEvent(
      {
        userId: "user1" as UserId,
        reason: "sighting_disputed" as ReputationReason,
      },
      { id: "event2" as ReputationEventId, createdAt: now }
    );
    reputation = applyReputationEvent(reputation, negativeEvent);
    expect(reputation.score).toBe(1); // 2 + (-1) = 1
  });
});

describe("REPUTATION_AMOUNTS", () => {
  it("defines correct point values", () => {
    expect(REPUTATION_AMOUNTS.sighting_created).toBe(1);
    expect(REPUTATION_AMOUNTS.sighting_upvoted).toBe(1);
    expect(REPUTATION_AMOUNTS.sighting_confirmed).toBe(2);
    expect(REPUTATION_AMOUNTS.sighting_disputed).toBe(-1);
    expect(REPUTATION_AMOUNTS.signal_created).toBe(5);
    expect(REPUTATION_AMOUNTS.signal_subscribed).toBe(2);
    expect(REPUTATION_AMOUNTS.signal_verified).toBe(50);
    expect(REPUTATION_AMOUNTS.report_upheld).toBe(-10);
  });
});
