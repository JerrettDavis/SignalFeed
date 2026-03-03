import type {
  SignalActivitySnapshot,
  SignalActivitySnapshotId,
  SignalActivitySnapshotRepository,
} from "@/ports/signal-activity-snapshot-repository";
import type { SignalId } from "@/domain/signals/signal";
import type { Sql } from "postgres";

type DbSignalActivitySnapshot = {
  id: string;
  signal_id: string;
  snapshot_date: string; // DATE column returns string in format YYYY-MM-DD
  new_subscribers: number;
  new_sightings: number;
  view_count: number;
  created_at: Date;
};

const fromDb = (row: DbSignalActivitySnapshot): SignalActivitySnapshot => ({
  id: row.id as SignalActivitySnapshotId,
  signalId: row.signal_id as SignalId,
  snapshotDate: row.snapshot_date, // Already in YYYY-MM-DD format
  newSubscribers: row.new_subscribers,
  newSightings: row.new_sightings,
  viewCount: row.view_count,
  createdAt: row.created_at.toISOString(),
});

export const buildPostgresSignalActivitySnapshotRepository = (
  sql: Sql
): SignalActivitySnapshotRepository => {
  return {
    async create(snapshot: SignalActivitySnapshot): Promise<void> {
      await sql`
        INSERT INTO signal_activity_snapshots (
          id,
          signal_id,
          snapshot_date,
          new_subscribers,
          new_sightings,
          view_count,
          created_at
        )
        VALUES (
          ${snapshot.id},
          ${snapshot.signalId},
          ${snapshot.snapshotDate},
          ${snapshot.newSubscribers},
          ${snapshot.newSightings},
          ${snapshot.viewCount},
          ${snapshot.createdAt}
        )
      `;
    },

    async getById(
      id: SignalActivitySnapshotId
    ): Promise<SignalActivitySnapshot | null> {
      const rows = await sql<DbSignalActivitySnapshot[]>`
        SELECT * FROM signal_activity_snapshots WHERE id = ${id}
      `;
      return rows.length > 0 ? fromDb(rows[0]) : null;
    },

    async getBySignalAndDate(
      signalId: SignalId,
      date: string
    ): Promise<SignalActivitySnapshot | null> {
      const rows = await sql<DbSignalActivitySnapshot[]>`
        SELECT * FROM signal_activity_snapshots
        WHERE signal_id = ${signalId} AND snapshot_date = ${date}
      `;
      return rows.length > 0 ? fromDb(rows[0]) : null;
    },

    async getRecentForSignal(
      signalId: SignalId,
      days: number
    ): Promise<SignalActivitySnapshot[]> {
      const rows = await sql<DbSignalActivitySnapshot[]>`
        SELECT * FROM signal_activity_snapshots
        WHERE signal_id = ${signalId}
        ORDER BY snapshot_date DESC
        LIMIT ${days}
      `;
      return rows.map(fromDb);
    },

    async getBySignalAndDateRange(
      signalId: SignalId,
      startDate: string,
      endDate: string
    ): Promise<SignalActivitySnapshot[]> {
      const rows = await sql<DbSignalActivitySnapshot[]>`
        SELECT * FROM signal_activity_snapshots
        WHERE signal_id = ${signalId}
          AND snapshot_date >= ${startDate}
          AND snapshot_date <= ${endDate}
        ORDER BY snapshot_date ASC
      `;
      return rows.map(fromDb);
    },

    async update(snapshot: SignalActivitySnapshot): Promise<void> {
      await sql`
        UPDATE signal_activity_snapshots
        SET
          new_subscribers = ${snapshot.newSubscribers},
          new_sightings = ${snapshot.newSightings},
          view_count = ${snapshot.viewCount}
        WHERE id = ${snapshot.id}
      `;
    },

    async delete(id: SignalActivitySnapshotId): Promise<void> {
      await sql`DELETE FROM signal_activity_snapshots WHERE id = ${id}`;
    },

    async deleteAllForSignal(signalId: SignalId): Promise<void> {
      await sql`
        DELETE FROM signal_activity_snapshots WHERE signal_id = ${signalId}
      `;
    },

    async deleteOlderThan(date: string): Promise<void> {
      await sql`
        DELETE FROM signal_activity_snapshots WHERE snapshot_date < ${date}
      `;
    },

    async upsert(snapshot: SignalActivitySnapshot): Promise<void> {
      await sql`
        INSERT INTO signal_activity_snapshots (
          id,
          signal_id,
          snapshot_date,
          new_subscribers,
          new_sightings,
          view_count,
          created_at
        )
        VALUES (
          ${snapshot.id},
          ${snapshot.signalId},
          ${snapshot.snapshotDate},
          ${snapshot.newSubscribers},
          ${snapshot.newSightings},
          ${snapshot.viewCount},
          ${snapshot.createdAt}
        )
        ON CONFLICT (signal_id, snapshot_date)
        DO UPDATE SET
          new_subscribers = EXCLUDED.new_subscribers,
          new_sightings = EXCLUDED.new_sightings,
          view_count = EXCLUDED.view_count
      `;
    },
  };
};
