/**
 * Signal Evaluation Engine
 *
 * Determines when signals should trigger based on sighting events.
 * This is a pure functional service - no I/O operations, only evaluation logic.
 *
 * Key responsibilities:
 * 1. Match sightings against signal conditions (geography, category, type, importance, trust level)
 * 2. Support different trigger types (new_sighting, sighting_confirmed, score_threshold)
 * 3. Evaluate complex conditions with AND/OR logic
 * 4. Handle both geofence and custom polygon matching
 * 5. Check user trust levels
 */

import type { LatLng, Polygon } from "@/domain/geo/geo";
import type { Geofence } from "@/domain/geofences/geofence";
import type { ReputationTier } from "@/domain/reputation/reputation";
import type {
  Signal,
  SignalConditions,
  SignalTarget,
  TriggerType,
  SightingMatchData,
} from "@/domain/signals/signal";
import { matchesConditions as domainMatchesConditions } from "@/domain/signals/signal";
import type {
  Sighting,
  SightingImportance,
  CategoryId,
  SightingTypeId,
} from "@/domain/sightings/sighting";
import type { SightingType } from "@/domain/taxonomy/taxonomy";
import { pointInPolygon } from "@/shared/geo";
import { getReputationTier } from "@/domain/reputation/reputation";

// Event types that can trigger signal evaluation
export type SignalEvent =
  | { type: "new_sighting"; sighting: Sighting }
  | { type: "sighting_confirmed"; sighting: Sighting }
  | { type: "sighting_disputed"; sighting: Sighting }
  | { type: "score_threshold"; sighting: Sighting };

// Context needed for evaluation
export type EvaluationContext = {
  // Geofences available for matching
  geofences: Map<string, Geofence>;

  // Sighting types for tag resolution
  sightingTypes: Map<string, SightingType>;

  // User reputation for trust level checking
  userReputation: Map<string, { score: number; isVerified?: boolean }>;
};

// Result of evaluating a single signal
export type SignalEvaluation = {
  signal: Signal;
  matched: boolean;
  reason?: string; // Why it matched or didn't match
};

/**
 * Evaluate a sighting against all active signals to find matches.
 *
 * @param sighting - The sighting to evaluate
 * @param signals - All signals to check against
 * @param event - The type of event that triggered evaluation
 * @param context - Additional data needed for evaluation
 * @returns Array of signals that match the sighting
 */
export const evaluateSighting = (
  sighting: Sighting,
  signals: Signal[],
  event: SignalEvent,
  context: EvaluationContext
): Signal[] => {
  const matchingSignals: Signal[] = [];

  for (const signal of signals) {
    // Skip inactive signals
    if (!signal.isActive) {
      continue;
    }

    // Check if this event type should trigger this signal
    if (!shouldTrigger(signal, event.type)) {
      continue;
    }

    // Check geographic bounds
    if (!matchesGeography(sighting, signal, context)) {
      continue;
    }

    // Check conditions (category, type, importance, trust, score, etc.)
    if (!matchesSignalConditions(sighting, signal, context)) {
      continue;
    }

    matchingSignals.push(signal);
  }

  return matchingSignals;
};

/**
 * Evaluate a sighting against all signals with detailed results.
 * Useful for debugging or admin interfaces.
 *
 * @param sighting - The sighting to evaluate
 * @param signals - All signals to check against
 * @param event - The type of event that triggered evaluation
 * @param context - Additional data needed for evaluation
 * @returns Array of evaluation results with match reasons
 */
export const evaluateSightingDetailed = (
  sighting: Sighting,
  signals: Signal[],
  event: SignalEvent,
  context: EvaluationContext
): SignalEvaluation[] => {
  return signals.map((signal) => {
    // Check if active
    if (!signal.isActive) {
      return {
        signal,
        matched: false,
        reason: "Signal is not active",
      };
    }

    // Check trigger type
    if (!shouldTrigger(signal, event.type)) {
      return {
        signal,
        matched: false,
        reason: `Signal does not trigger on ${event.type}`,
      };
    }

    // Check geography
    const geoMatch = matchesGeography(sighting, signal, context);
    if (!geoMatch) {
      return {
        signal,
        matched: false,
        reason: "Sighting location is outside signal geographic bounds",
      };
    }

    // Check conditions
    const conditionsMatch = matchesSignalConditions(sighting, signal, context);
    if (!conditionsMatch) {
      return {
        signal,
        matched: false,
        reason: "Sighting does not match signal conditions",
      };
    }

    return {
      signal,
      matched: true,
      reason: "All criteria matched",
    };
  });
};

