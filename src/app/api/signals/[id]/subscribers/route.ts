import { getSignalRepository } from "@/adapters/repositories/repository-factory";
import {
  jsonForbidden,
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
// For now, use the same stub as subscribe route
const subscriptionStore = new Map<SignalSubscriptionId, SignalSubscription>();

const subscriptionRepository = {
  async list(filters?: { signalId?: SignalId }) {
    const subs = Array.from(subscriptionStore.values());
    if (filters?.signalId) {
      return subs.filter((sub) => sub.signalId === filters.signalId);
    }
    return subs;
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

export const GET = async (_request: Request, context: RouteContext) => {
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

  // Only signal owner can view subscribers
  if (signal.ownerId !== userId) {
    return jsonForbidden(
      "You do not have permission to view subscribers for this signal."
    );
  }

  const subscriptions = await subscriptionRepository.list({ signalId });

  // Return subscriber info (without sensitive delivery config details)
  const subscribers = subscriptions.map((sub) => ({
    id: sub.id,
    userId: sub.userId,
    deliveryMethod: sub.deliveryMethod,
    isActive: sub.isActive,
    createdAt: sub.createdAt,
  }));

  return jsonOk({ data: subscribers });
};
