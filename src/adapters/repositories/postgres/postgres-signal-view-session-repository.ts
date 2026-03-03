import type {
  SignalViewSession,
  SignalViewSessionRepository,
} from "@/ports/signal-view-session-repository";
import type { UserId } from "@/domain/users/user";
import type { SignalId } from "@/domain/signals/signal";
import type { Sql } from "postgres";

type DbSignalViewSession = {
  user_id: string;
  signal_id: string;
  last_heartbeat: Date;
};

const fromDb = (row: DbSignalViewSession): SignalViewSession => ({
  userId: row.user_id as UserId,
  signalId: row.signal_id as SignalId,
  lastHeartbeat: row.last_heartbeat.toISOString(),
});

export const buildPostgresSignalViewSessionRepository = (
  sql: Sql
): SignalViewSessionRepository => {
  return {
    async upsertSession(session: SignalViewSession): Promise<void> {
      await sql`
        INSERT INTO signal_view_sessions (
          user_id,
          signal_id,
          last_heartbeat
        )
        VALUES (
          ${session.userId},
          ${session.signalId},
          ${session.lastHeartbeat}
        )
        ON CONFLICT (user_id, signal_id)
        DO UPDATE SET
          last_heartbeat = EXCLUDED.last_heartbeat
      `;
    },

    async getActiveSessionsForSignal(
      signalId: SignalId
    ): Promise<SignalViewSession[]> {
      // Sessions are active if heartbeat is within the last 5 minutes
      const rows = await sql<DbSignalViewSession[]>`
        SELECT * FROM signal_view_sessions
        WHERE signal_id = ${signalId}
          AND last_heartbeat > NOW() - INTERVAL '5 minutes'
        ORDER BY last_heartbeat DESC
      `;
      return rows.map(fromDb);
    },

    async countActiveViewers(signalId: SignalId): Promise<number> {
      // Count sessions with heartbeat within the last 5 minutes
      const rows = await sql<{ count: string }[]>`
        SELECT COUNT(*) as count FROM signal_view_sessions
        WHERE signal_id = ${signalId}
          AND last_heartbeat > NOW() - INTERVAL '5 minutes'
      `;
      return parseInt(rows[0].count, 10);
    },

    async deleteSession(userId: UserId, signalId: SignalId): Promise<void> {
      await sql`
        DELETE FROM signal_view_sessions
        WHERE user_id = ${userId} AND signal_id = ${signalId}
      `;
    },

    async deleteAllForUser(userId: UserId): Promise<void> {
      await sql`
        DELETE FROM signal_view_sessions
        WHERE user_id = ${userId}
      `;
    },

    async deleteAllForSignal(signalId: SignalId): Promise<void> {
      await sql`
        DELETE FROM signal_view_sessions
        WHERE signal_id = ${signalId}
      `;
    },

    async deleteExpiredSessions(thresholdMinutes: number): Promise<void> {
      await sql`
        DELETE FROM signal_view_sessions
        WHERE last_heartbeat < NOW() - INTERVAL '1 minute' * ${thresholdMinutes}
      `;
    },
  };
};
