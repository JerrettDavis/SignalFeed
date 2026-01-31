/**
 * User Settings Domain
 * Manages user preferences and privacy settings
 */

export interface UserSettings {
  userId: string;
  notificationsEnabled: boolean;
  locationSharingEnabled: boolean;
  followMeMode: boolean; // Allow others to see your live location
  publicProfile: boolean;
  theme: "light" | "dark" | "auto";
  mapStyle: "standard" | "satellite" | "terrain";
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettingsUpdate {
  notificationsEnabled?: boolean;
  locationSharingEnabled?: boolean;
  followMeMode?: boolean;
  publicProfile?: boolean;
  theme?: "light" | "dark" | "auto";
  mapStyle?: "standard" | "satellite" | "terrain";
}

export interface UserSettingsRepository {
  save(settings: UserSettings): Promise<void>;
  findByUserId(userId: string): Promise<UserSettings | null>;
  update(userId: string, updates: UserSettingsUpdate): Promise<UserSettings>;
  delete(userId: string): Promise<void>;
}

export const createDefaultSettings = (userId: string): UserSettings => ({
  userId,
  notificationsEnabled: false,
  locationSharingEnabled: false,
  followMeMode: false,
  publicProfile: true,
  theme: "auto",
  mapStyle: "standard",
  createdAt: new Date(),
  updatedAt: new Date(),
});
