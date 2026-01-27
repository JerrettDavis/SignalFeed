import type {
  UserId,
  UserReputation,
  ReputationEvent,
} from "@/domain/reputation/reputation";

export type ReputationRepository = {
  // User reputation
  getByUserId: (userId: UserId) => Promise<UserReputation | null>;
  create: (reputation: UserReputation) => Promise<void>;
  update: (reputation: UserReputation) => Promise<void>;

  // Reputation events
  addEvent: (event: ReputationEvent) => Promise<void>;
  getEvents: (userId: UserId, limit?: number) => Promise<ReputationEvent[]>;

  // Leaderboard
  getTopUsers: (limit: number) => Promise<UserReputation[]>;
};
