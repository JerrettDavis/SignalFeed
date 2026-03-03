import type {
  UserCategoryInteraction,
  UserCategoryInteractionId,
} from "@/domain/user-preferences/user-category-interaction";
import type { UserId } from "@/domain/users/user";
import type { CategoryId } from "@/domain/sightings/sighting";

export type UserCategoryInteractionRepository = {
  /**
   * Create a new category interaction record.
   */
  create: (interaction: UserCategoryInteraction) => Promise<void>;

  /**
   * Find interaction by ID.
   */
  getById: (
    id: UserCategoryInteractionId
  ) => Promise<UserCategoryInteraction | null>;

  /**
   * Find interaction for a specific user and category.
   */
  getByUserAndCategory: (
    userId: UserId,
    categoryId: CategoryId
  ) => Promise<UserCategoryInteraction | null>;

  /**
   * Get all interactions for a user.
   * Used for calculating category preferences.
   */
  getByUserId: (userId: UserId) => Promise<UserCategoryInteraction[]>;

  /**
   * Get top N categories by interaction score for a user.
   * Sorted by interaction score descending.
   */
  getTopCategoriesForUser: (
    userId: UserId,
    limit: number
  ) => Promise<UserCategoryInteraction[]>;

  /**
   * Update an existing interaction (e.g., increment counts).
   */
  update: (interaction: UserCategoryInteraction) => Promise<void>;

  /**
   * Delete a specific interaction.
   */
  delete: (id: UserCategoryInteractionId) => Promise<void>;

  /**
   * Delete all interactions for a user.
   * Called when user disables personalization.
   */
  deleteAllForUser: (userId: UserId) => Promise<void>;

  /**
   * Increment click count for a user-category pair.
   * Creates the record if it doesn't exist.
   */
  incrementClick: (userId: UserId, categoryId: CategoryId) => Promise<void>;

  /**
   * Increment subscription count for a user-category pair.
   * Creates the record if it doesn't exist.
   */
  incrementSubscription: (
    userId: UserId,
    categoryId: CategoryId
  ) => Promise<void>;
};
