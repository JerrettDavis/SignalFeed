import type { Signal, SignalId } from "@/domain/signals/signal";

export type SignalFilters = {
  ownerId?: string;
  isActive?: boolean;
  geofenceId?: string;
};

export type SignalWithSubscriptionCount = Signal & {
  subscriptionCount: number;
};

export type SignalRepository = {
  create: (signal: Signal) => Promise<void>;
  list: (filters?: SignalFilters) => Promise<Signal[]>;
  listWithSubscriptionCounts: (
    filters?: SignalFilters
  ) => Promise<SignalWithSubscriptionCount[]>;
  getById: (id: SignalId) => Promise<Signal | null>;
  getByOwner: (ownerId: string) => Promise<Signal[]>;
  getActiveSignals: () => Promise<Signal[]>;
  getSignalsForGeofence: (geofenceId: string) => Promise<Signal[]>;
  update: (signal: Signal) => Promise<void>;
  delete: (id: SignalId) => Promise<void>;
  deleteMany: (ids: SignalId[]) => Promise<void>;

  // Analytics methods
  incrementViewCount: (id: SignalId) => Promise<void>;
  updateAnalytics: (id: SignalId, analytics: Partial<Signal["analytics"]>) => Promise<void>;
};
