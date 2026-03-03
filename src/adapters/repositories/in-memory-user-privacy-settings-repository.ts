import type {
  UserPrivacySettings,
  UserPrivacySettingsId,
  UpdateUserPrivacySettings,
} from "@/domain/users/user-privacy-settings";
import type { UserPrivacySettingsRepository } from "@/ports/user-privacy-settings-repository";
import { createDefaultPrivacySettings } from "@/domain/users/user-privacy-settings";
import type { UserId } from "@/domain/users/user";

export class InMemoryUserPrivacySettingsRepository
  implements UserPrivacySettingsRepository
{
  private settings: Map<string, UserPrivacySettings> = new Map();
  private userIdIndex: Map<string, string> = new Map(); // userId -> settingsId

  async create(settings: UserPrivacySettings): Promise<void> {
    this.settings.set(settings.id, settings);
    this.userIdIndex.set(settings.userId, settings.id);
  }

  async getById(
    id: UserPrivacySettingsId
  ): Promise<UserPrivacySettings | null> {
    return this.settings.get(id) || null;
  }

  async getByUserId(userId: UserId): Promise<UserPrivacySettings | null> {
    const settingsId = this.userIdIndex.get(userId);
    if (!settingsId) return null;
    return this.settings.get(settingsId) || null;
  }

  async update(
    id: UserPrivacySettingsId,
    updates: UpdateUserPrivacySettings
  ): Promise<UserPrivacySettings> {
    const existing = this.settings.get(id);
    if (!existing) {
      throw new Error(`Privacy settings with ID ${id} not found`);
    }

    const updated: UserPrivacySettings = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.settings.set(id, updated);
    return updated;
  }

  async delete(id: UserPrivacySettingsId): Promise<void> {
    const existing = this.settings.get(id);
    if (existing) {
      this.userIdIndex.delete(existing.userId);
      this.settings.delete(id);
    }
  }

  async deleteTrackingDataForUser(userId: UserId): Promise<void> {
    // In-memory implementation: This would cascade delete in postgres
    // For now, this is a no-op in the in-memory implementation
    // The actual tracking data cleanup happens in the respective repositories
  }

  // Test helper
  clear(): void {
    this.settings.clear();
    this.userIdIndex.clear();
  }
}
