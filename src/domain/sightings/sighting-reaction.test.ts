import {
  createSightingReaction,
  emptyReactionCounts,
  calculateBaseScore,
  calculateHotScore,
  getSightingVisibility,
  type SightingReactionCounts,
  type SightingReactionType,
  type SightingId,
} from "@/domain/sightings/sighting-reaction";
import type { UserId } from "@/domain/reputation/reputation";

describe("emptyReactionCounts", () => {
  it("returns zero counts for all reaction types", () => {
    const counts = emptyReactionCounts();

    expect(counts.upvotes).toBe(0);
    expect(counts.downvotes).toBe(0);
    expect(counts.confirmations).toBe(0);
    expect(counts.disputes).toBe(0);
    expect(counts.spamReports).toBe(0);
  });
});

describe("calculateBaseScore", () => {
  it("calculates score with only upvotes", () => {
    const counts: SightingReactionCounts = {
      upvotes: 10,
      downvotes: 0,
      confirmations: 0,
      disputes: 0,
      spamReports: 0,
    };

    expect(calculateBaseScore(counts)).toBe(10);
  });

  it("calculates score with upvotes and downvotes", () => {
    const counts: SightingReactionCounts = {
      upvotes: 10,
      downvotes: 3,
      confirmations: 0,
      disputes: 0,
      spamReports: 0,
    };

    expect(calculateBaseScore(counts)).toBe(7); // 10 - 3
  });

  it("gives confirmations double weight", () => {
    const counts: SightingReactionCounts = {
      upvotes: 0,
      downvotes: 0,
      confirmations: 5,
      disputes: 0,
      spamReports: 0,
    };

    expect(calculateBaseScore(counts)).toBe(10); // 5 * 2
  });

  it("gives disputes double negative weight", () => {
    const counts: SightingReactionCounts = {
      upvotes: 0,
      downvotes: 0,
      confirmations: 0,
      disputes: 3,
      spamReports: 0,
    };

    expect(calculateBaseScore(counts)).toBe(-6); // 3 * -2
  });

  it("gives spam reports 5x negative weight", () => {
    const counts: SightingReactionCounts = {
      upvotes: 0,
      downvotes: 0,
      confirmations: 0,
      disputes: 0,
      spamReports: 2,
    };

    expect(calculateBaseScore(counts)).toBe(-10); // 2 * -5
  });

  it("calculates complex score correctly", () => {
    const counts: SightingReactionCounts = {
      upvotes: 15,
      downvotes: 3,
      confirmations: 4,
      disputes: 1,
      spamReports: 1,
    };

    // 15 - 3 + (4*2) - (1*2) - (1*5) = 15 - 3 + 8 - 2 - 5 = 13
    expect(calculateBaseScore(counts)).toBe(13);
  });

  it("handles zero counts", () => {
    const counts = emptyReactionCounts();
    expect(calculateBaseScore(counts)).toBe(0);
  });

  it("handles negative total score", () => {
    const counts: SightingReactionCounts = {
      upvotes: 2,
      downvotes: 10,
      confirmations: 0,
      disputes: 2,
      spamReports: 1,
    };

    // 2 - 10 + 0 - 4 - 5 = -17
    expect(calculateBaseScore(counts)).toBe(-17);
  });
});

describe("calculateHotScore", () => {
  it("returns positive score for positive base score, recent post", () => {
    const hotScore = calculateHotScore(10, 1);
    expect(hotScore).toBeGreaterThan(0);
  });

  it("returns negative score for negative base score", () => {
    const hotScore = calculateHotScore(-10, 1);
    expect(hotScore).toBeLessThan(0);
  });

  it("decays over time", () => {
    const score1Hour = calculateHotScore(10, 1);
    const score5Hours = calculateHotScore(10, 5);
    const score24Hours = calculateHotScore(10, 24);

    expect(score1Hour).toBeGreaterThan(score5Hours);
    expect(score5Hours).toBeGreaterThan(score24Hours);
  });

  it("handles zero age (brand new post)", () => {
    const hotScore = calculateHotScore(10, 0);
    expect(hotScore).toBeGreaterThan(0);
    expect(isFinite(hotScore)).toBe(true);
  });

  it("handles zero score", () => {
    const hotScore = calculateHotScore(0, 1);
    expect(hotScore).toBe(0);
  });

  it("higher scores have higher hot scores (same age)", () => {
    const hot10 = calculateHotScore(10, 5);
    const hot100 = calculateHotScore(100, 5);
    const hot1000 = calculateHotScore(1000, 5);

    expect(hot100).toBeGreaterThan(hot10);
    expect(hot1000).toBeGreaterThan(hot100);
  });

  it("uses logarithmic scaling for score magnitude", () => {
    // Log scale means doubling score doesn't double hot score
    const hot10 = calculateHotScore(10, 1);
    const hot20 = calculateHotScore(20, 1);

    expect(hot20).toBeGreaterThan(hot10);
    expect(hot20).toBeLessThan(hot10 * 2);
  });
});

