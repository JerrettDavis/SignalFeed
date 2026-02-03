import type { SightingFlairRepository } from "@/ports/sighting-flair-repository";
import type { SightingRepository } from "@/ports/sighting-repository";
import { canUserAssignFlair } from "@/domain/flairs/sighting-flair";
import { err, ok, type Result } from "@/shared/result";

export interface RemoveFlairFromSightingInput {
  sightingId: string;
  flairId: string;
  userId: string;
  isModerator: boolean;
}

export async function removeFlairFromSighting(
  input: RemoveFlairFromSightingInput,
  deps: {
    sightingFlairRepository: SightingFlairRepository;
    sightingRepository: SightingRepository;
  }
): Promise<Result<void, { code: string; message: string }>> {
  const { sightingFlairRepository, sightingRepository } = deps;

  // Check if sighting exists
  const sighting = await sightingRepository.getById(input.sightingId as any);
  if (!sighting) {
    return err({ code: "sighting_not_found", message: "Sighting not found" });
  }

  // Check if flair is assigned
  const hasExistingFlair = await sightingFlairRepository.hasFlai(
    input.sightingId as any,
    input.flairId as any
  );

  if (!hasExistingFlair) {
    return err({
      code: "flair_not_assigned",
      message: "This flair is not assigned to the sighting",
    });
  }

  // Get the flair assignment to check who assigned it
  const flairs = await sightingFlairRepository.getFlairsForSighting(input.sightingId as any);
  const flairAssignment = flairs.find((f) => f.flairId === (input.flairId as any));

  if (!flairAssignment) {
    return err({
      code: "flair_not_assigned",
      message: "This flair is not assigned to the sighting",
    });
  }

  // Check permissions
  // Can remove if: moderator, original reporter, or original assigner
  const isModerator = input.isModerator;
  const isReporter = sighting.reporterId === input.userId;
  const isAssigner = flairAssignment.assignedBy === input.userId;
  const isAutoAssigned = flairAssignment.assignmentMethod === "auto";

  if (!isModerator && !isReporter && !isAssigner && !isAutoAssigned) {
    return err({
      code: "permission_denied",
      message: "You do not have permission to remove this flair",
    });
  }

  // Remove the flair
  try {
    await sightingFlairRepository.remove(input.sightingId as any, input.flairId as any);
    return ok(undefined);
  } catch (error) {
    return err({
      code: "removal_failed",
      message: error instanceof Error ? error.message : "Failed to remove flair",
    });
  }
}
