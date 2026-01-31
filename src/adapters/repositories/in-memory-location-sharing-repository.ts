import type {
  UserLocation,
  LocationSharingRepository,
} from "@/domain/users/location-sharing";

export class InMemoryLocationSharingRepository implements LocationSharingRepository {
  private locations: Map<string, UserLocation> = new Map();
  private blocks: Map<string, Set<string>> = new Map(); // blockerId -> Set<blockedId>
  private readonly LOCATION_TTL = 5 * 60 * 1000; // 5 minutes

  async updateLocation(location: UserLocation): Promise<void> {
    this.locations.set(location.userId, location);

    // Auto-cleanup old locations
    this.cleanupStaleLocations();
  }

  async getLocation(userId: string): Promise<UserLocation | null> {
    const location = this.locations.get(userId);
    if (!location) return null;

    // Check if location is stale
    const age = Date.now() - location.timestamp.getTime();
    if (age > this.LOCATION_TTL) {
      this.locations.delete(userId);
      return null;
    }

    return location;
  }

  async getActiveLocations(followMeOnly = false): Promise<UserLocation[]> {
    this.cleanupStaleLocations();

    const locations = Array.from(this.locations.values());

    if (followMeOnly) {
      return locations.filter((loc) => loc.followMeMode);
    }

    return locations;
  }

  async deleteLocation(userId: string): Promise<void> {
    this.locations.delete(userId);
  }

  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    if (!this.blocks.has(blockerId)) {
      this.blocks.set(blockerId, new Set());
    }
    this.blocks.get(blockerId)!.add(blockedId);
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    const blocked = this.blocks.get(blockerId);
    if (blocked) {
      blocked.delete(blockedId);
      if (blocked.size === 0) {
        this.blocks.delete(blockerId);
      }
    }
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const blocked = this.blocks.get(blockerId);
    return blocked ? blocked.has(blockedId) : false;
  }

  async getBlockedUsers(blockerId: string): Promise<string[]> {
    const blocked = this.blocks.get(blockerId);
    return blocked ? Array.from(blocked) : [];
  }

  private cleanupStaleLocations(): void {
    const now = Date.now();
    for (const [userId, location] of this.locations.entries()) {
      const age = now - location.timestamp.getTime();
      if (age > this.LOCATION_TTL) {
        this.locations.delete(userId);
      }
    }
  }

  // Test helpers
  clear(): void {
    this.locations.clear();
    this.blocks.clear();
  }

  size(): number {
    return this.locations.size;
  }
}
