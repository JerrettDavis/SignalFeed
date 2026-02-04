import type { SightingFlairRepository } from "@/ports/sighting-flair-repository";
import type { FlairRepository } from "@/ports/flair-repository";
import type { SightingRepository } from "@/ports/sighting-repository";
import {
  createSightingFlair,
  canUserAssignFlair,
  type AssignFlairInput,
} from "@/domain/flairs/sighting-flair";
import { err, ok, type Result } from "@/shared/result";
import type { SightingId } from "@/domain/sightings/sighting";
import type { FlairId } from "@/domain/flairs/flair";

export interface AssignFlairToSightingInput {
  sightingId: string;
  flairId: string;
  userId: string;
  isModerator: boolean;
  assignmentMethod: "manual" | "moderator";
}

export async function assignFlairToSighting(
  input: AssignFlairToSightingInput,
  deps: {
    sightingFlairRepository: SightingFlairRepository;
    flairRepository: FlairRepository;
    sightingRepository: SightingRepository;
  }
): Promise<Result<void, { code: string; message: string }>> {
  const { sightingFlairRepository, flairRepository, sightingRepository } = deps;

  // Check if sighting exists
  const sighting = await sightingRepository.getById(
    input.sightingId as SightingId
  );
  if (!sighting) {
    return err({ code: "sighting_not_found", message: "Sighting not found" });
  }

  // Check if flair exists
  const flair = await flairRepository.getById(input.flairId as FlairId);
  if (!flair) {
    return err({ code: "flair_not_found", message: "Flair not found" });
  }

  // Check if user has permission to assign this flair
  const hasPermission = canUserAssignFlair(
    input.userId,
    sighting.reporterId,
    input.isModerator,
    input.assignmentMethod
  );

  if (!hasPermission) {
    return err({
      code: "permission_denied",
      message: "You do not have permission to assign this flair",
    });
  }

  // Check if flair is already assigned
  const hasExistingFlair = await sightingFlairRepository.hasFlai(
    input.sightingId as SightingId,
    input.flairId as FlairId
  );

  if (hasExistingFlair) {
    return err({
      code: "flair_already_assigned",
      message: "This flair is already assigned to the sighting",
    });
  }

  // Create and assign the flair
  try {
    const sightingFlair = createSightingFlair({
      sightingId: input.sightingId,
      flairId: input.flairId,
      assignedBy: input.userId,
      assignmentMethod: input.assignmentMethod,
    });

    await sightingFlairRepository.assign(sightingFlair);
    return ok(undefined);
  } catch (error) {
    return err({
      code: "assignment_failed",
      message:
        error instanceof Error ? error.message : "Failed to assign flair",
    });
  }
}
