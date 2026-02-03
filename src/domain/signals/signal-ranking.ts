import type { Signal, SignalClassification } from "./signal";
import type { MembershipTier } from "@/domain/users/membership-tier";
import type { CategoryId } from "@/domain/sightings/sighting";
import type { SignalId } from "./signal";
import type { UserId } from "@/domain/users/user";

export type UserLocation = {
  lat: number;
  lng: number;
};

export type CategoryPreference = {
  categoryId: CategoryId;
  interactionScore: number; // Weighted: clicks + subscriptions * 2
};

export type RankedSignal = Signal & {
  rankScore: number;
  distanceKm?: number;
  isViralBoosted: boolean;
  categoryBoost: number;
};

export type RankingContext = {
  userLocation?: UserLocation;
  userTier: MembershipTier;
  categoryPreferences: CategoryPreference[]; // Empty array if personalization disabled
  hiddenSignalIds: SignalId[];
  pinnedSignalIds: SignalId[];
  unimportantSignalIds: SignalId[];
  enablePersonalization: boolean; // Privacy setting
  enableLocationRanking: boolean; // Privacy setting
};

// Classification priority order
const CLASSIFICATION_PRIORITY: Record<SignalClassification, number> = {
  official: 1000, // Always top
  community: 500, // High priority (unless marked unimportant)
  verified: 100, // Quality boost
  personal: 0, // Base priority
};

// Viral boost detection
export type ViralDetectionData = {
  last24hActivity: number;
  previous7DayAverage: number;
};

export const detectViralBoost = (data: ViralDetectionData): boolean => {
  if (data.previous7DayAverage === 0) {
    return data.last24hActivity > 10; // Minimum threshold for new signals
  }
  return data.last24hActivity > data.previous7DayAverage * 3;
};

// Distance calculation (Haversine formula)
export const calculateDistance = (
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number => {
  const R = 6371; // Earth radius in km
  const dLat = toRad(point2.lat - point1.lat);
  const dLng = toRad(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) *
      Math.cos(toRad(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (degrees: number): number => (degrees * Math.PI) / 180;

// Get representative point for a signal (for distance calculation)
export const getSignalRepresentativePoint = (
  signal: Signal
): { lat: number; lng: number } | null => {
  if (signal.target.kind === "global") {
    return null; // No geographic location
  }

  if (signal.target.kind === "polygon" && signal.target.polygon.points.length > 0) {
    // Use centroid of polygon
    const points = signal.target.polygon.points;
    const lat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
    const lng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
    return { lat, lng };
  }

  // For geofence, we'd need to fetch the geofence data
  // This is handled in the use case layer
  return null;
};

// Category preference boost (respects privacy - returns 1.0 if personalization disabled)
export const calculateCategoryBoost = (
  signal: Signal,
  preferences: CategoryPreference[],
  personalizationEnabled: boolean
): number => {
  if (!personalizationEnabled || preferences.length === 0) {
    return 1.0; // No boost if privacy mode or no preferences
  }

  // Check if signal's categories match user preferences
  const signalCategories = signal.conditions.categoryIds || [];
  if (signalCategories.length === 0) {
    return 1.0; // Signal has no category filters
  }

  // Find top 3 preferred categories
  const topPreferences = preferences
    .sort((a, b) => b.interactionScore - a.interactionScore)
    .slice(0, 3);

  const matchingPref = topPreferences.find((pref) =>
    signalCategories.includes(pref.categoryId)
  );

  if (!matchingPref) return 1.0;

  // Top preference gets 3x distance multiplier
  const rank = topPreferences.indexOf(matchingPref);
  if (rank === 0) return 3.0;
  if (rank === 1) return 2.0;
  if (rank === 2) return 1.5;

  return 1.0;
};

// Popularity score calculation
export const calculatePopularityScore = (signal: Signal): number => {
  const { viewCount, sightingCount } = signal.analytics;
  const subscriberCount = signal.analytics.subscriberCount || 0;

  // Weighted popularity: subscribers are most valuable, then sightings, then views
  return viewCount * 1 + subscriberCount * 10 + sightingCount * 5;
};

// Core ranking formula: Score = (popularity_score * 100) / (distance_km + 1)
export const calculateRankScore = (
  signal: Signal,
  context: RankingContext,
  viralBoost: boolean,
  distanceKm?: number
): number => {
  // Classification priority (global official signals get fixed high score)
  const classificationScore = CLASSIFICATION_PRIORITY[signal.classification];

  // For global official signals, return fixed high score
  if (signal.classification === "official" && signal.target.kind === "global") {
    return classificationScore + 10000; // Ensure top ranking
  }

  // For community signals marked as unimportant, drop to bottom
  if (
    signal.classification === "community" &&
    context.unimportantSignalIds.includes(signal.id)
  ) {
    return -1000;
  }

  // Calculate base popularity score
  const popularityScore = calculatePopularityScore(signal);

  // Apply viral boost (2x multiplier)
  const viralMultiplier = viralBoost ? 2.0 : 1.0;

  // Apply category preference boost (affects effective distance)
  // Only applies if personalization enabled
  const categoryBoost = calculateCategoryBoost(
    signal,
    context.categoryPreferences,
    context.enablePersonalization
  );

  // Calculate effective distance
  let effectiveDistance = 0;

  if (context.enableLocationRanking && distanceKm !== undefined) {
    effectiveDistance = distanceKm / categoryBoost;
  } else {
    // No location ranking - treat all as local (distance = 0)
    effectiveDistance = 0;
  }

  // Core formula: (popularity * 100) / (distance + 1)
  const baseScore = (popularityScore * 100) / (effectiveDistance + 1);

  // Apply viral multiplier
  const finalScore = baseScore * viralMultiplier;

  // Add classification bonus
  return finalScore + classificationScore;
};

// Sort signals by rank score
export const sortByRankScore = (
  signals: RankedSignal[],
  pinnedSignalIds: SignalId[]
): RankedSignal[] => {
  return [...signals].sort((a, b) => {
    // Pinned signals always on top
    const aPinned = pinnedSignalIds.includes(a.id);
    const bPinned = pinnedSignalIds.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;

    // Then by rank score
    return b.rankScore - a.rankScore;
  });
};

// Calculate viral activity from snapshots
export const calculateViralActivity = (
  snapshots: Array<{ date: string; activity: number }>
): ViralDetectionData => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

  // Last 24h activity
  const last24h = snapshots
    .filter((s) => new Date(s.date) > yesterday)
    .reduce((sum, s) => sum + s.activity, 0);

  // Previous 7-day average (excluding last 24h)
  const previous7Days = snapshots
    .filter((s) => {
      const date = new Date(s.date);
      return date > weekAgo && date <= yesterday;
    })
    .reduce((sum, s) => sum + s.activity, 0);

  const previous7DayAverage = previous7Days / 7;

  return {
    last24hActivity: last24h,
    previous7DayAverage,
  };
};
