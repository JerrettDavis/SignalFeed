/**
 * Location Sharing Domain
 * Manages real-time location sharing between users
 */

export interface UserLocation {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number; // meters
  heading?: number; // degrees
  speed?: number; // m/s
  timestamp: Date;
  followMeMode: boolean;
}

export interface LocationBlock {
  blockerId: string; // User who is blocking
  blockedId: string; // User who is blocked
  createdAt: Date;
}

export interface LocationSharingRepository {
  // Location tracking
  updateLocation(location: UserLocation): Promise<void>;
  getLocation(userId: string): Promise<UserLocation | null>;
  getActiveLocations(followMeOnly: boolean): Promise<UserLocation[]>;
  deleteLocation(userId: string): Promise<void>;

  // Blocking
  blockUser(blockerId: string, blockedId: string): Promise<void>;
  unblockUser(blockerId: string, blockedId: string): Promise<void>;
  isBlocked(blockerId: string, blockedId: string): Promise<boolean>;
  getBlockedUsers(blockerId: string): Promise<string[]>;
}

/**
 * Check if user can see another user's location
 */
export const canSeeLocation = async (
  viewerId: string,
  targetUserId: string,
  targetLocation: UserLocation | null,
  repository: LocationSharingRepository
): Promise<boolean> => {
  if (!targetLocation) return false;
  if (viewerId === targetUserId) return true; // Can always see own location
  if (!targetLocation.followMeMode) return false; // Target must have Follow Me enabled

  // Check if target has blocked viewer
  const isBlocked = await repository.isBlocked(targetUserId, viewerId);
  return !isBlocked;
};
