import type { SignalId } from "@/domain/signals/signal";
import type { Clock } from "@/ports/clock";
import type { IdGenerator } from "@/ports/id-generator";
import type { SignalRepository } from "@/ports/signal-repository";
import type {
  DeliveryConfig,
  SignalSubscription,
  SignalSubscriptionId,
  SignalSubscriptionRepository,
} from "@/ports/signal-subscription-repository";
import { err, ok, type DomainError, type Result } from "@/shared/result";

export type SubscribeToSignal = (
  signalId: string,
  userId: string,
  deliveryConfig: DeliveryConfig
) => Promise<Result<SignalSubscription, DomainError>>;

type Dependencies = {
  signalRepository: SignalRepository;
  subscriptionRepository: SignalSubscriptionRepository;
  idGenerator: IdGenerator;
  clock: Clock;
};

export const buildSubscribeToSignal = ({
  signalRepository,
  subscriptionRepository,
  idGenerator,
  clock,
}: Dependencies): SubscribeToSignal => {
  return async (signalId, userId, deliveryConfig) => {
    // Validate signal exists
    const signal = await signalRepository.getById(signalId as SignalId);
    if (!signal) {
      return err({
        code: "signal.not_found",
        message: "Signal not found.",
      });
    }

    // Validate signal is active
    if (!signal.isActive) {
      return err({
        code: "signal.not_active",
        message: "Cannot subscribe to an inactive signal.",
      });
    }

    // Check if subscription already exists
    const existing = await subscriptionRepository.getBySignalAndUser(
      signalId as SignalId,
      userId
    );

    if (existing) {
      return err({
        code: "signal.already_subscribed",
        message: "Already subscribed to this signal with this delivery method.",
      });
    }

    // Create subscription
    const subscription: SignalSubscription = {
      id: idGenerator.nextId() as SignalSubscriptionId,
      signalId: signalId as SignalId,
      userId,
      deliveryMethod: deliveryConfig.method,
      deliveryConfig,
      isActive: true,
      createdAt: clock.now(),
      updatedAt: clock.now(),
    };

    await subscriptionRepository.create(subscription);
    return ok(subscription);
  };
};
