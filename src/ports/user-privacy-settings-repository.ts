import type {
  UserPrivacySettings,
  UserPrivacySettingsId,
  UpdateUserPrivacySettings,
} from "@/domain/users/user-privacy-settings";
import type { UserId } from "@/domain/users/user";

export type UserPrivacySettingsRepository = {
  /**
   * Create new privacy settings for a user.
   * Should be called when a user first signs up.
   */
  create: (settings: UserPrivacySettings) => Promise<void>;

  /**
   * Find privacy settings by ID.
   */
  getById: (id: UserPrivacySettingsId) => Promise<UserPrivacySettings | null>;

  /**
   * Find privacy settings for a specific user.
   * Returns null if no settings exist (user should get defaults).
   */
  getByUserId: (userId: UserId) => Promise<UserPrivacySettings | null>;

  /**
   * Update existing privacy settings.
   * Only updates the provided fields, leaving others unchanged.
   */
  update: (
    id: UserPrivacySettingsId,
    updates: UpdateUserPrivacySettings
  ) => Promise<UserPrivacySettings>;

  /**
   * Delete privacy settings for a user.
   * This also triggers deletion of all associated tracking data.
   */
  delete: (id: UserPrivacySettingsId) => Promise<void>;

  /**
   * Delete all tracking data for a user (respects privacy settings).
   * Called when user disables a privacy feature.
   */
  deleteTrackingDataForUser: (userId: UserId) => Promise<void>;
};
