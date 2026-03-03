import type { SignalId } from "@/domain/signals/signal";

export type SignalActivitySnapshotId = string & {
  readonly __brand: "SignalActivitySnapshotId";
};

/**
 * Daily activity snapshot for viral detection.
 * One record per signal per day.
 */
export type SignalActivitySnapshot = {
  id: SignalActivitySnapshotId;
  signalId: SignalId;
  snapshotDate: string; // ISO date (YYYY-MM-DD)
  newSubscribers: number;
  newSightings: number;
  viewCount: number;
  createdAt: string;
};

export type NewSignalActivitySnapshot = {
  signalId: SignalId;
  snapshotDate: string;
  newSubscribers?: number;
  newSightings?: number;
  viewCount?: number;
};

export type SignalActivitySnapshotRepository = {
  /**
   * Create a new activity snapshot for a signal.
   * Should be called once per day per signal (background job).
   */
  create: (snapshot: SignalActivitySnapshot) => Promise<void>;

  /**
   * Find snapshot by ID.
   */
  getById: (
    id: SignalActivitySnapshotId
  ) => Promise<SignalActivitySnapshot | null>;

  /**
   * Get snapshot for a specific signal and date.
   */
  getBySignalAndDate: (
    signalId: SignalId,
    date: string
  ) => Promise<SignalActivitySnapshot | null>;

  /**
   * Get last N days of snapshots for a signal.
   * Sorted by date descending (most recent first).
   */
  getRecentForSignal: (
    signalId: SignalId,
    days: number
  ) => Promise<SignalActivitySnapshot[]>;

  /**
   * Get all snapshots for a signal in a date range.
   * Used for viral detection (needs last 8 days: 24h + 7-day average).
   */
  getBySignalAndDateRange: (
    signalId: SignalId,
    startDate: string,
    endDate: string
  ) => Promise<SignalActivitySnapshot[]>;

  /**
   * Update an existing snapshot (e.g., to correct data).
   */
  update: (snapshot: SignalActivitySnapshot) => Promise<void>;

  /**
   * Delete a specific snapshot.
   */
  delete: (id: SignalActivitySnapshotId) => Promise<void>;

  /**
   * Delete all snapshots for a signal.
   * Called when a signal is deleted.
   */
  deleteAllForSignal: (signalId: SignalId) => Promise<void>;

  /**
   * Delete snapshots older than a certain date.
   * Used for data retention cleanup (e.g., keep only last 90 days).
   */
  deleteOlderThan: (date: string) => Promise<void>;

  /**
   * Upsert a snapshot (create or update if exists for signal+date).
   * Used by background jobs that may run multiple times.
   */
  upsert: (snapshot: SignalActivitySnapshot) => Promise<void>;
};
