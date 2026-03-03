import type {
  UserPrivacySettings,
  UserPrivacySettingsId,
  UpdateUserPrivacySettings,
} from "@/domain/users/user-privacy-settings";
import type { UserId } from "@/domain/users/user";
import type { UserPrivacySettingsRepository } from "@/ports/user-privacy-settings-repository";
import type { Sql } from "postgres";

type DbUserPrivacySettings = {
  id: string;
  user_id: string;
  enable_personalization: boolean;
  enable_view_tracking: boolean;
  enable_location_sharing: boolean;
  created_at: Date;
  updated_at: Date;
};

const fromDb = (row: DbUserPrivacySettings): UserPrivacySettings => ({
  id: row.id as UserPrivacySettingsId,
  userId: row.user_id,
  enablePersonalization: row.enable_personalization,
  enableViewTracking: row.enable_view_tracking,
  enableLocationSharing: row.enable_location_sharing,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

export const buildPostgresUserPrivacySettingsRepository = (
  sql: Sql
): UserPrivacySettingsRepository => {
  return {
    async create(settings: UserPrivacySettings): Promise<void> {
      await sql`
        INSERT INTO user_privacy_settings (
          id,
          user_id,
          enable_personalization,
          enable_view_tracking,
          enable_location_sharing,
          created_at,
          updated_at
        )
        VALUES (
          ${settings.id},
          ${settings.userId},
          ${settings.enablePersonalization},
          ${settings.enableViewTracking},
          ${settings.enableLocationSharing},
          ${settings.createdAt},
          ${settings.updatedAt}
        )
      `;
    },

    async getById(
      id: UserPrivacySettingsId
    ): Promise<UserPrivacySettings | null> {
      const rows = await sql<DbUserPrivacySettings[]>`
        SELECT * FROM user_privacy_settings WHERE id = ${id}
      `;
      return rows.length > 0 ? fromDb(rows[0]) : null;
    },

    async getByUserId(userId: UserId): Promise<UserPrivacySettings | null> {
      const rows = await sql<DbUserPrivacySettings[]>`
        SELECT * FROM user_privacy_settings WHERE user_id = ${userId}
      `;
      return rows.length > 0 ? fromDb(rows[0]) : null;
    },

    async update(
      id: UserPrivacySettingsId,
      updates: UpdateUserPrivacySettings
    ): Promise<UserPrivacySettings> {
      // Build SET clause dynamically based on provided updates
      const setClauses: string[] = ["updated_at = NOW()"];
      const params: unknown[] = [];

      if (updates.enablePersonalization !== undefined) {
        params.push(updates.enablePersonalization);
        setClauses.push(`enable_personalization = $${params.length}`);
      }

      if (updates.enableViewTracking !== undefined) {
        params.push(updates.enableViewTracking);
        setClauses.push(`enable_view_tracking = $${params.length}`);
      }

      if (updates.enableLocationSharing !== undefined) {
        params.push(updates.enableLocationSharing);
        setClauses.push(`enable_location_sharing = $${params.length}`);
      }

      params.push(id);
      const query = `
        UPDATE user_privacy_settings
        SET ${setClauses.join(", ")}
        WHERE id = $${params.length}
        RETURNING *
      `;

      const rows = await sql.unsafe<DbUserPrivacySettings[]>(query, params as never[]);
      if (rows.length === 0) {
        throw new Error(`UserPrivacySettings with id ${id} not found`);
      }
      return fromDb(rows[0]);
    },

    async delete(id: UserPrivacySettingsId): Promise<void> {
      await sql`DELETE FROM user_privacy_settings WHERE id = ${id}`;
    },

    async deleteTrackingDataForUser(userId: UserId): Promise<void> {
      // Delete user category interactions
      await sql`DELETE FROM user_category_interactions WHERE user_id = ${userId}`;

      // Delete user signal preferences (only tracking-related data)
      // Note: We keep preferences like is_hidden, is_pinned as they're not tracking data
      // This is a policy decision - adjust as needed
    },
  };
};
