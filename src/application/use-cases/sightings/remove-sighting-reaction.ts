import type { Result } from "@/shared/result";
import { ok } from "@/shared/result";
import type { SightingRepository } from "@/ports/sighting-repository";
import type { SightingReactionRepository } from "@/ports/sighting-reaction-repository";
import type { SightingId } from "@/domain/sightings/sighting";
import type { UserId } from "@/domain/reputation/reputation";
import type { SightingReactionType } from "@/domain/sightings/sighting-reaction";
import {
  calculateBaseScore,
  calculateHotScore,
  getAgeInHours,
} from "@/domain/sightings/sighting-reaction";

export type RemoveSightingReaction = (
  sightingId: string,
  userId: string,
  type: SightingReactionType
) => Promise<Result<void, never>>;

type Dependencies = {
  sightingRepository: SightingRepository;
  reactionRepository: SightingReactionRepository;
};

export const buildRemoveSightingReaction = ({
  sightingRepository,
  reactionRepository,
}: Dependencies): RemoveSightingReaction => {
  return async (sightingId, userId, type) => {
    // Remove reaction
    await reactionRepository.remove(
      sightingId as SightingId,
      userId as UserId,
      type
    );

    // Get sighting
    const sighting = await sightingRepository.getById(sightingId as SightingId);
    if (!sighting) {
      // Sighting doesn't exist, but we already removed the reaction
      return ok(undefined);
    }

    // Recalculate scores
    const counts = await reactionRepository.getCounts(sightingId as SightingId);
    const baseScore = calculateBaseScore(counts);
    const ageInHours = getAgeInHours(sighting.createdAt);
    const hotScore = calculateHotScore(baseScore, ageInHours);

    // Update sighting with new scores
    const updatedSighting = {
      ...sighting,
      upvotes: counts.upvotes,
      downvotes: counts.downvotes,
      confirmations: counts.confirmations,
      disputes: counts.disputes,
      spamReports: counts.spamReports,
      score: baseScore,
      hotScore,
    };

    await sightingRepository.update(updatedSighting);

    return ok(undefined);
  };
};
