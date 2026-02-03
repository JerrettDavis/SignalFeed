import type {
  UserCategoryInteraction,
  UserCategoryInteractionId,
} from "@/domain/user-preferences/user-category-interaction";
import {
  createUserCategoryInteraction,
  incrementClick as domainIncrementClick,
  incrementSubscription as domainIncrementSubscription,
  calculateInteractionScore,
} from "@/domain/user-preferences/user-category-interaction";
import type { UserCategoryInteractionRepository } from "@/ports/user-category-interaction-repository";
import type { UserId } from "@/domain/users/user";
import type { CategoryId } from "@/domain/sightings/sighting";
import { randomUUID } from "crypto";

export class InMemoryUserCategoryInteractionRepository
  implements UserCategoryInteractionRepository
{
  private interactions: Map<string, UserCategoryInteraction> = new Map();
  private userCategoryIndex: Map<string, string> = new Map(); // "userId:categoryId" -> interactionId

  private makeIndexKey(userId: UserId, categoryId: CategoryId): string {
    return `${userId}:${categoryId}`;
  }

  async create(interaction: UserCategoryInteraction): Promise<void> {
    this.interactions.set(interaction.id, interaction);
    this.userCategoryIndex.set(
      this.makeIndexKey(interaction.userId, interaction.categoryId),
      interaction.id
    );
  }

  async getById(
    id: UserCategoryInteractionId
  ): Promise<UserCategoryInteraction | null> {
    return this.interactions.get(id) || null;
  }

  async getByUserAndCategory(
    userId: UserId,
    categoryId: CategoryId
  ): Promise<UserCategoryInteraction | null> {
    const interactionId = this.userCategoryIndex.get(
      this.makeIndexKey(userId, categoryId)
    );
    if (!interactionId) return null;
    return this.interactions.get(interactionId) || null;
  }

  async getByUserId(userId: UserId): Promise<UserCategoryInteraction[]> {
    return Array.from(this.interactions.values()).filter(
      (i) => i.userId === userId
    );
  }

  async getTopCategoriesForUser(
    userId: UserId,
    limit: number
  ): Promise<UserCategoryInteraction[]> {
    const userInteractions = await this.getByUserId(userId);
    return userInteractions
      .sort((a, b) => {
        const scoreA = calculateInteractionScore(a);
        const scoreB = calculateInteractionScore(b);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  async update(interaction: UserCategoryInteraction): Promise<void> {
    this.interactions.set(interaction.id, interaction);
  }

  async delete(id: UserCategoryInteractionId): Promise<void> {
    const existing = this.interactions.get(id);
    if (existing) {
      this.userCategoryIndex.delete(
        this.makeIndexKey(existing.userId, existing.categoryId)
      );
      this.interactions.delete(id);
    }
  }

  async deleteAllForUser(userId: UserId): Promise<void> {
    const userInteractions = await this.getByUserId(userId);
    for (const interaction of userInteractions) {
      await this.delete(interaction.id);
    }
  }

  async incrementClick(userId: UserId, categoryId: CategoryId): Promise<void> {
    const existing = await this.getByUserAndCategory(userId, categoryId);
    const now = new Date().toISOString();

    if (existing) {
      const result = domainIncrementClick(existing, { updatedAt: now });
      if (result.ok) {
        await this.update(result.value);
      }
    } else {
      // Create new interaction with 1 click
      const id = randomUUID() as UserCategoryInteractionId;
      const result = createUserCategoryInteraction(
        {
          userId,
          categoryId,
          clickCount: 1,
          subscriptionCount: 0,
        },
        { id, createdAt: now }
      );
      if (result.ok) {
        await this.create(result.value);
      }
    }
  }

  async incrementSubscription(
    userId: UserId,
    categoryId: CategoryId
  ): Promise<void> {
    const existing = await this.getByUserAndCategory(userId, categoryId);
    const now = new Date().toISOString();

    if (existing) {
      const result = domainIncrementSubscription(existing, { updatedAt: now });
      if (result.ok) {
        await this.update(result.value);
      }
    } else {
      // Create new interaction with 1 subscription
      const id = randomUUID() as UserCategoryInteractionId;
      const result = createUserCategoryInteraction(
        {
          userId,
          categoryId,
          clickCount: 0,
          subscriptionCount: 1,
        },
        { id, createdAt: now }
      );
      if (result.ok) {
        await this.create(result.value);
      }
    }
  }

  // Test helper
  clear(): void {
    this.interactions.clear();
    this.userCategoryIndex.clear();
  }
}
