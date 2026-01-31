import type {
  UserSettings,
  UserSettingsRepository,
  UserSettingsUpdate,
} from "@/domain/users/user-settings";
import { createDefaultSettings } from "@/domain/users/user-settings";

export class InMemoryUserSettingsRepository implements UserSettingsRepository {
  private settings: Map<string, UserSettings> = new Map();

  async save(settings: UserSettings): Promise<void> {
    this.settings.set(settings.userId, settings);
  }

  async findByUserId(userId: string): Promise<UserSettings | null> {
    return this.settings.get(userId) || null;
  }

  async update(
    userId: string,
    updates: UserSettingsUpdate
  ): Promise<UserSettings> {
    let settings = this.settings.get(userId);

    if (!settings) {
      // Create default settings if they don't exist
      settings = createDefaultSettings(userId);
    }

    const updatedSettings: UserSettings = {
      ...settings,
      ...updates,
      updatedAt: new Date(),
    };

    this.settings.set(userId, updatedSettings);
    return updatedSettings;
  }

  async delete(userId: string): Promise<void> {
    this.settings.delete(userId);
  }

  // Test helper
  clear(): void {
    this.settings.clear();
  }
}
