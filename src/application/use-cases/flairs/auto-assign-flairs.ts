import type { SightingFlairRepository } from "@/ports/sighting-flair-repository";
import type { FlairRepository } from "@/ports/flair-repository";
import type { SightingRepository } from "@/ports/sighting-repository";
import type { Sighting, SightingId } from "@/domain/sightings/sighting";
import type { Flair, AutoAssignConditions } from "@/domain/flairs/flair";
import { createSightingFlair } from "@/domain/flairs/sighting-flair";

function meetsAutoAssignConditions(
  sighting: Sighting,
  conditions?: AutoAssignConditions
): boolean {
  if (!conditions) return false;

  const ageInHours =
    (Date.now() - new Date(sighting.observedAt).getTime()) / (1000 * 60 * 60);

  // Check score bounds
  if (
    conditions.minScore !== undefined &&
    sighting.score < conditions.minScore
  ) {
    return false;
  }
  if (
    conditions.maxScore !== undefined &&
    sighting.score > conditions.maxScore
  ) {
    return false;
  }

  // Check age bounds
  if (conditions.minAge !== undefined && ageInHours < conditions.minAge) {
    return false;
  }
  if (conditions.maxAge !== undefined && ageInHours > conditions.maxAge) {
    return false;
  }

  // Check engagement threshold
  if (conditions.minEngagement !== undefined) {
    const totalEngagement =
      sighting.upvotes +
      sighting.downvotes +
      sighting.confirmations +
      sighting.disputes;
    if (totalEngagement < conditions.minEngagement) {
      return false;
    }
  }

  // Check spam report threshold
  if (conditions.spamReportThreshold !== undefined) {
    if (sighting.spamReports >= conditions.spamReportThreshold) {
      return true; // Explicitly matches spam threshold
    }
  }

  return true;
}

export async function autoAssignFlairs(deps: {
  sightingFlairRepository: SightingFlairRepository;
  flairRepository: FlairRepository;
  sightingRepository: SightingRepository;
}): Promise<{ assignedCount: number; processedSightings: number }> {
  const { sightingFlairRepository, flairRepository, sightingRepository } = deps;

  let assignedCount = 0;
  let processedSightings = 0;

  try {
    // Get all active flairs with auto-assign conditions
    const allFlairs = await flairRepository.getActiveFlairs();
    const autoFlairs = allFlairs.filter((f) => f.autoAssignConditions);

    if (autoFlairs.length === 0) {
      return { assignedCount: 0, processedSightings: 0 };
    }

    // Get all active sightings
    const sightings = await sightingRepository.list({
      status: "active",
      limit: 1000, // Process in batches
    });

    for (const sighting of sightings) {
      processedSightings++;

      for (const flair of autoFlairs) {
        // Check if flair is applicable to this sighting's category
        if (flair.categoryId && flair.categoryId !== sighting.categoryId) {
          continue;
        }

        // Check if flair is already assigned
        const hasExistingFlair = await sightingFlairRepository.hasFlai(
          sighting.id,
          flair.id
        );

        if (hasExistingFlair) {
          continue;
        }

        // Check if conditions are met
        if (meetsAutoAssignConditions(sighting, flair.autoAssignConditions)) {
          const sightingFlair = createSightingFlair({
            sightingId: sighting.id as string,
            flairId: flair.id as string,
            assignmentMethod: "auto",
            metadata: { autoAssignedAt: new Date().toISOString() },
          });

          await sightingFlairRepository.assign(sightingFlair);
          assignedCount++;
        }
      }
    }

    return { assignedCount, processedSightings };
  } catch (error) {
    console.error("Error in auto-assign flairs:", error);
    return { assignedCount, processedSightings };
  }
}

// Process a single sighting for auto-assignment (useful when a sighting is created/updated)
export async function autoAssignFlairsForSighting(
  sightingId: string,
  deps: {
    sightingFlairRepository: SightingFlairRepository;
    flairRepository: FlairRepository;
    sightingRepository: SightingRepository;
  }
): Promise<number> {
  const { sightingFlairRepository, flairRepository, sightingRepository } = deps;

  const sighting = await sightingRepository.getById(sightingId as SightingId);
  if (!sighting) {
    return 0;
  }

  const allFlairs = await flairRepository.getActiveFlairs();
  const autoFlairs = allFlairs.filter((f) => f.autoAssignConditions);

  let assignedCount = 0;

  for (const flair of autoFlairs) {
    // Check category applicability
    if (flair.categoryId && flair.categoryId !== sighting.categoryId) {
      continue;
    }

    // Check if already assigned
    const hasExistingFlair = await sightingFlairRepository.hasFlai(
      sighting.id,
      flair.id
    );
    if (hasExistingFlair) {
      continue;
    }

    // Check conditions
    if (meetsAutoAssignConditions(sighting, flair.autoAssignConditions)) {
      const sightingFlair = createSightingFlair({
        sightingId: sighting.id as string,
        flairId: flair.id as string,
        assignmentMethod: "auto",
        metadata: { autoAssignedAt: new Date().toISOString() },
      });

      await sightingFlairRepository.assign(sightingFlair);
      assignedCount++;
    }
  }

  return assignedCount;
}
