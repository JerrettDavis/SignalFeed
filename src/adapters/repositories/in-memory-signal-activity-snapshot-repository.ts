import type {
  SignalActivitySnapshot,
  SignalActivitySnapshotId,
  SignalActivitySnapshotRepository,
} from "@/ports/signal-activity-snapshot-repository";
import type { SignalId } from "@/domain/signals/signal";

export class InMemorySignalActivitySnapshotRepository
  implements SignalActivitySnapshotRepository
{
  private snapshots: Map<string, SignalActivitySnapshot> = new Map();
  private signalDateIndex: Map<string, string> = new Map(); // "signalId:date" -> snapshotId

  private makeIndexKey(signalId: SignalId, date: string): string {
    return `${signalId}:${date}`;
  }

  async create(snapshot: SignalActivitySnapshot): Promise<void> {
    this.snapshots.set(snapshot.id, snapshot);
    this.signalDateIndex.set(
      this.makeIndexKey(snapshot.signalId, snapshot.snapshotDate),
      snapshot.id
    );
  }

  async getById(
    id: SignalActivitySnapshotId
  ): Promise<SignalActivitySnapshot | null> {
    return this.snapshots.get(id) || null;
  }

  async getBySignalAndDate(
    signalId: SignalId,
    date: string
  ): Promise<SignalActivitySnapshot | null> {
    const snapshotId = this.signalDateIndex.get(
      this.makeIndexKey(signalId, date)
    );
    if (!snapshotId) return null;
    return this.snapshots.get(snapshotId) || null;
  }

  async getRecentForSignal(
    signalId: SignalId,
    days: number
  ): Promise<SignalActivitySnapshot[]> {
    const signalSnapshots = Array.from(this.snapshots.values()).filter(
      (s) => s.signalId === signalId
    );

    return signalSnapshots
      .sort((a, b) => b.snapshotDate.localeCompare(a.snapshotDate))
      .slice(0, days);
  }

  async getBySignalAndDateRange(
    signalId: SignalId,
    startDate: string,
    endDate: string
  ): Promise<SignalActivitySnapshot[]> {
    const signalSnapshots = Array.from(this.snapshots.values()).filter(
      (s) =>
        s.signalId === signalId &&
        s.snapshotDate >= startDate &&
        s.snapshotDate <= endDate
    );

    return signalSnapshots.sort((a, b) =>
      b.snapshotDate.localeCompare(a.snapshotDate)
    );
  }

  async update(snapshot: SignalActivitySnapshot): Promise<void> {
    this.snapshots.set(snapshot.id, snapshot);
  }

  async delete(id: SignalActivitySnapshotId): Promise<void> {
    const existing = this.snapshots.get(id);
    if (existing) {
      this.signalDateIndex.delete(
        this.makeIndexKey(existing.signalId, existing.snapshotDate)
      );
      this.snapshots.delete(id);
    }
  }

  async deleteAllForSignal(signalId: SignalId): Promise<void> {
    const signalSnapshots = Array.from(this.snapshots.values()).filter(
      (s) => s.signalId === signalId
    );
    for (const snapshot of signalSnapshots) {
      await this.delete(snapshot.id);
    }
  }

  async deleteOlderThan(date: string): Promise<void> {
    const oldSnapshots = Array.from(this.snapshots.values()).filter(
      (s) => s.snapshotDate < date
    );
    for (const snapshot of oldSnapshots) {
      await this.delete(snapshot.id);
    }
  }

  async upsert(snapshot: SignalActivitySnapshot): Promise<void> {
    const existing = await this.getBySignalAndDate(
      snapshot.signalId,
      snapshot.snapshotDate
    );

    if (existing) {
      // Update existing
      this.snapshots.set(existing.id, {
        ...snapshot,
        id: existing.id, // Keep existing ID
      });
    } else {
      // Create new
      await this.create(snapshot);
    }
  }

  // Test helper
  clear(): void {
    this.snapshots.clear();
    this.signalDateIndex.clear();
  }
}
