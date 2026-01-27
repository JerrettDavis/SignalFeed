import type { SignalId } from "@/domain/signals/signal";
import type { SignalSubscriptionRepository } from "@/ports/signal-subscription-repository";
import { err, ok, type DomainError, type Result } from "@/shared/result";

export type UnsubscribeFromSignal = (
  signalId: string,
  userId: string
) => Promise<Result<void, DomainError>>;

type Dependencies = {
  subscriptionRepository: SignalSubscriptionRepository;
};

export const buildUnsubscribeFromSignal = ({
  subscriptionRepository,
}: Dependencies): UnsubscribeFromSignal => {
  return async (signalId, userId) => {
    // Check if subscription exists
    const existing = await subscriptionRepository.getBySignalAndUser(
      signalId as SignalId,
      userId
    );

    if (!existing) {
      return err({
        code: "signal.not_subscribed",
        message: "Not subscribed to this signal.",
      });
    }

    // Delete subscription
    await subscriptionRepository.deleteBySignalAndUser(
      signalId as SignalId,
      userId
    );
    return ok(undefined);
  };
};
