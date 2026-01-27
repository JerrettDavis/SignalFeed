import type { SignalId } from "@/domain/signals/signal";
import type { SignalRepository } from "@/ports/signal-repository";
import type { SignalSubscriptionRepository } from "@/ports/signal-subscription-repository";
import { err, ok, type DomainError, type Result } from "@/shared/result";

export type DeleteSignal = (
  id: string,
  userId: string
) => Promise<Result<void, DomainError>>;

type Dependencies = {
  signalRepository: SignalRepository;
  subscriptionRepository: SignalSubscriptionRepository;
};

export const buildDeleteSignal = ({
  signalRepository,
  subscriptionRepository,
}: Dependencies): DeleteSignal => {
  return async (id, userId) => {
    const existing = await signalRepository.getById(id as SignalId);

    if (!existing) {
      return err({
        code: "signal.not_found",
        message: "Signal not found.",
      });
    }

    // Validate ownership
    if (existing.ownerId !== userId) {
      return err({
        code: "signal.unauthorized",
        message: "You do not have permission to delete this signal.",
      });
    }

    // Delete all subscriptions for this signal first
    const subscriptions = await subscriptionRepository.list({
      signalId: id as SignalId,
    });
    if (subscriptions.length > 0) {
      await Promise.all(
        subscriptions.map((sub) => subscriptionRepository.delete(sub.id))
      );
    }

    // Delete the signal
    await signalRepository.delete(id as SignalId);
    return ok(undefined);
  };
};
