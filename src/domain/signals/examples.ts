/**
 * Signal Domain Usage Examples
 *
 * This file demonstrates practical usage patterns for the Signals domain.
 * These examples show how to create, update, and evaluate signals for
 * different use cases.
 */

import {
  createSignal,
  updateSignal,
  matchesConditions,
  shouldTrigger,
  describeConditions,
  type NewSignal,
  type Signal,
  type SignalId,
  type SightingMatchData,
} from "./signal";

// ============================================================================
// Example 1: Wildlife Emergency Alert
// ============================================================================
// Monitor critical wildlife sightings in a specific area
// Alert only for high-trust reporters

export const createWildlifeEmergencyAlert = (): Signal | null => {
  const input: NewSignal = {
    name: "Wildlife Emergency Alert",
    description:
      "Get notified immediately of critical wildlife sightings from trusted sources",
    ownerId: "user-wildlife-enthusiast",
    target: {
      kind: "geofence",
      geofenceId: "yellowstone-park",
    },
    triggers: ["new_sighting", "sighting_confirmed"],
    conditions: {
      categoryIds: ["wildlife"],
      importance: ["critical"],
      minTrustLevel: "trusted",
      operator: "AND",
    },
    isActive: true,
  };

  const result = createSignal(input, {
    id: "signal-wildlife-emergency" as SignalId,
    createdAt: new Date().toISOString(),
  });

  return result.ok ? result.value : null;
};

// ============================================================================
// Example 2: Infrastructure Monitoring
// ============================================================================
// Track all infrastructure issues in a city, regardless of reporter

export const createInfrastructureMonitor = (): Signal | null => {
  const input: NewSignal = {
    name: "City Infrastructure Monitor",
    description: "Track all infrastructure problems reported in the city",
    ownerId: "user-city-manager",
    target: {
      kind: "polygon",
      polygon: {
        points: [
          { lat: 40.7128, lng: -74.006 }, // NYC approximate boundaries
          { lat: 40.7489, lng: -73.968 },
          { lat: 40.7614, lng: -73.9776 },
          { lat: 40.7282, lng: -74.0776 },
        ],
      },
    },
    triggers: ["new_sighting", "sighting_confirmed", "sighting_disputed"],
    conditions: {
      categoryIds: ["infrastructure"],
      operator: "AND",
    },
    isActive: true,
  };

  const result = createSignal(input, {
    id: "signal-infrastructure" as SignalId,
    createdAt: new Date().toISOString(),
  });

  return result.ok ? result.value : null;
};

// ============================================================================
// Example 3: Trending Sightings Monitor
// ============================================================================
// Monitor sightings that are gaining traction (high scores)

export const createTrendingMonitor = (): Signal | null => {
  const input: NewSignal = {
    name: "Trending Sightings",
    description: "Get notified when sightings become highly scored",
    ownerId: "user-trend-watcher",
    target: { kind: "global" },
    triggers: ["score_threshold"],
    conditions: {
      minScore: 100,
      operator: "AND",
    },
    isActive: true,
  };

  const result = createSignal(input, {
    id: "signal-trending" as SignalId,
    createdAt: new Date().toISOString(),
  });

  return result.ok ? result.value : null;
};

// ============================================================================
// Example 4: Multi-Category Alert with OR Logic
// ============================================================================
// Monitor either wildlife OR weather events, any importance level

export const createFlexibleAlert = (): Signal | null => {
  const input: NewSignal = {
    name: "Nature Watch",
    description: "Wildlife or weather events in my region",
    ownerId: "user-nature-lover",
    target: {
      kind: "geofence",
      geofenceId: "my-home-area",
    },
    triggers: ["new_sighting"],
    conditions: {
      categoryIds: ["wildlife", "weather"],
      operator: "OR", // Match if EITHER category matches
    },
    isActive: true,
  };

  const result = createSignal(input, {
    id: "signal-nature-watch" as SignalId,
    createdAt: new Date().toISOString(),
  });

  return result.ok ? result.value : null;
};

// ============================================================================
// Example 5: Tag-Based Alert
// ============================================================================
// Monitor specific tags like "urgent" or "public-safety"

export const createUrgentTagMonitor = (): Signal | null => {
  const input: NewSignal = {
    name: "Urgent Alerts",
    description: "Any urgent or public safety related sightings",
    ownerId: "user-safety-officer",
    target: { kind: "global" },
    triggers: ["new_sighting", "sighting_confirmed"],
    conditions: {
      tags: ["urgent", "public-safety", "emergency"],
      minTrustLevel: "new", // At least some reputation
      operator: "AND",
    },
    isActive: true,
  };

  const result = createSignal(input, {
    id: "signal-urgent-tags" as SignalId,
    createdAt: new Date().toISOString(),
  });

  return result.ok ? result.value : null;
};

// ============================================================================
// Example 6: Updating a Signal
// ============================================================================
// Pause a signal temporarily or adjust its conditions

export const pauseSignal = (signal: Signal): Signal | null => {
  const result = updateSignal(
    signal,
    { isActive: false },
    { updatedAt: new Date().toISOString() }
  );

  return result.ok ? result.value : null;
};

export const adjustSignalTriggers = (signal: Signal): Signal | null => {
  const result = updateSignal(
    signal,
    {
      triggers: ["new_sighting"], // Only monitor new sightings
      conditions: {
        ...signal.conditions,
        minScore: 50, // Add minimum score requirement
      },
    },
    { updatedAt: new Date().toISOString() }
  );

  return result.ok ? result.value : null;
};

