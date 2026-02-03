import type { CategoryId } from "../taxonomy/taxonomy";

export interface ImportanceMultipliers {
  critical: number;
  high: number;
  normal: number;
  low: number;
}

export interface CategoryDecayConfig {
  readonly categoryId: CategoryId;
  readonly decayRate: number; // Power factor for time decay (higher = faster decay)
  readonly relevanceWindowHours: number; // How long the sighting stays highly relevant
  readonly importanceMultiplier: ImportanceMultipliers;
  readonly notes?: string;
  readonly updatedAt: Date;
}

export interface CreateCategoryDecayConfigInput {
  readonly categoryId: string;
  readonly decayRate: number;
  readonly relevanceWindowHours: number;
  readonly importanceMultiplier?: ImportanceMultipliers;
  readonly notes?: string;
}

export function validateCategoryDecayConfig(input: CreateCategoryDecayConfigInput): void {
  if (!input.categoryId || input.categoryId.trim() === "") {
    throw new Error("Category ID is required");
  }

  if (input.decayRate <= 0 || input.decayRate > 5) {
    throw new Error("Decay rate must be between 0 and 5");
  }

  if (input.relevanceWindowHours <= 0 || input.relevanceWindowHours > 8760) {
    throw new Error("Relevance window must be between 0 and 8760 hours (1 year)");
  }

  if (input.importanceMultiplier) {
    const multipliers = Object.values(input.importanceMultiplier);
    if (multipliers.some((m) => m < 0 || m > 10)) {
      throw new Error("Importance multipliers must be between 0 and 10");
    }
  }
}

export function createCategoryDecayConfig(input: CreateCategoryDecayConfigInput): CategoryDecayConfig {
  validateCategoryDecayConfig(input);

  return {
    categoryId: input.categoryId as CategoryId,
    decayRate: input.decayRate,
    relevanceWindowHours: input.relevanceWindowHours,
    importanceMultiplier: input.importanceMultiplier ?? {
      critical: 2.0,
      high: 1.5,
      normal: 1.0,
      low: 0.5,
    },
    notes: input.notes,
    updatedAt: new Date(),
  };
}

// Calculate time-adjusted score for a sighting
export function calculateTimeAdjustedScore(
  baseScore: number,
  ageInHours: number,
  decayRate: number,
  importanceMultiplier: number,
  flairModifier: number = 0
): number {
  // Formula: (baseScore + flairModifier) * importanceMultiplier / (ageInHours + 2)^decayRate
  const adjustedScore = (baseScore + flairModifier) * importanceMultiplier;
  const decayFactor = Math.pow(ageInHours + 2, decayRate);
  return adjustedScore / decayFactor;
}

// Calculate relevance score (0-1) based on age and relevance window
export function calculateRelevanceScore(ageInHours: number, relevanceWindowHours: number): number {
  if (ageInHours <= 0) {
    return 1.0;
  }

  if (ageInHours >= relevanceWindowHours) {
    return 0.0;
  }

  // Linear decay within relevance window
  return 1.0 - ageInHours / relevanceWindowHours;
}

// Determine if a sighting is still within its relevance window
export function isWithinRelevanceWindow(ageInHours: number, relevanceWindowHours: number): boolean {
  return ageInHours < relevanceWindowHours;
}

// Get suggested decay rate based on category characteristics
export function getSuggestedDecayRate(categoryCharacteristics: {
  isTimeSensitive: boolean;
  typicalDurationHours: number;
}): number {
  const { isTimeSensitive, typicalDurationHours } = categoryCharacteristics;

  if (isTimeSensitive && typicalDurationHours < 12) {
    return 2.5; // Fast decay (e.g., traffic, weather)
  } else if (isTimeSensitive && typicalDurationHours < 48) {
    return 2.0; // Medium-fast decay (e.g., events)
  } else if (typicalDurationHours < 168) {
    return 1.5; // Medium decay (e.g., weekly markets)
  } else if (typicalDurationHours < 720) {
    return 1.0; // Slow decay (e.g., lost pets, wildlife)
  } else {
    return 0.8; // Very slow decay (e.g., infrastructure, street art)
  }
}

// Preset decay configurations for common category types
export const DECAY_PRESETS = {
  REAL_TIME: { decayRate: 2.5, relevanceWindowHours: 6 }, // Traffic, weather alerts
  HOURLY: { decayRate: 2.2, relevanceWindowHours: 12 }, // Food trucks, flash deals
  DAILY: { decayRate: 1.8, relevanceWindowHours: 24 }, // Active incidents, hazards
  MULTI_DAY: { decayRate: 1.5, relevanceWindowHours: 72 }, // Events, construction
  WEEKLY: { decayRate: 1.2, relevanceWindowHours: 168 }, // Lost items, wildlife
  MONTHLY: { decayRate: 0.9, relevanceWindowHours: 720 }, // Long-term projects
  PERSISTENT: { decayRate: 0.6, relevanceWindowHours: 2160 }, // Street art, landmarks
} as const;
