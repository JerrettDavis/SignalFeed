import type { Signal, SignalId } from "@/domain/signals/signal";
import type {
  SignalFilters,
  SignalRepository,
  SignalWithSubscriptionCount,
} from "@/ports/signal-repository";
import { seedSignals } from "@/data/seed";

type Store = Map<SignalId, Signal>;
type SubscriptionCountStore = Map<SignalId, number>;

const getStore = (): Store => {
  const globalAny = globalThis as {
    __sightsignal_signals?: Store;
    __sightsignal_signals_initialized?: boolean;
  };
  if (!globalAny.__sightsignal_signals) {
    globalAny.__sightsignal_signals = new Map<SignalId, Signal>();
    // Load seed data on first initialization
    if (!globalAny.__sightsignal_signals_initialized) {
      seedSignals.forEach((signal) => {
        globalAny.__sightsignal_signals!.set(signal.id, signal);
      });
      globalAny.__sightsignal_signals_initialized = true;
    }
  }
  return globalAny.__sightsignal_signals;
};

const getSubscriptionCountStore = (): SubscriptionCountStore => {
  const globalAny = globalThis as {
    __sightsignal_signal_subscription_counts?: SubscriptionCountStore;
  };
  if (!globalAny.__sightsignal_signal_subscription_counts) {
    globalAny.__sightsignal_signal_subscription_counts = new Map<
      SignalId,
      number
    >();
  }
  return globalAny.__sightsignal_signal_subscription_counts;
};

const applyFilters = (signals: Signal[], filters?: SignalFilters): Signal[] => {
  if (!filters) {
    return signals;
  }

  return signals.filter((signal) => {
    if (filters.ownerId && signal.ownerId !== filters.ownerId) {
      return false;
    }
    if (
      filters.isActive !== undefined &&
      signal.isActive !== filters.isActive
    ) {
      return false;
    }
    if (filters.geofenceId) {
      if (
        signal.target.kind !== "geofence" ||
        signal.target.geofenceId !== filters.geofenceId
      ) {
        return false;
      }
    }
    return true;
  });
};

export const inMemorySignalRepository = (): SignalRepository => {
  const store = getStore();
  const subscriptionCounts = getSubscriptionCountStore();

  return {
    async create(signal) {
      store.set(signal.id, signal);
    },

    async list(filters) {
      const signals = Array.from(store.values());
      return applyFilters(signals, filters);
    },

    async listWithSubscriptionCounts(filters) {
      const signals = await this.list(filters);
      return signals.map((signal) => ({
        ...signal,
        subscriptionCount: subscriptionCounts.get(signal.id) ?? 0,
      }));
    },

    async getById(id) {
      return store.get(id) ?? null;
    },

    async getByOwner(ownerId) {
      return this.list({ ownerId });
    },

    async getActiveSignals() {
      return this.list({ isActive: true });
    },

    async getSignalsForGeofence(geofenceId) {
      return this.list({ geofenceId });
    },

    async update(signal) {
      store.set(signal.id, signal);
    },

    async delete(id) {
      store.delete(id);
      subscriptionCounts.delete(id);
    },

    async deleteMany(ids) {
      ids.forEach((id) => {
        store.delete(id);
        subscriptionCounts.delete(id);
      });
    },
  };
};
