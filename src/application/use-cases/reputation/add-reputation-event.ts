import type { Result, DomainError } from "@/shared/result";
import { ok } from "@/shared/result";
import type { ReputationRepository } from "@/ports/reputation-repository";
import type {
  UserId,
  UserReputation,
  ReputationReason,
  ReputationEventId,
} from "@/domain/reputation/reputation";
import {
  createUserReputation,
  createReputationEvent,
  applyReputationEvent,
} from "@/domain/reputation/reputation";

export type AddReputationEvent = (
  userId: string,
  reason: ReputationReason,
  referenceId?: string
) => Promise<Result<UserReputation, DomainError>>;

type Dependencies = {
  repository: ReputationRepository;
};

export const buildAddReputationEvent = ({
  repository,
}: Dependencies): AddReputationEvent => {
  return async (userId, reason, referenceId) => {
    const now = new Date().toISOString();

    // Get or create user reputation
    let reputation = await repository.getByUserId(userId as UserId);

    if (!reputation) {
      reputation = createUserReputation(userId as UserId, { createdAt: now });
      await repository.create(reputation);
    }

    // Create reputation event
    const event = createReputationEvent(
      {
        userId: userId as UserId,
        reason,
        referenceId,
      },
      {
        id: crypto.randomUUID() as ReputationEventId,
        createdAt: now,
      }
    );

    // Save event
    await repository.addEvent(event);

    // Apply event to reputation
    const updatedReputation = applyReputationEvent(reputation, event);

    // Save updated reputation
    await repository.update(updatedReputation);

    return ok(updatedReputation);
  };
};
