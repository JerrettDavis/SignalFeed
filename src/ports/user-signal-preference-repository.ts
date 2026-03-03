import type {
  UserSignalPreference,
  UserSignalPreferenceId,
  UpdateUserSignalPreference,
} from "@/domain/user-preferences/user-signal-preference";
import type { UserId } from "@/domain/users/user";
import type { SignalId } from "@/domain/signals/signal";

export type UserSignalPreferenceRepository = {
  /**
   * Create a new signal preference.
   */
  create: (preference: UserSignalPreference) => Promise<void>;

  /**
   * Find preference by ID.
   */
  getById: (
    id: UserSignalPreferenceId
  ) => Promise<UserSignalPreference | null>;

  /**
   * Find preference for a specific user and signal.
   */
  getByUserAndSignal: (
    userId: UserId,
    signalId: SignalId
  ) => Promise<UserSignalPreference | null>;

  /**
   * Get all preferences for a user.
   */
  getByUserId: (userId: UserId) => Promise<UserSignalPreference[]>;

  /**
   * Get all hidden signal IDs for a user.
   */
  getHiddenSignalIds: (userId: UserId) => Promise<SignalId[]>;

  /**
   * Get all pinned signal IDs for a user.
   */
  getPinnedSignalIds: (userId: UserId) => Promise<SignalId[]>;

  /**
   * Get all unimportant signal IDs for a user.
   */
  getUnimportantSignalIds: (userId: UserId) => Promise<SignalId[]>;

  /**
   * Update an existing preference.
   */
  update: (
    id: UserSignalPreferenceId,
    updates: UpdateUserSignalPreference
  ) => Promise<UserSignalPreference>;

  /**
   * Delete a specific preference.
   */
  delete: (id: UserSignalPreferenceId) => Promise<void>;

  /**
   * Delete all preferences for a user.
   */
  deleteAllForUser: (userId: UserId) => Promise<void>;

  /**
   * Delete all preferences for a signal.
   * Called when a signal is deleted.
   */
  deleteAllForSignal: (signalId: SignalId) => Promise<void>;

  /**
   * Upsert a preference (create or update).
   * Used for setting preferences without knowing if they exist.
   */
  upsert: (preference: UserSignalPreference) => Promise<void>;
};