describe("getSightingVisibility", () => {
  it("returns 'visible' for score >= 0", () => {
    expect(getSightingVisibility(0, 0)).toBe("visible");
    expect(getSightingVisibility(1, 0)).toBe("visible");
    expect(getSightingVisibility(100, 0)).toBe("visible");
  });

  it("returns 'low_quality' for score -1 to -4", () => {
    expect(getSightingVisibility(-1, 0)).toBe("low_quality");
    expect(getSightingVisibility(-3, 0)).toBe("low_quality");
    expect(getSightingVisibility(-4, 0)).toBe("low_quality");
  });

  it("returns 'hidden' for score <= -5", () => {
    expect(getSightingVisibility(-5, 0)).toBe("hidden");
    expect(getSightingVisibility(-6, 0)).toBe("hidden");
    expect(getSightingVisibility(-10, 2)).toBe("hidden");
    expect(getSightingVisibility(-100, 0)).toBe("hidden");
  });

  it("returns 'hidden' for spam reports >= 3", () => {
    expect(getSightingVisibility(10, 3)).toBe("hidden");
    expect(getSightingVisibility(0, 5)).toBe("hidden");
    expect(getSightingVisibility(-10, 3)).toBe("hidden");
  });

  it("prioritizes spam over other states", () => {
    // Even with positive score, spam reports hide it
    expect(getSightingVisibility(100, 3)).toBe("hidden");
  });
});

describe("createSightingReaction", () => {
  it("creates reaction with correct fields", () => {
    const now = new Date().toISOString();
    const reaction = createSightingReaction(
      {
        sightingId: "sighting-1" as SightingId,
        userId: "user-1" as UserId,
        type: "upvote" as SightingReactionType,
      },
      { createdAt: now }
    );

    expect(reaction.sightingId).toBe("sighting-1");
    expect(reaction.userId).toBe("user-1");
    expect(reaction.type).toBe("upvote");
    expect(reaction.createdAt).toBe(now);
  });

  it("creates reactions of all types", () => {
    const types: SightingReactionType[] = [
      "upvote",
      "downvote",
      "confirmed",
      "disputed",
      "spam",
    ];

    types.forEach((type) => {
      const reaction = createSightingReaction(
        {
          sightingId: "sighting-1" as SightingId,
          userId: "user-1" as UserId,
          type,
        },
        { createdAt: new Date().toISOString() }
      );

      expect(reaction.type).toBe(type);
    });
  });
});

describe("Scoring integration", () => {
  it("realistic example: popular recent sighting", () => {
    const counts: SightingReactionCounts = {
      upvotes: 50,
      downvotes: 5,
      confirmations: 10,
      disputes: 2,
      spamReports: 0,
    };

    // 50 - 5 + 20 - 4 - 0 = 61
    const baseScore = calculateBaseScore(counts);
    expect(baseScore).toBe(61);

    // Should have high hot score (1 hour old)
    const hotScore = calculateHotScore(baseScore, 1);
    expect(hotScore).toBeGreaterThan(0.3); // ~0.34 for this example

    expect(getSightingVisibility(baseScore, counts.spamReports)).toBe(
      "visible"
    );
  });

  it("realistic example: disputed old sighting", () => {
    const counts: SightingReactionCounts = {
      upvotes: 3,
      downvotes: 8,
      confirmations: 0,
      disputes: 5,
      spamReports: 0,
    };

    // 3 - 8 + 0 - 10 - 0 = -15
    const baseScore = calculateBaseScore(counts);
    expect(baseScore).toBe(-15);

    // Should have very low hot score (24 hours old)
    const hotScore = calculateHotScore(baseScore, 24);
    expect(hotScore).toBeLessThan(-0.008); // ~-0.00887 for this example

    expect(getSightingVisibility(baseScore, counts.spamReports)).toBe("hidden");
  });

  it("realistic example: spam reported sighting", () => {
    const counts: SightingReactionCounts = {
      upvotes: 5,
      downvotes: 2,
      confirmations: 0,
      disputes: 0,
      spamReports: 3,
    };

    // 5 - 2 + 0 - 0 - 15 = -12
    const baseScore = calculateBaseScore(counts);
    expect(baseScore).toBe(-12);

    // Spam reports >= 3 results in hidden visibility
    expect(getSightingVisibility(baseScore, counts.spamReports)).toBe("hidden");
  });

  it("realistic example: mediocre sighting losing relevance", () => {
    const counts: SightingReactionCounts = {
      upvotes: 10,
      downvotes: 7,
      confirmations: 2,
      disputes: 1,
      spamReports: 0,
    };

    // 10 - 7 + 4 - 2 - 0 = 5
    const baseScore = calculateBaseScore(counts);
    expect(baseScore).toBe(5);

    const hot1h = calculateHotScore(baseScore, 1);
    const hot12h = calculateHotScore(baseScore, 12);
    const hot48h = calculateHotScore(baseScore, 48);

    expect(hot1h).toBeGreaterThan(hot12h);
    expect(hot12h).toBeGreaterThan(hot48h);
    expect(hot48h).toBeGreaterThan(0); // Still positive but very small

    expect(getSightingVisibility(baseScore, counts.spamReports)).toBe(
      "visible"
    );
  });
});
