import type { SignalId } from "@/domain/signals/signal";
import type {
  SignalSubscription,
  SignalSubscriptionId,
  SignalSubscriptionFilters,
  SignalSubscriptionRepository,
} from "@/ports/signal-subscription-repository";

type Store = Map<SignalSubscriptionId, SignalSubscription>;

const getStore = (): Store => {
  const globalAny = globalThis as {
    __sightsignal_signal_subscriptions?: Store;
  };
  if (!globalAny.__sightsignal_signal_subscriptions) {
    globalAny.__sightsignal_signal_subscriptions = new Map<
      SignalSubscriptionId,
      SignalSubscription
    >();
  }
  return globalAny.__sightsignal_signal_subscriptions;
};

const applyFilters = (
  subscriptions: SignalSubscription[],
  filters?: SignalSubscriptionFilters
): SignalSubscription[] => {
  if (!filters) {
    return subscriptions;
  }

  return subscriptions.filter((subscription) => {
    if (filters.signalId && subscription.signalId !== filters.signalId) {
      return false;
    }
    if (filters.userId && subscription.userId !== filters.userId) {
      return false;
    }
    if (
      filters.isActive !== undefined &&
      subscription.isActive !== filters.isActive
    ) {
      return false;
    }
    return true;
  });
};

export const inMemorySignalSubscriptionRepository =
  (): SignalSubscriptionRepository => {
    const store = getStore();

    return {
      async create(subscription) {
        store.set(subscription.id, subscription);
      },

      async list(filters) {
        const subscriptions = Array.from(store.values());
        return applyFilters(subscriptions, filters);
      },

      async getById(id) {
        return store.get(id) ?? null;
      },

      async getBySignalAndUser(signalId, userId) {
        const subscriptions = Array.from(store.values());
        return (
          subscriptions.find(
            (sub) => sub.signalId === signalId && sub.userId === userId
          ) ?? null
        );
      },

      async update(subscription) {
        store.set(subscription.id, subscription);
      },

      async delete(id) {
        store.delete(id);
      },

      async deleteBySignalAndUser(signalId, userId) {
        const subscription = await this.getBySignalAndUser(signalId, userId);
        if (subscription) {
          store.delete(subscription.id);
        }
      },

      async countBySignal(signalId) {
        const subscriptions = await this.list({ signalId });
        return subscriptions.length;
      },

      // Convenience methods
      async subscribe(subscription) {
        // Check if already subscribed
        const existing = await this.getBySignalAndUser(
          subscription.signalId,
          subscription.userId
        );
        if (existing) {
          // Update existing subscription if inactive
          if (!existing.isActive) {
            await this.update({
              ...existing,
              isActive: true,
              updatedAt: subscription.updatedAt,
            });
          }
        } else {
          // Create new subscription
          await this.create(subscription);
        }
      },

      async unsubscribe(signalId, userId) {
        await this.deleteBySignalAndUser(signalId, userId);
      },

      async getSubscribers(signalId) {
        return this.list({ signalId, isActive: true });
      },
    };
  };
