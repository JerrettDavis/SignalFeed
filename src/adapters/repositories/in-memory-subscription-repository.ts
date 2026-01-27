import type {
  Subscription,
  SubscriptionId,
} from "@/domain/subscriptions/subscription";
import type {
  SubscriptionFilters,
  SubscriptionRepository,
} from "@/ports/subscription-repository";
import { seedSubscriptions } from "@/data/seed";

type Store = Map<SubscriptionId, Subscription>;

const getStore = (): Store => {
  const globalAny = globalThis as {
    __sightsignal_subscriptions?: Store;
    __sightsignal_subscriptions_initialized?: boolean;
  };
  if (!globalAny.__sightsignal_subscriptions) {
    globalAny.__sightsignal_subscriptions = new Map<
      SubscriptionId,
      Subscription
    >();
    // Load seed data on first initialization
    if (!globalAny.__sightsignal_subscriptions_initialized) {
      seedSubscriptions.forEach((subscription) => {
        globalAny.__sightsignal_subscriptions!.set(
          subscription.id,
          subscription
        );
      });
      globalAny.__sightsignal_subscriptions_initialized = true;
    }
  }
  return globalAny.__sightsignal_subscriptions;
};

export const inMemorySubscriptionRepository = (): SubscriptionRepository => {
  const store = getStore();

  return {
    async create(subscription) {
      store.set(subscription.id, subscription);
    },
    async list(filters?: SubscriptionFilters) {
      const values = Array.from(store.values());
      if (!filters?.email) {
        return values;
      }
      return values.filter(
        (subscription) => subscription.email === filters.email
      );
    },
    async getById(id) {
      return store.get(id) ?? null;
    },
    async update(subscription) {
      store.set(subscription.id, subscription);
    },
    async delete(id) {
      store.delete(id);
    },
    async deleteMany(ids) {
      ids.forEach((id) => store.delete(id));
    },
  };
};
