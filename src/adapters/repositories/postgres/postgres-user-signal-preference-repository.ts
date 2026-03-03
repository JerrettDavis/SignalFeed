import type {
  UserSignalPreference,
  UserSignalPreferenceId,
  UpdateUserSignalPreference,
} from "@/domain/user-preferences/user-signal-preference";
import type { UserId } from "@/domain/users/user";
import type { SignalId } from "@/domain/signals/signal";
import type { UserSignalPreferenceRepository } from "@/ports/user-signal-preference-repository";
import type { Sql } from "postgres";

type DbUserSignalPreference = {
  user_id: string;
  signal_id: string;
  is_hidden: boolean;
  is_pinned: boolean;
  is_unimportant: boolean;
  custom_rank: number | null;
  updated_at: Date;
};

const fromDb = (row: DbUserSignalPreference): UserSignalPreference => {
  // Generate a composite ID from user_id and signal_id
  const id = `${row.user_id}:${row.signal_id}` as UserSignalPreferenceId;

  return {
    id,
    userId: row.user_id as UserId,
    signalId: row.signal_id as SignalId,
    isHidden: row.is_hidden,
    isPinned: row.is_pinned,
    isUnimportant: row.is_unimportant,
    customRank: row.custom_rank ?? undefined,
    updatedAt: row.updated_at.toISOString(),
  };
};

export const buildPostgresUserSignalPreferenceRepository = (
  sql: Sql
): UserSignalPreferenceRepository => {
  return {
    async create(preference: UserSignalPreference): Promise<void> {
      await sql`
        INSERT INTO user_signal_preferences (
          user_id,
          signal_id,
          is_hidden,
          is_pinned,
          is_unimportant,
          custom_rank,
          updated_at
        )
        VALUES (
          ${preference.userId},
          ${preference.signalId},
          ${preference.isHidden},
          ${preference.isPinned},
          ${preference.isUnimportant},
          ${preference.customRank ?? null},
          ${preference.updatedAt}
        )
      `;
    },

    async getById(
      id: UserSignalPreferenceId
    ): Promise<UserSignalPreference | null> {
      // Parse composite ID
      const [userId, signalId] = (id as string).split(":");
      if (!userId || !signalId) {
        return null;
      }

      const rows = await sql<DbUserSignalPreference[]>`
        SELECT * FROM user_signal_preferences
        WHERE user_id = ${userId} AND signal_id = ${signalId}
      `;
      return rows.length > 0 ? fromDb(rows[0]) : null;
    },

    async getByUserAndSignal(
      userId: UserId,
      signalId: SignalId
    ): Promise<UserSignalPreference | null> {
      const rows = await sql<DbUserSignalPreference[]>`
        SELECT * FROM user_signal_preferences
        WHERE user_id = ${userId} AND signal_id = ${signalId}
      `;
      return rows.length > 0 ? fromDb(rows[0]) : null;
    },

    async getByUserId(userId: UserId): Promise<UserSignalPreference[]> {
      const rows = await sql<DbUserSignalPreference[]>`
        SELECT * FROM user_signal_preferences
        WHERE user_id = ${userId}
        ORDER BY updated_at DESC
      `;
      return rows.map(fromDb);
    },

    async getHiddenSignalIds(userId: UserId): Promise<SignalId[]> {
      const rows = await sql<{ signal_id: string }[]>`
        SELECT signal_id FROM user_signal_preferences
        WHERE user_id = ${userId} AND is_hidden = true
      `;
      return rows.map((row) => row.signal_id as SignalId);
    },

    async getPinnedSignalIds(userId: UserId): Promise<SignalId[]> {
      const rows = await sql<{ signal_id: string }[]>`
        SELECT signal_id FROM user_signal_preferences
        WHERE user_id = ${userId} AND is_pinned = true
        ORDER BY custom_rank ASC NULLS LAST, updated_at DESC
      `;
      return rows.map((row) => row.signal_id as SignalId);
    },

    async getUnimportantSignalIds(userId: UserId): Promise<SignalId[]> {
      const rows = await sql<{ signal_id: string }[]>`
        SELECT signal_id FROM user_signal_preferences
        WHERE user_id = ${userId} AND is_unimportant = true
      `;
      return rows.map((row) => row.signal_id as SignalId);
    },

    async update(
      id: UserSignalPreferenceId,
      updates: UpdateUserSignalPreference
    ): Promise<UserSignalPreference> {
      // Parse composite ID
      const [userId, signalId] = (id as string).split(":");
      if (!userId || !signalId) {
        throw new Error(`Invalid UserSignalPreferenceId: ${id}`);
      }

      // Build SET clause dynamically based on provided updates
      const setClauses: string[] = ["updated_at = NOW()"];
      const params: unknown[] = [];

      if (updates.isHidden !== undefined) {
        params.push(updates.isHidden);
        setClauses.push(`is_hidden = $${params.length}`);
      }

      if (updates.isPinned !== undefined) {
        params.push(updates.isPinned);
        setClauses.push(`is_pinned = $${params.length}`);
      }

      if (updates.isUnimportant !== undefined) {
        params.push(updates.isUnimportant);
        setClauses.push(`is_unimportant = $${params.length}`);
      }

      if (updates.customRank !== undefined) {
        params.push(updates.customRank);
        setClauses.push(`custom_rank = $${params.length}`);
      }

      params.push(userId, signalId);
      const query = `
        UPDATE user_signal_preferences
        SET ${setClauses.join(", ")}
        WHERE user_id = $${params.length - 1} AND signal_id = $${params.length}
        RETURNING *
      `;

      const rows = await sql.unsafe<DbUserSignalPreference[]>(query, params as never[]);
      if (rows.length === 0) {
        throw new Error(
          `UserSignalPreference not found for user ${userId} and signal ${signalId}`
        );
      }
      return fromDb(rows[0]);
    },

    async delete(id: UserSignalPreferenceId): Promise<void> {
      // Parse composite ID
      const [userId, signalId] = (id as string).split(":");
      if (!userId || !signalId) {
        return;
      }

      await sql`
        DELETE FROM user_signal_preferences
        WHERE user_id = ${userId} AND signal_id = ${signalId}
      `;
    },

    async deleteAllForUser(userId: UserId): Promise<void> {
      await sql`
        DELETE FROM user_signal_preferences
        WHERE user_id = ${userId}
      `;
    },

    async deleteAllForSignal(signalId: SignalId): Promise<void> {
      await sql`
        DELETE FROM user_signal_preferences
        WHERE signal_id = ${signalId}
      `;
    },

    async upsert(preference: UserSignalPreference): Promise<void> {
      await sql`
        INSERT INTO user_signal_preferences (
          user_id,
          signal_id,
          is_hidden,
          is_pinned,
          is_unimportant,
          custom_rank,
          updated_at
        )
        VALUES (
          ${preference.userId},
          ${preference.signalId},
          ${preference.isHidden},
          ${preference.isPinned},
          ${preference.isUnimportant},
          ${preference.customRank ?? null},
          ${preference.updatedAt}
        )
        ON CONFLICT (user_id, signal_id)
        DO UPDATE SET
          is_hidden = EXCLUDED.is_hidden,
          is_pinned = EXCLUDED.is_pinned,
          is_unimportant = EXCLUDED.is_unimportant,
          custom_rank = EXCLUDED.custom_rank,
          updated_at = EXCLUDED.updated_at
      `;
    },
  };
};
