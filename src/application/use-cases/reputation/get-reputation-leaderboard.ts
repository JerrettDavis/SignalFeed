import type { Result } from "@/shared/result";
import { ok } from "@/shared/result";
import type { ReputationRepository } from "@/ports/reputation-repository";
import type { UserReputation } from "@/domain/reputation/reputation";

export type GetReputationLeaderboard = (
  limit?: number
) => Promise<Result<UserReputation[], never>>;

type Dependencies = {
  repository: ReputationRepository;
};

export const buildGetReputationLeaderboard = ({
  repository,
}: Dependencies): GetReputationLeaderboard => {
  return async (limit = 50) => {
    const topUsers = await repository.getTopUsers(limit);
    return ok(topUsers);
  };
};