/**
 * Check if a signal should trigger for a given event type.
 *
 * @param signal - The signal to check
 * @param eventType - The event type
 * @returns True if the signal should trigger
 */
export const shouldTrigger = (
  signal: Signal,
  eventType: TriggerType
): boolean => {
  return signal.triggers.includes(eventType);
};

/**
 * Check if a sighting's location matches a signal's geographic target.
 *
 * @param sighting - The sighting to check
 * @param signal - The signal with geographic target
 * @param context - Evaluation context with geofences
 * @returns True if the location matches
 */
export const matchesGeography = (
  sighting: Sighting,
  signal: Signal,
  context: EvaluationContext
): boolean => {
  const target = signal.target;

  switch (target.kind) {
    case "global":
      // Global signals match all locations
      return true;

    case "polygon":
      // Check if point is within custom polygon
      return pointInPolygon(target.polygon, sighting.location);

    case "geofence": {
      // Look up geofence and check if point is within it
      const geofence = context.geofences.get(target.geofenceId);
      if (!geofence) {
        // Geofence not found - don't match (could be deleted)
        return false;
      }
      return pointInPolygon(geofence.polygon, sighting.location);
    }

    default:
      // Unknown target kind - don't match
      return false;
  }
};

/**
 * Check if a sighting matches a signal's conditions.
 * This includes category, type, tags, importance, trust level, and score filters.
 *
 * @param sighting - The sighting to check
 * @param signal - The signal with conditions
 * @param context - Evaluation context with types and reputation data
 * @returns True if all conditions match
 */
export const matchesSignalConditions = (
  sighting: Sighting,
  signal: Signal,
  context: EvaluationContext
): boolean => {
  const conditions = signal.conditions;

  // Build sighting match data
  const sightingType = context.sightingTypes.get(sighting.typeId);
  const tags = sightingType?.tags || [];

  // Get reporter's trust level
  const reporterTrustLevel = getReporterTrustLevel(
    sighting.reporterId,
    context.userReputation
  );

  const matchData: SightingMatchData = {
    categoryId: sighting.categoryId,
    typeId: sighting.typeId,
    tags,
    importance: sighting.importance,
    score: sighting.score,
    reporterTrustLevel,
  };

  // Use domain logic for condition matching
  return domainMatchesConditions(conditions, matchData);
};

/**
 * Get the reputation tier for a user.
 *
 * @param userId - The user ID (optional)
 * @param userReputation - Map of user IDs to reputation data
 * @returns The user's reputation tier
 */
const getReporterTrustLevel = (
  userId: string | undefined,
  userReputation: Map<string, { score: number; isVerified?: boolean }>
): ReputationTier => {
  if (!userId) {
    // Anonymous sightings are unverified
    return "unverified";
  }

  const reputation = userReputation.get(userId);
  if (!reputation) {
    // No reputation data - treat as unverified
    return "unverified";
  }

  return getReputationTier(reputation.score, reputation.isVerified);
};

/**
 * Filter signals by whether they would match a given sighting.
 * Useful for preview/debugging.
 *
 * @param sighting - The sighting to test
 * @param signals - Signals to filter
 * @param context - Evaluation context
 * @returns Signals that would match this sighting
 */
export const filterMatchingSignals = (
  sighting: Sighting,
  signals: Signal[],
  context: EvaluationContext
): Signal[] => {
  return signals.filter((signal) => {
    if (!signal.isActive) return false;
    if (!matchesGeography(sighting, signal, context)) return false;
    if (!matchesSignalConditions(sighting, signal, context)) return false;
    return true;
  });
};

/**
 * Check if a sighting would match a specific signal, regardless of trigger type.
 * Useful for "preview" functionality when creating/editing signals.
 *
 * @param sighting - The sighting to check
 * @param signal - The signal to check against
 * @param context - Evaluation context
 * @returns True if the sighting matches the signal's geography and conditions
 */
export const wouldMatch = (
  sighting: Sighting,
  signal: Signal,
  context: EvaluationContext
): boolean => {
  return (
    matchesGeography(sighting, signal, context) &&
    matchesSignalConditions(sighting, signal, context)
  );
};

/**
 * Batch evaluate multiple sightings against a single signal.
 * Optimized for checking which sightings belong to a signal feed.
 *
 * @param sightings - Array of sightings to evaluate
 * @param signal - The signal to check against
 * @param context - Evaluation context
 * @returns Array of sightings that match the signal
 */
export const evaluateSignalFeed = (
  sightings: Sighting[],
  signal: Signal,
  context: EvaluationContext
): Sighting[] => {
  if (!signal.isActive) {
    return [];
  }

  return sightings.filter((sighting) => wouldMatch(sighting, signal, context));
};

