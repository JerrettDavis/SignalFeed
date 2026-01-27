import type { SightingId } from "@/domain/sightings/sighting";
import type { UserId } from "@/domain/reputation/reputation";
import type {
  SightingReaction,
  SightingReactionType,
  SightingReactionCounts,
} from "@/domain/sightings/sighting-reaction";
import type { SightingReactionRepository } from "@/ports/sighting-reaction-repository";
import { emptyReactionCounts } from "@/domain/sightings/sighting-reaction";

// Composite key for reactions: sightingId:userId:type
type ReactionKey = string;

type ReactionStore = Map<ReactionKey, SightingReaction>;
type SightingReactionsIndex = Map<SightingId, Set<ReactionKey>>;
type UserReactionsIndex = Map<UserId, Set<ReactionKey>>;

const getReactionStore = (): ReactionStore => {
  const globalAny = globalThis as { __sightsignal_reactions?: ReactionStore };
  if (!globalAny.__sightsignal_reactions) {
    globalAny.__sightsignal_reactions = new Map<
      ReactionKey,
      SightingReaction
    >();
  }
  return globalAny.__sightsignal_reactions;
};

const getSightingIndex = (): SightingReactionsIndex => {
  const globalAny = globalThis as {
    __sightsignal_reactions_by_sighting?: SightingReactionsIndex;
  };
  if (!globalAny.__sightsignal_reactions_by_sighting) {
    globalAny.__sightsignal_reactions_by_sighting = new Map<
      SightingId,
      Set<ReactionKey>
    >();
  }
  return globalAny.__sightsignal_reactions_by_sighting;
};

const getUserIndex = (): UserReactionsIndex => {
  const globalAny = globalThis as {
    __sightsignal_reactions_by_user?: UserReactionsIndex;
  };
  if (!globalAny.__sightsignal_reactions_by_user) {
    globalAny.__sightsignal_reactions_by_user = new Map<
      UserId,
      Set<ReactionKey>
    >();
  }
  return globalAny.__sightsignal_reactions_by_user;
};

const makeReactionKey = (
  sightingId: SightingId,
  userId: UserId,
  type: SightingReactionType
): ReactionKey => {
  return `${sightingId}:${userId}:${type}`;
};

const makeUserReactionKey = (
  sightingId: SightingId,
  userId: UserId
): string => {
  return `${sightingId}:${userId}`;
};

export const inMemorySightingReactionRepository =
  (): SightingReactionRepository => {
    const reactionStore = getReactionStore();
    const sightingIndex = getSightingIndex();
    const userIndex = getUserIndex();

    return {
      async add(reaction) {
        const key = makeReactionKey(
          reaction.sightingId,
          reaction.userId,
          reaction.type
        );

        // Check if this exact reaction already exists
        if (reactionStore.has(key)) {
          throw new Error(
            `Reaction already exists for sighting ${reaction.sightingId}, user ${reaction.userId}, type ${reaction.type}`
          );
        }

        // Store the reaction
        reactionStore.set(key, reaction);

        // Update sighting index
        const sightingReactions =
          sightingIndex.get(reaction.sightingId) ?? new Set<ReactionKey>();
        sightingReactions.add(key);
        sightingIndex.set(reaction.sightingId, sightingReactions);

        // Update user index
        const userReactions =
          userIndex.get(reaction.userId) ?? new Set<ReactionKey>();
        userReactions.add(key);
        userIndex.set(reaction.userId, userReactions);
      },

      async remove(sightingId, userId, type) {
        const key = makeReactionKey(sightingId, userId, type);

        // Remove from main store
        const deleted = reactionStore.delete(key);

        if (deleted) {
          // Update sighting index
          const sightingReactions = sightingIndex.get(sightingId);
          if (sightingReactions) {
            sightingReactions.delete(key);
            if (sightingReactions.size === 0) {
              sightingIndex.delete(sightingId);
            }
          }

          // Update user index
          const userReactions = userIndex.get(userId);
          if (userReactions) {
            userReactions.delete(key);
            if (userReactions.size === 0) {
              userIndex.delete(userId);
            }
          }
        }
      },

      async getUserReaction(sightingId, userId) {
        // Check all reaction types for this user/sighting combo
        const types: SightingReactionType[] = [
          "upvote",
          "downvote",
          "confirmed",
          "disputed",
          "spam",
        ];

        for (const type of types) {
          const key = makeReactionKey(sightingId, userId, type);
          const reaction = reactionStore.get(key);
          if (reaction) {
            return reaction;
          }
        }

        return null;
      },

      async getCounts(sightingId) {
        const counts: SightingReactionCounts = emptyReactionCounts();
        const reactionKeys = sightingIndex.get(sightingId);

        if (!reactionKeys) {
          return counts;
        }

        // Count reactions by type
        for (const key of reactionKeys) {
          const reaction = reactionStore.get(key);
          if (reaction) {
            switch (reaction.type) {
              case "upvote":
                counts.upvotes++;
                break;
              case "downvote":
                counts.downvotes++;
                break;
              case "confirmed":
                counts.confirmations++;
                break;
              case "disputed":
                counts.disputes++;
                break;
              case "spam":
                counts.spamReports++;
                break;
            }
          }
        }

        return counts;
      },

      async getReactionsForSighting(sightingId) {
        const reactionKeys = sightingIndex.get(sightingId);

        if (!reactionKeys) {
          return [];
        }

        const reactions: SightingReaction[] = [];
        for (const key of reactionKeys) {
          const reaction = reactionStore.get(key);
          if (reaction) {
            reactions.push(reaction);
          }
        }

        // Sort by createdAt descending (most recent first)
        return reactions.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      },

      async getUserReactions(userId, limit) {
        const reactionKeys = userIndex.get(userId);

        if (!reactionKeys) {
          return [];
        }

        const reactions: SightingReaction[] = [];
        for (const key of reactionKeys) {
          const reaction = reactionStore.get(key);
          if (reaction) {
            reactions.push(reaction);
          }
        }

        // Sort by createdAt descending (most recent first)
        const sortedReactions = reactions.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Apply limit if specified
        if (limit !== undefined && limit > 0) {
          return sortedReactions.slice(0, limit);
        }

        return sortedReactions;
      },
    };
  };
