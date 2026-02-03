import { err, ok, type DomainError, type Result } from "@/shared/result";

export type UserPrivacySettingsId = string & {
  readonly __brand: "UserPrivacySettingsId";
};

/**
 * User Privacy Settings
 *
 * Controls what data is collected for personalization and analytics.
 * All settings default to false (privacy-first approach).
 * Users can enable features to improve their experience.
 * All collected data can be deleted at any time.
 */
export type UserPrivacySettings = {
  id: UserPrivacySettingsId;
  userId: string;

  /**
   * Enable personalization based on category interactions.
   *
   * When enabled:
   * - Tracks which categories you interact with most
   * - Learns your preferences over time
   * - Provides personalized category suggestions
   * - Improves signal ranking based on your interests
   *
   * This helps surface the most relevant content for you.
   * All interaction data can be deleted at any time.
   *
   * @default false
   */
  enablePersonalization: boolean;

  /**
   * Enable signal view analytics.
   *
   * When enabled:
   * - Records which signals you view
   * - Tracks time spent on different signal types
   * - Helps understand which content is most valuable to you
   * - Improves signal recommendations
   *
   * This enhances your browsing experience by learning what matters to you.
   * All view history can be deleted at any time.
   *
   * @default false
   */
  enableViewTracking: boolean;

  /**
   * Enable location-based ranking and features.
   *
   * When enabled:
   * - Uses your location to rank nearby sightings higher
   * - Provides location-aware signal filtering
   * - Enables proximity-based notifications
   * - Improves relevance of displayed content
   *
   * This helps you discover relevant sightings in your area.
   * Location data can be cleared at any time.
   *
   * @default false
   */
  enableLocationSharing: boolean;

  createdAt: string;
  updatedAt: string;
};

/**
 * Input type for creating new privacy settings
 */
export type NewUserPrivacySettings = {
  userId: string;
  enablePersonalization?: boolean;
  enableViewTracking?: boolean;
  enableLocationSharing?: boolean;
};

/**
 * Input type for updating privacy settings
 */
export type UpdateUserPrivacySettings = {
  enablePersonalization?: boolean;
  enableViewTracking?: boolean;
  enableLocationSharing?: boolean;
};

/**
 * Creates default privacy settings with privacy-first defaults.
 *
 * All tracking and personalization features are disabled by default.
 * Users must explicitly opt-in to enable these features.
 *
 * @param id - Unique identifier for the privacy settings
 * @param userId - User ID these settings belong to
 * @returns Privacy settings with all features disabled
 */
export const createDefaultPrivacySettings = (
  id: string,
  userId: string
): UserPrivacySettings => {
  const now = new Date().toISOString();

  return {
    id: id as UserPrivacySettingsId,
    userId,
    enablePersonalization: false,
    enableViewTracking: false,
    enableLocationSharing: false,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Creates new privacy settings with validation.
 *
 * Validates that:
 * - User ID is provided
 * - All boolean flags are valid
 *
 * @param id - Unique identifier for the privacy settings
 * @param data - Privacy settings data
 * @returns Result containing created privacy settings or error
 */
export const createPrivacySettings = (
  id: string,
  data: NewUserPrivacySettings
): Result<UserPrivacySettings, DomainError> => {
  // Validate user ID
  if (!data.userId || data.userId.trim().length === 0) {
    return err({
      code: "privacy_settings.invalid_user_id",
      message: "User ID is required.",
      field: "userId",
    });
  }

  const now = new Date().toISOString();

  return ok({
    id: id as UserPrivacySettingsId,
    userId: data.userId,
    enablePersonalization: data.enablePersonalization ?? false,
    enableViewTracking: data.enableViewTracking ?? false,
    enableLocationSharing: data.enableLocationSharing ?? false,
    createdAt: now,
    updatedAt: now,
  });
};

/**
 * Validates privacy settings updates.
 *
 * Ensures all provided values are valid booleans.
 *
 * @param updates - Privacy settings updates to validate
 * @returns Result indicating success or validation error
 */
export const validatePrivacySettingsUpdate = (
  updates: UpdateUserPrivacySettings
): Result<UpdateUserPrivacySettings, DomainError> => {
  // Check that at least one field is being updated
  const hasUpdates =
    updates.enablePersonalization !== undefined ||
    updates.enableViewTracking !== undefined ||
    updates.enableLocationSharing !== undefined;

  if (!hasUpdates) {
    return err({
      code: "privacy_settings.no_updates",
      message: "At least one setting must be provided for update.",
    });
  }

  // All fields are booleans, TypeScript handles type validation
  // Just ensure they're actually booleans if provided
  if (
    updates.enablePersonalization !== undefined &&
    typeof updates.enablePersonalization !== "boolean"
  ) {
    return err({
      code: "privacy_settings.invalid_type",
      message: "enablePersonalization must be a boolean.",
      field: "enablePersonalization",
    });
  }

  if (
    updates.enableViewTracking !== undefined &&
    typeof updates.enableViewTracking !== "boolean"
  ) {
    return err({
      code: "privacy_settings.invalid_type",
      message: "enableViewTracking must be a boolean.",
      field: "enableViewTracking",
    });
  }

  if (
    updates.enableLocationSharing !== undefined &&
    typeof updates.enableLocationSharing !== "boolean"
  ) {
    return err({
      code: "privacy_settings.invalid_type",
      message: "enableLocationSharing must be a boolean.",
      field: "enableLocationSharing",
    });
  }

  return ok(updates);
};

/**
 * Updates existing privacy settings with validation.
 *
 * Validates the updates and merges them with existing settings.
 *
 * @param existing - Current privacy settings
 * @param updates - Updates to apply
 * @returns Result containing updated privacy settings or error
 */
export const updatePrivacySettings = (
  existing: UserPrivacySettings,
  updates: UpdateUserPrivacySettings
): Result<UserPrivacySettings, DomainError> => {
  // Validate updates
  const validation = validatePrivacySettingsUpdate(updates);
  if (!validation.ok) {
    return validation;
  }

  return ok({
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  });
};
