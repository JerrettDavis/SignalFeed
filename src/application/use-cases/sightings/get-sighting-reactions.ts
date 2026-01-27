import type { Result } from "@/shared/result";
import { ok } from "@/shared/result";
import type { SightingReactionRepository } from "@/ports/sighting-reaction-repository";
import type { SightingId } from "@/domain/sightings/sighting";
import type { SightingReactionCounts } from "@/domain/sightings/sighting-reaction";

export type GetSightingReactions = (
  sightingId: string
) => Promise<Result<SightingReactionCounts, never>>;

type Dependencies = {
  repository: SightingReactionRepository;
};

export const buildGetSightingReactions = ({
  repository,
}: Dependencies): GetSightingReactions => {
  return async (sightingId) => {
    const counts = await repository.getCounts(sightingId as SightingId);
    return ok(counts);
  };
};
