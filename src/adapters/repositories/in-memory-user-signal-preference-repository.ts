import type {
  UserSignalPreference,
  UserSignalPreferenceId,
  UpdateUserSignalPreference,
} from "@/domain/user-preferences/user-signal-preference";
import { updatePreference as domainUpdatePreference } from "@/domain/user-preferences/user-signal-preference";
import type { UserSignalPreferenceRepository } from "@/ports/user-signal-preference-repository";
import type { UserId } from "@/domain/users/user";
import type { SignalId } from "@/domain/signals/signal";

export class InMemoryUserSignalPreferenceRepository
  implements UserSignalPreferenceRepository
{
  private preferences: Map<string, UserSignalPreference> = new Map();
  private userSignalIndex: Map<string, string> = new Map(); // "userId:signalId" -> preferenceId

  private makeIndexKey(userId: UserId, signalId: SignalId): string {
    return `${userId}:${signalId}`;
  }

  async create(preference: UserSignalPreference): Promise<void> {
    this.preferences.set(preference.id, preference);
    this.userSignalIndex.set(
      this.makeIndexKey(preference.userId, preference.signalId),
      preference.id
    );
  }

  async getById(
    id: UserSignalPreferenceId
  ): Promise<UserSignalPreference | null> {
    return this.preferences.get(id) || null;
  }

  async getByUserAndSignal(
    userId: UserId,
    signalId: SignalId
  ): Promise<UserSignalPreference | null> {
    const preferenceId = this.userSignalIndex.get(
      this.makeIndexKey(userId, signalId)
    );
    if (!preferenceId) return null;
    return this.preferences.get(preferenceId) || null;
  }

  async getByUserId(userId: UserId): Promise<UserSignalPreference[]> {
    return Array.from(this.preferences.values()).filter(
      (p) => p.userId === userId
    );
  }

  async getHiddenSignalIds(userId: UserId): Promise<SignalId[]> {
    const userPrefs = await this.getByUserId(userId);
    return userPrefs.filter((p) => p.isHidden).map((p) => p.signalId);
  }

  async getPinnedSignalIds(userId: UserId): Promise<SignalId[]> {
    const userPrefs = await this.getByUserId(userId);
    return userPrefs.filter((p) => p.isPinned).map((p) => p.signalId);
  }

  async getUnimportantSignalIds(userId: UserId): Promise<SignalId[]> {
    const userPrefs = await this.getByUserId(userId);
    return userPrefs.filter((p) => p.isUnimportant).map((p) => p.signalId);
  }

  async update(
    id: UserSignalPreferenceId,
    updates: UpdateUserSignalPreference
  ): Promise<UserSignalPreference> {
    const existing = this.preferences.get(id);
    if (!existing) {
      throw new Error(`Signal preference with ID ${id} not found`);
    }

    const now = new Date().toISOString();
    const result = domainUpdatePreference(existing, updates, {
      updatedAt: now,
    });

    if (!result.ok) {
      throw new Error(result.error.message);
    }

    this.preferences.set(id, result.value);
    return result.value;
  }

  async delete(id: UserSignalPreferenceId): Promise<void> {
    const existing = this.preferences.get(id);
    if (existing) {
      this.userSignalIndex.delete(
        this.makeIndexKey(existing.userId, existing.signalId)
      );
      this.preferences.delete(id);
    }
  }

  async deleteAllForUser(userId: UserId): Promise<void> {
    const userPrefs = await this.getByUserId(userId);
    for (const pref of userPrefs) {
      await this.delete(pref.id);
    }
  }

  async deleteAllForSignal(signalId: SignalId): Promise<void> {
    const signalPrefs = Array.from(this.preferences.values()).filter(
      (p) => p.signalId === signalId
    );
    for (const pref of signalPrefs) {
      await this.delete(pref.id);
    }
  }

  async upsert(preference: UserSignalPreference): Promise<void> {
    const existing = await this.getByUserAndSignal(
      preference.userId,
      preference.signalId
    );

    if (existing) {
      // Update existing
      this.preferences.set(existing.id, {
        ...preference,
        id: existing.id, // Keep existing ID
      });
    } else {
      // Create new
      await this.create(preference);
    }
  }

  // Test helper
  clear(): void {
    this.preferences.clear();
    this.userSignalIndex.clear();
  }
}
