import type { SightingFlairRepository } from "@/ports/sighting-flair-repository";
import type { SightingRepository } from "@/ports/sighting-repository";
import { shouldAutoApplySuggestion, createSightingFlair } from "@/domain/flairs/sighting-flair";
import { err, ok, type Result } from "@/shared/result";

export interface VoteOnFlairSuggestionInput {
  suggestionId: string;
  userId: string;
}

export async function voteOnFlairSuggestion(
  input: VoteOnFlairSuggestionInput,
  deps: {
    sightingFlairRepository: SightingFlairRepository;
    sightingRepository: SightingRepository;
  }
): Promise<Result<{ applied: boolean; voteCount: number }, { code: string; message: string }>> {
  const { sightingFlairRepository, sightingRepository } = deps;

  // Get the suggestion
  const suggestion = await sightingFlairRepository.getSuggestion(input.suggestionId as any);
  if (!suggestion) {
    return err({ code: "suggestion_not_found", message: "Flair suggestion not found" });
  }

  if (suggestion.status !== "pending") {
    return err({
      code: "suggestion_not_pending",
      message: "This suggestion has already been processed",
    });
  }

  // Check if user is the suggester (can't vote on own suggestion)
  if (suggestion.suggestedBy === input.userId) {
    return err({
      code: "cannot_vote_own_suggestion",
      message: "You cannot vote on your own suggestion",
    });
  }

  // Get the sighting
  const sighting = await sightingRepository.getById(suggestion.sightingId);
  if (!sighting) {
    return err({ code: "sighting_not_found", message: "Sighting not found" });
  }

  // Increment vote count
  const newVoteCount = suggestion.voteCount + 1;
  await sightingFlairRepository.updateSuggestionVotes(suggestion.id, newVoteCount);

  // Calculate total engagement
  const totalEngagement =
    sighting.upvotes +
    sighting.downvotes +
    sighting.confirmations +
    sighting.disputes;

  // Check if suggestion should be auto-applied
  const shouldApply = shouldAutoApplySuggestion(newVoteCount, totalEngagement);

  if (shouldApply) {
    // Check if flair is already assigned
    const hasExistingFlair = await sightingFlairRepository.hasFlai(
      suggestion.sightingId,
      suggestion.flairId
    );

    if (!hasExistingFlair) {
      // Auto-apply the flair
      const sightingFlair = createSightingFlair({
        sightingId: suggestion.sightingId as string,
        flairId: suggestion.flairId as string,
        assignmentMethod: "consensus",
        metadata: { suggestionId: suggestion.id, votes: newVoteCount },
      });

      await sightingFlairRepository.assign(sightingFlair);
      await sightingFlairRepository.updateSuggestionStatus(suggestion.id, "applied");

      return ok({ applied: true, voteCount: newVoteCount });
    }
  }

  return ok({ applied: false, voteCount: newVoteCount });
}
