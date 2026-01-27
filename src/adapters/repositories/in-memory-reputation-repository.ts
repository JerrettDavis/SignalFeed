import type {
  UserId,
  UserReputation,
  ReputationEvent,
} from "@/domain/reputation/reputation";
import type { ReputationRepository } from "@/ports/reputation-repository";

type ReputationStore = Map<UserId, UserReputation>;
type EventsStore = Map<UserId, ReputationEvent[]>;

const getReputationStore = (): ReputationStore => {
  const globalAny = globalThis as {
    __sightsignal_reputation_store?: ReputationStore;
  };
  if (!globalAny.__sightsignal_reputation_store) {
    globalAny.__sightsignal_reputation_store = new Map<
      UserId,
      UserReputation
    >();
  }
  return globalAny.__sightsignal_reputation_store;
};

const getEventsStore = (): EventsStore => {
  const globalAny = globalThis as {
    __sightsignal_reputation_events?: EventsStore;
  };
  if (!globalAny.__sightsignal_reputation_events) {
    globalAny.__sightsignal_reputation_events = new Map<
      UserId,
      ReputationEvent[]
    >();
  }
  return globalAny.__sightsignal_reputation_events;
};

export const inMemoryReputationRepository = (): ReputationRepository => {
  const reputationStore = getReputationStore();
  const eventsStore = getEventsStore();

  return {
    async getByUserId(userId) {
      return reputationStore.get(userId) ?? null;
    },

    async create(reputation) {
      // Don't allow creating if user reputation already exists
      if (reputationStore.has(reputation.userId)) {
        throw new Error(
          `User reputation already exists for userId: ${reputation.userId}`
        );
      }
      reputationStore.set(reputation.userId, reputation);
    },

    async update(reputation) {
      // Only allow updating if user reputation already exists
      if (!reputationStore.has(reputation.userId)) {
        throw new Error(
          `User reputation not found for userId: ${reputation.userId}`
        );
      }
      reputationStore.set(reputation.userId, reputation);
    },

    async addEvent(event) {
      const events = eventsStore.get(event.userId) ?? [];
      events.push(event);
      eventsStore.set(event.userId, events);
    },

    async getEvents(userId, limit) {
      const events = eventsStore.get(userId) ?? [];

      // Sort by createdAt descending (most recent first)
      const sortedEvents = [...events].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Apply limit if specified
      if (limit !== undefined && limit > 0) {
        return sortedEvents.slice(0, limit);
      }

      return sortedEvents;
    },

    async getTopUsers(limit) {
      const users = Array.from(reputationStore.values());

      // Sort by score descending (highest first)
      const sortedUsers = users.sort((a, b) => b.score - a.score);

      // Return top N users
      return sortedUsers.slice(0, limit);
    },
  };
};
