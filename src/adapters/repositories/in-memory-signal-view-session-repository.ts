import type {
  SignalViewSession,
  SignalViewSessionRepository,
} from "@/ports/signal-view-session-repository";
import type { SignalId } from "@/domain/signals/signal";
import type { UserId } from "@/domain/users/user";

export class InMemorySignalViewSessionRepository
  implements SignalViewSessionRepository
{
  private sessions: Map<string, SignalViewSession> = new Map(); // "userId:signalId" -> session

  private makeSessionKey(userId: UserId, signalId: SignalId): string {
    return `${userId}:${signalId}`;
  }

  async upsertSession(session: SignalViewSession): Promise<void> {
    const key = this.makeSessionKey(session.userId, session.signalId);
    this.sessions.set(key, session);
  }

  async getActiveSessionsForSignal(
    signalId: SignalId
  ): Promise<SignalViewSession[]> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    return Array.from(this.sessions.values()).filter(
      (s) => s.signalId === signalId && s.lastHeartbeat >= fiveMinutesAgo
    );
  }

  async countActiveViewers(signalId: SignalId): Promise<number> {
    const activeSessions = await this.getActiveSessionsForSignal(signalId);
    return activeSessions.length;
  }

  async deleteSession(userId: UserId, signalId: SignalId): Promise<void> {
    const key = this.makeSessionKey(userId, signalId);
    this.sessions.delete(key);
  }

  async deleteAllForUser(userId: UserId): Promise<void> {
    const userSessions = Array.from(this.sessions.entries()).filter(
      ([_key, session]) => session.userId === userId
    );
    for (const [key, _session] of userSessions) {
      this.sessions.delete(key);
    }
  }

  async deleteAllForSignal(signalId: SignalId): Promise<void> {
    const signalSessions = Array.from(this.sessions.entries()).filter(
      ([_key, session]) => session.signalId === signalId
    );
    for (const [key, _session] of signalSessions) {
      this.sessions.delete(key);
    }
  }

  async deleteExpiredSessions(thresholdMinutes: number): Promise<void> {
    const threshold = new Date(
      Date.now() - thresholdMinutes * 60 * 1000
    ).toISOString();

    const expiredSessions = Array.from(this.sessions.entries()).filter(
      ([_key, session]) => session.lastHeartbeat < threshold
    );

    for (const [key, _session] of expiredSessions) {
      this.sessions.delete(key);
    }
  }

  // Test helper
  clear(): void {
    this.sessions.clear();
  }
}