/**
 * Find signals that are waiting for score threshold triggers.
 * These should be evaluated periodically in batch jobs.
 *
 * @param signals - All signals to check
 * @returns Signals that have score_threshold triggers
 */
export const findScoreThresholdSignals = (signals: Signal[]): Signal[] => {
  return signals.filter(
    (signal) => signal.isActive && signal.triggers.includes("score_threshold")
  );
};

/**
 * Check if a sighting has crossed a score threshold since last evaluation.
 * Used for batch processing of score_threshold triggers.
 *
 * @param currentScore - Current sighting score
 * @param previousScore - Previous sighting score
 * @param threshold - The threshold to check
 * @returns True if the threshold was just crossed
 */
export const crossedScoreThreshold = (
  currentScore: number,
  previousScore: number,
  threshold: number
): boolean => {
  // Check if we crossed from below to above (or equal to) the threshold
  return previousScore < threshold && currentScore >= threshold;
};

/**
 * Get a human-readable summary of why a signal matched or didn't match.
 *
 * @param evaluation - The evaluation result
 * @returns Human-readable explanation
 */
export const explainEvaluation = (evaluation: SignalEvaluation): string => {
  if (evaluation.matched) {
    return `Signal "${evaluation.signal.name}" matched: ${evaluation.reason}`;
  } else {
    return `Signal "${evaluation.signal.name}" did not match: ${evaluation.reason}`;
  }
};

/**
 * Build evaluation context from repository data.
 * Helper function to prepare context for evaluation.
 *
 * @param data - Repository data
 * @returns Evaluation context
 */
export const buildEvaluationContext = (data: {
  geofences: Geofence[];
  sightingTypes: SightingType[];
  userReputation: Array<{
    userId: string;
    score: number;
    isVerified?: boolean;
  }>;
}): EvaluationContext => {
  return {
    geofences: new Map(data.geofences.map((g) => [g.id, g])),
    sightingTypes: new Map(data.sightingTypes.map((t) => [t.id, t])),
    userReputation: new Map(
      data.userReputation.map((r) => [
        r.userId,
        { score: r.score, isVerified: r.isVerified },
      ])
    ),
  };
};

/**
 * Optimize signal matching by pre-filtering based on fast checks.
 * This can significantly improve performance when evaluating against many signals.
 *
 * @param sighting - The sighting to evaluate
 * @param signals - All signals
 * @param event - The event type
 * @returns Signals that pass fast pre-filters
 */
export const preFilterSignals = (
  sighting: Sighting,
  signals: Signal[],
  event: SignalEvent
): Signal[] => {
  return signals.filter((signal) => {
    // Fast checks first
    if (!signal.isActive) return false;
    if (!shouldTrigger(signal, event.type)) return false;

    // Check if global or has specific geographic constraints
    if (signal.target.kind === "global") return true;

    // For category/type filters, do a quick check
    const conditions = signal.conditions;
    if (conditions.categoryIds && conditions.categoryIds.length > 0) {
      if (!conditions.categoryIds.includes(sighting.categoryId)) {
        // If using AND operator and category doesn't match, skip
        if (!conditions.operator || conditions.operator === "AND") {
          return false;
        }
      }
    }

    if (conditions.typeIds && conditions.typeIds.length > 0) {
      if (!conditions.typeIds.includes(sighting.typeId)) {
        // If using AND operator and type doesn't match, skip
        if (!conditions.operator || conditions.operator === "AND") {
          return false;
        }
      }
    }

    return true;
  });
};

/**
 * Calculate match score for ranking signals by relevance.
 * Higher scores indicate better matches.
 *
 * @param signal - The signal
 * @param sighting - The sighting
 * @returns Match score (0-100)
 */
export const calculateMatchScore = (
  signal: Signal,
  sighting: Sighting
): number => {
  let score = 0;
  const conditions = signal.conditions;

  // Base score for any match
  score += 10;

  // Category match
  if (conditions.categoryIds?.includes(sighting.categoryId)) {
    score += 20;
  }

  // Type match (more specific)
  if (conditions.typeIds?.includes(sighting.typeId)) {
    score += 30;
  }

  // Importance match
  if (conditions.importance?.includes(sighting.importance)) {
    score += 15;
  }

  // Score within range
  if (
    conditions.minScore !== undefined &&
    sighting.score >= conditions.minScore
  ) {
    score += 10;
  }
  if (
    conditions.maxScore !== undefined &&
    sighting.score <= conditions.maxScore
  ) {
    score += 10;
  }

  // Geographic specificity bonus
  if (signal.target.kind === "polygon") {
    score += 5; // Custom polygon is more specific
  }

  return Math.min(score, 100);
};
