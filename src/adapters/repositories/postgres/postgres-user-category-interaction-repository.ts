import type {
  UserCategoryInteraction,
  UserCategoryInteractionId,
} from "@/domain/user-preferences/user-category-interaction";
import type { UserId } from "@/domain/users/user";
import type { CategoryId } from "@/domain/sightings/sighting";
import type { UserCategoryInteractionRepository } from "@/ports/user-category-interaction-repository";
import type { Sql } from "postgres";

type DbUserCategoryInteraction = {
  user_id: string;
  category_id: string;
  click_count: number;
  subscription_count: number;
  last_interaction: Date;
  created_at: Date;
};

const fromDb = (row: DbUserCategoryInteraction): UserCategoryInteraction => {
  // Generate a composite ID from user_id and category_id
  const id = `${row.user_id}:${row.category_id}` as UserCategoryInteractionId;

  return {
    id,
    userId: row.user_id as UserId,
    categoryId: row.category_id as CategoryId,
    clickCount: row.click_count,
    subscriptionCount: row.subscription_count,
    lastInteraction: row.last_interaction.toISOString(),
    createdAt: row.created_at.toISOString(),
  };
};

export const buildPostgresUserCategoryInteractionRepository = (
  sql: Sql
): UserCategoryInteractionRepository => {
  return {
    async create(interaction: UserCategoryInteraction): Promise<void> {
      await sql`
        INSERT INTO user_category_interactions (
          user_id,
          category_id,
          click_count,
          subscription_count,
          last_interaction,
          created_at
        )
        VALUES (
          ${interaction.userId},
          ${interaction.categoryId},
          ${interaction.clickCount},
          ${interaction.subscriptionCount},
          ${interaction.lastInteraction},
          ${interaction.createdAt}
        )
      `;
    },

    async getById(
      id: UserCategoryInteractionId
    ): Promise<UserCategoryInteraction | null> {
      // Parse composite ID
      const [userId, categoryId] = (id as string).split(":");
      if (!userId || !categoryId) {
        return null;
      }

      const rows = await sql<DbUserCategoryInteraction[]>`
        SELECT * FROM user_category_interactions
        WHERE user_id = ${userId} AND category_id = ${categoryId}
      `;
      return rows.length > 0 ? fromDb(rows[0]) : null;
    },

    async getByUserAndCategory(
      userId: UserId,
      categoryId: CategoryId
    ): Promise<UserCategoryInteraction | null> {
      const rows = await sql<DbUserCategoryInteraction[]>`
        SELECT * FROM user_category_interactions
        WHERE user_id = ${userId} AND category_id = ${categoryId}
      `;
      return rows.length > 0 ? fromDb(rows[0]) : null;
    },

    async getByUserId(userId: UserId): Promise<UserCategoryInteraction[]> {
      const rows = await sql<DbUserCategoryInteraction[]>`
        SELECT * FROM user_category_interactions
        WHERE user_id = ${userId}
        ORDER BY last_interaction DESC
      `;
      return rows.map(fromDb);
    },

    async getTopCategoriesForUser(
      userId: UserId,
      limit: number
    ): Promise<UserCategoryInteraction[]> {
      const rows = await sql<DbUserCategoryInteraction[]>`
        SELECT * FROM user_category_interactions
        WHERE user_id = ${userId}
        ORDER BY (click_count + subscription_count * 2) DESC, last_interaction DESC
        LIMIT ${limit}
      `;
      return rows.map(fromDb);
    },

    async update(interaction: UserCategoryInteraction): Promise<void> {
      await sql`
        UPDATE user_category_interactions
        SET
          click_count = ${interaction.clickCount},
          subscription_count = ${interaction.subscriptionCount},
          last_interaction = ${interaction.lastInteraction}
        WHERE user_id = ${interaction.userId}
          AND category_id = ${interaction.categoryId}
      `;
    },

    async delete(id: UserCategoryInteractionId): Promise<void> {
      // Parse composite ID
      const [userId, categoryId] = (id as string).split(":");
      if (!userId || !categoryId) {
        return;
      }

      await sql`
        DELETE FROM user_category_interactions
        WHERE user_id = ${userId} AND category_id = ${categoryId}
      `;
    },

    async deleteAllForUser(userId: UserId): Promise<void> {
      await sql`
        DELETE FROM user_category_interactions
        WHERE user_id = ${userId}
      `;
    },

    async incrementClick(userId: UserId, categoryId: CategoryId): Promise<void> {
      // Use INSERT ... ON CONFLICT for upsert behavior
      await sql`
        INSERT INTO user_category_interactions (
          user_id,
          category_id,
          click_count,
          subscription_count,
          last_interaction,
          created_at
        )
        VALUES (
          ${userId},
          ${categoryId},
          1,
          0,
          NOW(),
          NOW()
        )
        ON CONFLICT (user_id, category_id)
        DO UPDATE SET
          click_count = user_category_interactions.click_count + 1,
          last_interaction = NOW()
      `;
    },

    async incrementSubscription(
      userId: UserId,
      categoryId: CategoryId
    ): Promise<void> {
      // Use INSERT ... ON CONFLICT for upsert behavior
      await sql`
        INSERT INTO user_category_interactions (
          user_id,
          category_id,
          click_count,
          subscription_count,
          last_interaction,
          created_at
        )
        VALUES (
          ${userId},
          ${categoryId},
          0,
          1,
          NOW(),
          NOW()
        )
        ON CONFLICT (user_id, category_id)
        DO UPDATE SET
          subscription_count = user_category_interactions.subscription_count + 1,
          last_interaction = NOW()
      `;
    },
  };
};
