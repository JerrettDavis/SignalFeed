import type { FeedProvider } from "@/ports/feed-provider";
import type { SightingRepository } from "@/ports/sighting-repository";
import type { IdGenerator } from "@/ports/id-generator";
import type { Clock } from "@/ports/clock";
import { transformToSighting } from "./transform-to-sighting";
import {
  createSighting as createSightingEntity,
  updateSighting as updateSightingEntity,
  type SightingId,
} from "@/domain/sightings/sighting";

/**
 * Result of feed ingestion
 */
export type IngestResult = {
  /** Number of new sightings created */
  created: number;
  /** Number of existing sightings updated */
  updated: number;
  /** Number of items that failed to process */
  failed: number;
  /** Array of error messages for failed items */
  errors: Array<{ externalId: string; message: string }>;
};

type Dependencies = {
  repository: SightingRepository;
  idGenerator: IdGenerator;
  clock: Clock;
};

/**
 * Ingests data from an external feed provider
 *
 * This use case:
 * 1. Fetches items from the feed provider
 * 2. Transforms each item into a sighting
 * 3. Checks if a sighting with the same externalId already exists
 * 4. Creates new sightings or updates existing ones
 * 5. Returns statistics about the ingestion
 *
 * @param feedProvider - The feed provider to fetch data from
 * @param systemReporterId - The system user ID for this feed (e.g., "system-noaa")
 * @returns Promise<IngestResult> - Statistics about the ingestion
 */
export const buildIngestFeedData = ({
  repository,
  idGenerator,
  clock,
}: Dependencies) => {
  return async (
    feedProvider: FeedProvider,
    systemReporterId: string
  ): Promise<IngestResult> => {
    const result: IngestResult = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Fetch items from the feed
      const items = await feedProvider.fetch();

      console.log(
        `[IngestFeed:${feedProvider.name}] Fetched ${items.length} items`
      );

      // Process each item
      for (const item of items) {
        try {
          // Transform feed item to sighting
          const newSighting = transformToSighting(
            item,
            feedProvider.name,
            systemReporterId
          );

          // Check if sighting with this externalId already exists
          const existing = await repository.findByExternalId(item.externalId);

          if (existing) {
            // Update existing sighting
            const updateResult = updateSightingEntity(existing, newSighting);

            if (!updateResult.ok) {
              result.failed++;
              result.errors.push({
                externalId: item.externalId,
                message: updateResult.error.message,
              });
              console.error(
                `[IngestFeed:${feedProvider.name}] Failed to validate update for ${item.externalId}:`,
                updateResult.error
              );
              continue;
            }

            await repository.update(updateResult.value);
            result.updated++;
            console.log(
              `[IngestFeed:${feedProvider.name}] Updated ${item.externalId}`
            );
          } else {
            // Create new sighting
            const id = idGenerator.nextId() as SightingId;
            const createdAt = clock.now();

            const createResult = createSightingEntity(newSighting, {
              id,
              createdAt,
            });

            if (!createResult.ok) {
              result.failed++;
              result.errors.push({
                externalId: item.externalId,
                message: createResult.error.message,
              });
              console.error(
                `[IngestFeed:${feedProvider.name}] Failed to validate create for ${item.externalId}:`,
                createResult.error
              );
              continue;
            }

            await repository.create(createResult.value);
            result.created++;
            console.log(
              `[IngestFeed:${feedProvider.name}] Created ${item.externalId}`
            );
          }
        } catch (error) {
          result.failed++;
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          result.errors.push({
            externalId: item.externalId,
            message: errorMessage,
          });
          console.error(
            `[IngestFeed:${feedProvider.name}] Failed to process ${item.externalId}:`,
            error
          );
        }
      }

      console.log(
        `[IngestFeed:${feedProvider.name}] Completed: ${result.created} created, ${result.updated} updated, ${result.failed} failed`
      );

      return result;
    } catch (error) {
      console.error(
        `[IngestFeed:${feedProvider.name}] Fatal error during fetch:`,
        error
      );
      throw error;
    }
  };
};
