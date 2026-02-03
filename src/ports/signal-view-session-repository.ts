import type { SignalId } from "@/domain/signals/signal";
import type { UserId } from "@/domain/users/user";

/**
 * Active viewing session for real-time "active viewers" count.
 * Sessions expire after 5 minutes of inactivity.
 */
export type SignalViewSession = {
  userId: UserId;
  signalId: SignalId;
  lastHeartbeat: string; // ISO timestamp
};

export type SignalViewSessionRepository = {
  /**
   * Create or update a view session (upsert by userId + signalId).
   * Called every 30-60 seconds while user is viewing a signal.
   */
  upsertSession: (session: SignalViewSession) => Promise<void>;

  /**
   * Get all active sessions for a signal.
   * Only returns sessions with lastHeartbeat within the last 5 minutes.
   */
  getActiveSessionsForSignal: (signalId: SignalId) => Promise<SignalViewSession[]>;

  /**
   * Count active viewers for a signal.
   * Counts sessions with lastHeartbeat within the last 5 minutes.
   */
  countActiveViewers: (signalId: SignalId) => Promise<number>;

  /**
   * Delete a specific session.
   * Called when user explicitly leaves a signal view.
   */
  deleteSession: (userId: UserId, signalId: SignalId) => Promise<void>;

  /**
   * Delete all sessions for a user.
   * Called when user logs out.
   */
  deleteAllForUser: (userId: UserId) => Promise<void>;

  /**
   * Delete all sessions for a signal.
   * Called when a signal is deleted.
   */
  deleteAllForSignal: (signalId: SignalId) => Promise<void>;

  /**
   * Delete expired sessions (older than threshold).
   * Called periodically by background cleanup job (every 5 minutes).
   */
  deleteExpiredSessions: (thresholdMinutes: number) => Promise<void>;
};
