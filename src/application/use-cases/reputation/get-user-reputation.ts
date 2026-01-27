import type { Result, DomainError } from "@/shared/result";
import { ok, err } from "@/shared/result";
import type { ReputationRepository } from "@/ports/reputation-repository";
import type {
  UserId,
  UserReputation,
  ReputationEvent,
  ReputationTier,
} from "@/domain/reputation/reputation";
import { getReputationTier } from "@/domain/reputation/reputation";

export type UserReputationWithTier = {
  reputation: UserReputation;
  tier: ReputationTier;
  events: ReputationEvent[];
};

export type GetUserReputation = (
  userId: string,
  includeEvents?: boolean,
  eventsLimit?: number
) => Promise<Result<UserReputationWithTier, DomainError>>;

type Dependencies = {
  repository: ReputationRepository;
};

export const buildGetUserReputation = ({
  repository,
}: Dependencies): GetUserReputation => {
  return async (userId, includeEvents = false, eventsLimit = 20) => {
    const reputation = await repository.getByUserId(userId as UserId);

    if (!reputation) {
      return err({
        code: "reputation.user_not_found",
        message: "User reputation not found",
      });
    }

    const events = includeEvents
      ? await repository.getEvents(userId as UserId, eventsLimit)
      : [];

    const tier = getReputationTier(reputation.score);

    return ok({
      reputation,
      tier,
      events,
    });
  };
};