// ============================================================================
// Example 7: Evaluating Sightings Against a Signal
// ============================================================================
// Check if a sighting should trigger a signal

export const evaluateSighting = (
  signal: Signal,
  triggerType:
    | "new_sighting"
    | "sighting_confirmed"
    | "sighting_disputed"
    | "score_threshold",
  sightingData: SightingMatchData
): boolean => {
  // First check if this trigger type should fire
  if (!shouldTrigger(signal, triggerType)) {
    return false;
  }

  // Then check if the sighting matches the conditions
  return matchesConditions(signal.conditions, sightingData);
};

// Example usage of evaluateSighting
export const exampleEvaluation = () => {
  const signal = createWildlifeEmergencyAlert();
  if (!signal) return;

  const sighting: SightingMatchData = {
    categoryId: "wildlife",
    typeId: "grizzly-bear",
    tags: ["mammal", "dangerous"],
    importance: "critical",
    score: 85,
    reporterTrustLevel: "trusted",
  };

  const shouldNotify = evaluateSighting(signal, "new_sighting", sighting);

  if (shouldNotify) {
    console.log("🚨 Signal triggered! Sending notification...");
    console.log(`Signal: ${signal.name}`);
    console.log(`Description: ${describeConditions(signal.conditions)}`);
  }
};

// ============================================================================
// Example 8: Batch Evaluation
// ============================================================================
// Check a sighting against multiple signals

export const findMatchingSignals = (
  signals: Signal[],
  triggerType:
    | "new_sighting"
    | "sighting_confirmed"
    | "sighting_disputed"
    | "score_threshold",
  sightingData: SightingMatchData
): Signal[] => {
  return signals.filter((signal) =>
    evaluateSighting(signal, triggerType, sightingData)
  );
};

// Example usage
export const exampleBatchEvaluation = () => {
  const signals = [
    createWildlifeEmergencyAlert(),
    createInfrastructureMonitor(),
    createTrendingMonitor(),
    createFlexibleAlert(),
    createUrgentTagMonitor(),
  ].filter((s): s is Signal => s !== null);

  const sighting: SightingMatchData = {
    categoryId: "wildlife",
    typeId: "wolf",
    tags: ["mammal", "urgent"],
    importance: "high",
    score: 95,
    reporterTrustLevel: "trusted",
  };

  const matchingSignals = findMatchingSignals(
    signals,
    "new_sighting",
    sighting
  );

  console.log(`Found ${matchingSignals.length} matching signals:`);
  matchingSignals.forEach((signal) => {
    console.log(`- ${signal.name}`);
  });
};

// ============================================================================
// Example 9: Creating a User-Friendly Signal Description
// ============================================================================
// Generate a human-readable summary of what a signal monitors

export const getSignalSummary = (signal: Signal): string => {
  const parts: string[] = [];

  // Add trigger information
  const triggerLabels: Record<string, string> = {
    new_sighting: "new sightings",
    sighting_confirmed: "confirmed sightings",
    sighting_disputed: "disputed sightings",
    score_threshold: "high-scoring sightings",
  };

  const triggerText = signal.triggers
    .map((t) => triggerLabels[t] || t)
    .join(", ");
  parts.push(`Monitoring: ${triggerText}`);

  // Add geographic scope
  if (signal.target.kind === "geofence") {
    parts.push(`Area: Geofence ${signal.target.geofenceId}`);
  } else if (signal.target.kind === "polygon") {
    parts.push(
      `Area: Custom polygon (${signal.target.polygon.points.length} points)`
    );
  } else {
    parts.push(`Area: Global`);
  }

  // Add condition description
  const conditionText = describeConditions(signal.conditions);
  if (conditionText !== "All sightings") {
    parts.push(`Filters: ${conditionText}`);
  }

  // Add status
  parts.push(`Status: ${signal.isActive ? "Active" : "Paused"}`);

  return parts.join("\n");
};

// ============================================================================
// Example 10: Validation Error Handling
// ============================================================================
// Properly handle validation errors when creating signals

export const createSignalWithErrorHandling = (
  input: NewSignal
): { signal?: Signal; errors: string[] } => {
  const result = createSignal(input, {
    id: `signal-${Date.now()}` as SignalId,
    createdAt: new Date().toISOString(),
  });

  if (result.ok) {
    return { signal: result.value, errors: [] };
  }

  // Handle validation errors
  const error = result.error;
  const errors: string[] = [];

  // Provide user-friendly error messages
  switch (error.code) {
    case "signal.name_required":
      errors.push("Please provide a name for your signal");
      break;
    case "signal.name_too_long":
      errors.push("Signal name is too long (max 100 characters)");
      break;
    case "signal.triggers_required":
      errors.push("Please select at least one trigger type");
      break;
    case "signal.duplicate_triggers":
      errors.push("You have selected the same trigger multiple times");
      break;
    case "signal.invalid_score_range":
      errors.push("Minimum score cannot be greater than maximum score");
      break;
    case "geo.invalid_polygon":
      errors.push("Polygon must have at least 3 points");
      break;
    default:
      errors.push(error.message);
  }

  return { errors };
};

// Example usage with error handling
export const exampleWithErrorHandling = () => {
  const invalidInput: NewSignal = {
    name: "", // Invalid: empty name
    ownerId: "user-123",
    target: { kind: "global" },
    triggers: [], // Invalid: no triggers
  };

  const { signal, errors } = createSignalWithErrorHandling(invalidInput);

  if (signal) {
    console.log("✅ Signal created successfully:", signal.name);
  } else {
    console.log("❌ Validation errors:");
    errors.forEach((error) => console.log(`  - ${error}`));
  }
};
