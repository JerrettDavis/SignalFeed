import { getSignalRepository } from "@/adapters/repositories/repository-factory";
import { ulidGenerator } from "@/adapters/id/ulid-generator";
import { systemClock } from "@/adapters/clock/system-clock";
import { SubscribeToSignalRequestSchema } from "@/contracts/signal";
import {
  jsonBadRequest,
  jsonCreated,
  jsonNotFound,
  jsonOk,
  jsonUnauthorized,
} from "@/shared/http";
import type { SignalId } from "@/domain/signals/signal";
import type {
  SignalSubscription,
  SignalSubscriptionId,
} from "@/ports/signal-subscription-repository";

export const runtime = "nodejs";

const signalRepository = getSignalRepository();

// TODO: Import actual subscription repository when available
// For now, create a simple in-memory stub
const subscriptionStore = new Map<SignalSubscriptionId, SignalSubscription>();

const subscriptionRepository = {
  async create(subscription: SignalSubscription) {
    subscriptionStore.set(subscription.id, subscription);
  },
  async getBySignalAndUser(signalId: SignalId, userId: string) {
    for (const sub of subscriptionStore.values()) {
      if (sub.signalId === signalId && sub.userId === userId) {
        return sub;
      }
    }
    return null;
  },
  async deleteBySignalAndUser(signalId: SignalId, userId: string) {
    for (const [id, sub] of subscriptionStore.entries()) {
      if (sub.signalId === signalId && sub.userId === userId) {
        subscriptionStore.delete(id);
        return;
      }
    }
  },
};

// Placeholder for auth - will be implemented later
const getUserIdFromSession = (): string | null => {
  // TODO: Implement proper auth
  return "placeholder-user-id";
};

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

export const POST = async (request: Request, context: RouteContext) => {
  const userId = getUserIdFromSession();
  if (!userId) {
    return jsonUnauthorized("Authentication required");
  }

  const params = await context.params;
  const signalId = params.id as SignalId;

  // Check if signal exists
  const signal = await signalRepository.getById(signalId);
  if (!signal) {
    return jsonNotFound("Signal not found.");
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonBadRequest({ message: "Invalid JSON payload." });
  }

  const parsed = SubscribeToSignalRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonBadRequest({
      message: "Invalid payload.",
      details: parsed.error.flatten(),
    });
  }

  // Check if already subscribed
  const existing = await subscriptionRepository.getBySignalAndUser(
    signalId,
    userId
  );
  if (existing) {
    return jsonBadRequest({ message: "Already subscribed to this signal." });
  }

  // Create subscription
  const subscription: SignalSubscription = {
    id: ulidGenerator.nextId() as SignalSubscriptionId,
    signalId,
    userId,
    deliveryMethod: parsed.data.deliveryMethod,
    deliveryConfig: parsed.data.deliveryConfig,
    isActive: true,
    createdAt: systemClock.now(),
    updatedAt: systemClock.now(),
  };

  await subscriptionRepository.create(subscription);

  return jsonCreated({ data: subscription });
};

export const DELETE = async (_request: Request, context: RouteContext) => {
  const userId = getUserIdFromSession();
  if (!userId) {
    return jsonUnauthorized("Authentication required");
  }

  const params = await context.params;
  const signalId = params.id as SignalId;

  // Check if signal exists
  const signal = await signalRepository.getById(signalId);
  if (!signal) {
    return jsonNotFound("Signal not found.");
  }

  // Check if subscribed
  const existing = await subscriptionRepository.getBySignalAndUser(
    signalId,
    userId
  );
  if (!existing) {
    return jsonNotFound("Subscription not found.");
  }

  await subscriptionRepository.deleteBySignalAndUser(signalId, userId);

  return jsonOk({ data: { success: true } });
};
