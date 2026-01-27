import type { SignalId } from "@/domain/signals/signal";

export type SignalSubscriptionId = string & {
  readonly __brand: "SignalSubscriptionId";
};

export type DeliveryMethod = "email" | "webhook" | "push";

export type DeliveryConfig =
  | { method: "email"; email: string }
  | { method: "webhook"; url: string; secret?: string }
  | { method: "push"; subscription: unknown }; // PushSubscription from browser API

export type SignalSubscription = {
  id: SignalSubscriptionId;
  signalId: SignalId;
  userId: string;
  deliveryMethod: DeliveryMethod;
  deliveryConfig: DeliveryConfig;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SignalSubscriptionFilters = {
  signalId?: SignalId;
  userId?: string;
  isActive?: boolean;
};

export type SignalSubscriptionRepository = {
  create: (subscription: SignalSubscription) => Promise<void>;
  list: (filters?: SignalSubscriptionFilters) => Promise<SignalSubscription[]>;
  getById: (id: SignalSubscriptionId) => Promise<SignalSubscription | null>;
  getBySignalAndUser: (
    signalId: SignalId,
    userId: string
  ) => Promise<SignalSubscription | null>;
  update: (subscription: SignalSubscription) => Promise<void>;
  delete: (id: SignalSubscriptionId) => Promise<void>;
  deleteBySignalAndUser: (signalId: SignalId, userId: string) => Promise<void>;
  countBySignal: (signalId: SignalId) => Promise<number>;

  // Convenience methods
  subscribe: (subscription: SignalSubscription) => Promise<void>;
  unsubscribe: (signalId: SignalId, userId: string) => Promise<void>;
  getSubscribers: (signalId: SignalId) => Promise<SignalSubscription[]>;
};
