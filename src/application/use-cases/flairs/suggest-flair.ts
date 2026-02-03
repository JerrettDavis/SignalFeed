import type { SightingFlairRepository } from "@/ports/sighting-flair-repository";
import type { FlairRepository } from "@/ports/flair-repository";
import type { SightingRepository } from "@/ports/sighting-repository";
import { createFlairSuggestion, shouldAutoApplySuggestion, createSightingFlair } from "@/domain/flairs/sighting-flair";
import { err, ok, type Result } from "@/shared/result";

export interface SuggestFlairInput {
  sightingId: string;
  flairId: string;
  userId: string;
}

export async function suggestFlair(
  input: SuggestFlairInput,
  deps: {
    sightingFlairRepository: SightingFlairRepository;
    flairRepository: FlairRepository;
    sightingRepository: SightingRepository;
  }
): Promise<Result<{ suggestionId: string; autoApplied: boolean }, { code: string; message: string }>> {
  const { sightingFlairRepository, flairRepository, sightingRepository } = deps;

  // Check if sighting exists
  const sighting = await sightingRepository.getById(input.sightingId as any);
  if (!sighting) {
    return err({ code: "sighting_not_found", message: "Sighting not found" });
  }

  // Check if flair exists
  const flair = await flairRepository.getById(input.flairId as any);
  if (!flair) {
    return err({ code: "flair_not_found", message: "Flair not found" });
  }

  // Check if flair is already assigned
  const hasExistingFlair = await sightingFlairRepository.hasFlai(
    input.sightingId as any,
    input.flairId as any
  );

  if (hasExistingFlair) {
    return err({
      code: "flair_already_assigned",
      message: "This flair is already assigned to the sighting",
    });
  }

  // Check if user already suggested this flair
  const existingSuggestion = await sightingFlairRepository.getUserSuggestion(
    input.sightingId as any,
    input.flairId as any,
    input.userId
  );

  if (existingSuggestion) {
    return err({
      code: "suggestion_already_exists",
      message: "You have already suggested this flair",
    });
  }

  // Create the suggestion
  try {
    const suggestion = createFlairSuggestion({
      sightingId: input.sightingId,
      flairId: input.flairId,
      suggestedBy: input.userId,
    });

    await sightingFlairRepository.createSuggestion(suggestion);

    // Start with 1 vote (the suggester's implicit vote)
    await sightingFlairRepository.updateSuggestionVotes(suggestion.id, 1);

    // Calculate total engagement for this sighting
    const totalEngagement =
      sighting.upvotes +
      sighting.downvotes +
      sighting.confirmations +
      sighting.disputes;

    // Check if suggestion should be auto-applied
    const shouldApply = shouldAutoApplySuggestion(1, totalEngagement);

    if (shouldApply) {
      // Auto-apply the flair
      const sightingFlair = createSightingFlair({
        sightingId: input.sightingId,
        flairId: input.flairId,
        assignmentMethod: "consensus",
        metadata: { suggestionId: suggestion.id, votes: 1 },
      });

      await sightingFlairRepository.assign(sightingFlair);
      await sightingFlairRepository.updateSuggestionStatus(suggestion.id, "applied");

      return ok({ suggestionId: suggestion.id, autoApplied: true });
    }

    return ok({ suggestionId: suggestion.id, autoApplied: false });
  } catch (error) {
    return err({
      code: "suggestion_failed",
      message: error instanceof Error ? error.message : "Failed to suggest flair",
    });
  }
}
