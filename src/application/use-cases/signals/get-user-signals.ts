import type { SignalWithSubscriptionCount } from "@/ports/signal-repository";
import type { SignalRepository } from "@/ports/signal-repository";

export type GetUserSignals = (
  userId: string
) => Promise<SignalWithSubscriptionCount[]>;

type Dependencies = {
  repository: SignalRepository;
};

export const buildGetUserSignals = ({
  repository,
}: Dependencies): GetUserSignals => {
  return async (userId) => {
    return repository.listWithSubscriptionCounts({ ownerId: userId });
  };
};
