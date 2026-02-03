import type { Signal, SignalId } from "@/domain/signals/signal";
import type { UserId } from "@/domain/users/user";
import type { GeofenceId } from "@/domain/geofences/geofence";
import type {
  RankedSignal,
  RankingContext,
  CategoryPreference,
  UserLocation,
} from "@/domain/signals/signal-ranking";
import {
  calculateRankScore,
  sortByRankScore,
  getSignalRepresentativePoint,
  calculateDistance,
  calculateViralActivity,
  detectViralBoost,
  calculateCategoryBoost,
} from "@/domain/signals/signal-ranking";
import type { SignalRepository } from "@/ports/signal-repository";
import type { UserRepository } from "@/ports/user-repository";
import type { UserPrivacySettingsRepository } from "@/ports/user-privacy-settings-repository";
import type { UserCategoryInteractionRepository } from "@/ports/user-category-interaction-repository";
import type { UserSignalPreferenceRepository } from "@/ports/user-signal-preference-repository";
import type { SignalActivitySnapshotRepository } from "@/ports/signal-activity-snapshot-repository";
import type { GeofenceRepository } from "@/ports/geofence-repository";
import { err, ok, type DomainError, type Result } from "@/shared/result";

export type RankSignalsForUserInput = {
  userId: string;
  userLocation?: { lat: number; lng: number };
  includeHidden?: boolean;
  filters?: {
    ownerId?: string;
    isActive?: boolean;
    geofenceId?: string;
  };
};

export type RankSignalsForUser = (
  input: RankSignalsForUserInput
) => Promise<Result<RankedSignal[], DomainError>>;

type Dependencies = {
  signalRepository: SignalRepository;
  userRepository: UserRepository;
  userPrivacySettingsRepository: UserPrivacySettingsRepository;
  userCategoryInteractionRepository: UserCategoryInteractionRepository;
  userSignalPreferenceRepository: UserSignalPreferenceRepository;
  signalActivitySnapshotRepository: SignalActivitySnapshotRepository;
  geofenceRepository: GeofenceRepository;
};

/**
 * Rank Signals For User Use Case
 *
 * Returns a ranked list of signals for a specific user, taking into account:
 * - User location (if location sharing enabled)
 * - User category preferences (if personalization enabled)
 * - User signal preferences (hidden, pinned, unimportant)
 * - Signal classification (official > community > verified > personal)
 * - Signal popularity (views, subscribers, sightings)
 * - Viral boost (24h activity vs 7-day average)
 * - Distance from user (for location-aware ranking)
 *
 * Privacy-first: Only uses personalization data if user has opted in.
 */
export const buildRankSignalsForUser = ({
  signalRepository,
  userRepository,
  userPrivacySettingsRepository,
  userCategoryInteractionRepository,
  userSignalPreferenceRepository,
  signalActivitySnapshotRepository,
  geofenceRepository,
}: Dependencies): RankSignalsForUser => {
  return async (input) => {
    const { userId, userLocation, includeHidden = false, filters } = input;

    // 1. Validate user exists
    const user = await userRepository.getById(userId as UserId);
    if (!user) {
      return err({
        code: "user.not_found",
        message: "User not found.",
      });
    }

    // 2. Get user privacy settings
    const privacySettings =
      await userPrivacySettingsRepository.getByUserId(userId as UserId);

    const enablePersonalization =
      privacySettings?.enablePersonalization ?? false;
    const enableLocationRanking =
      privacySettings?.enableLocationSharing ?? false;

    // 3. Get user preferences
    const hiddenSignalIds =
      await userSignalPreferenceRepository.getHiddenSignalIds(
        userId as UserId
      );
    const pinnedSignalIds =
      await userSignalPreferenceRepository.getPinnedSignalIds(
        userId as UserId
      );
    const unimportantSignalIds =
      await userSignalPreferenceRepository.getUnimportantSignalIds(
        userId as UserId
      );

    // 4. Get category preferences if personalization enabled
    let categoryPreferences: CategoryPreference[] = [];
    if (enablePersonalization) {
      const interactions =
        await userCategoryInteractionRepository.getTopCategoriesForUser(
          userId as UserId,
          3
        );
      categoryPreferences = interactions.map((i) => ({
        categoryId: i.categoryId,
        interactionScore: i.clickCount + i.subscriptionCount * 2,
      }));
    }

    // 5. Fetch all signals (with filters)
    const allSignals = await signalRepository.list(filters);

    // 6. Filter out hidden signals (unless explicitly requested)
    const visibleSignals = includeHidden
      ? allSignals
      : allSignals.filter((s) => !hiddenSignalIds.includes(s.id));

    // 7. Build ranking context
    const rankingContext: RankingContext = {
      userLocation: enableLocationRanking ? userLocation : undefined,
      userTier: user.membershipTier,
      categoryPreferences,
      hiddenSignalIds,
      pinnedSignalIds,
      unimportantSignalIds,
      enablePersonalization,
      enableLocationRanking,
    };

    // 8. Calculate rank score for each signal
    const rankedSignals: RankedSignal[] = await Promise.all(
      visibleSignals.map(async (signal) => {
        // Calculate distance if location ranking enabled
        let distanceKm: number | undefined;
        if (enableLocationRanking && userLocation) {
          const signalPoint = await getSignalRepresentativePointWithGeofence(
            signal,
            geofenceRepository
          );
          if (signalPoint) {
            distanceKm = calculateDistance(userLocation, signalPoint);
          }
        }

        // Detect viral boost
        const isViralBoosted = await detectViralBoostForSignal(
          signal.id,
          signalActivitySnapshotRepository
        );

        // Calculate category boost
        const categoryBoost = calculateCategoryBoost(
          signal,
          categoryPreferences,
          enablePersonalization
        );

        // Calculate rank score
        const rankScore = calculateRankScore(
          signal,
          rankingContext,
          isViralBoosted,
          distanceKm
        );

        return {
          ...signal,
          rankScore,
          distanceKm,
          isViralBoosted,
          categoryBoost,
        };
      })
    );

    // 9. Sort by rank score (pinned signals at top)
    const sorted = sortByRankScore(rankedSignals, pinnedSignalIds);

    return ok(sorted);
  };
};

/**
 * Helper: Get representative point for a signal, fetching geofence if needed
 */
async function getSignalRepresentativePointWithGeofence(
  signal: Signal,
  geofenceRepository: GeofenceRepository
): Promise<{ lat: number; lng: number } | null> {
  const point = getSignalRepresentativePoint(signal);
  if (point) return point;

  // If signal uses geofence, fetch it
  if (signal.target.kind === "geofence") {
    const geofence = await geofenceRepository.getById(
      signal.target.geofenceId as GeofenceId
    );
    if (geofence?.polygon?.points && geofence.polygon.points.length > 0) {
      const points = geofence.polygon.points;
      const lat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
      const lng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
      return { lat, lng };
    }
  }

  return null;
}

/**
 * Helper: Detect viral boost for a signal using activity snapshots
 */
async function detectViralBoostForSignal(
  signalId: SignalId,
  snapshotRepository: SignalActivitySnapshotRepository
): Promise<boolean> {
  // Fetch last 8 days of snapshots (1 day for 24h + 7 days for average)
  const snapshots = await snapshotRepository.getRecentForSignal(signalId, 8);

  if (snapshots.length === 0) {
    return false; // No data, not viral
  }

  // Calculate viral activity
  const viralData = calculateViralActivity(
    snapshots.map((s) => ({
      date: s.snapshotDate,
      activity: s.newSubscribers + s.newSightings + s.viewCount,
    }))
  );

  return detectViralBoost(viralData);
}
