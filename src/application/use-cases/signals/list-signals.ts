import type { Signal } from "@/domain/signals/signal";
import type { SignalRepository } from "@/ports/signal-repository";
import { ok, type DomainError, type Result } from "@/shared/result";

export type ListSignalsInput = {
  filters?: {
    ownerId?: string;
    isActive?: boolean;
    geofenceId?: string;
  };
};

export type ListSignals = (
  input: ListSignalsInput
) => Promise<Result<Signal[], DomainError>>;

type Dependencies = {
  signalRepository: SignalRepository;
};

/**
 * List Signals Use Case (Anonymous/Unauthenticated)
 *
 * Returns a basic list of signals without personalization.
 * Used for anonymous users who aren't signed in.
 *
 * Returns signals sorted by:
 * - Classification (official > community > verified > personal)
 * - Total subscribers (popularity)
 * - Creation date (newer first)
 *
 * No personalization, no hidden signals, no category preferences.
 */
export const buildListSignals = ({
  signalRepository,
}: Dependencies): ListSignals => {
  return async (input) => {
    const { filters } = input;

    // Fetch all signals (with filters)
    const allSignals = await signalRepository.list(filters);

    // Sort by classification, popularity, then recency
    const sorted = [...allSignals].sort((a, b) => {
      // 1. Classification priority
      const classOrder = {
        official: 4,
        community: 3,
        verified: 2,
        personal: 1,
      };
      const classA = classOrder[a.classification];
      const classB = classOrder[b.classification];
      if (classA !== classB) return classB - classA;

      // 2. Popularity (subscribers)
      const subDiff = b.analytics.subscriberCount - a.analytics.subscriberCount;
      if (subDiff !== 0) return subDiff;

      // 3. Recency (newer first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return ok(sorted);
  };
};
