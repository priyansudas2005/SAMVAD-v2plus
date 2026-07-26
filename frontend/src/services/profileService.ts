import { UserProfile } from '../types/profile';

const STORAGE_KEY = 'samvad_user_profile';

export class ProfileService {
  /**
   * Retrieves the current user profile from local storage.
   */
  public static getProfile(): UserProfile | null {
    try {
      const rawData = localStorage.getItem(STORAGE_KEY);
      if (!rawData) return null;
      return JSON.parse(rawData) as UserProfile;
    } catch (error) {
      console.error('[ProfileService] Failed to read user profile:', error);
      return null;
    }
  }

  /**
   * Saves a newly created user profile.
   */
  public static createProfile(name: string): UserProfile {
    const now = new Date().toISOString();
    const newProfile: UserProfile = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: name.trim(),
      created_at: now,
      last_login: now,
      avatar_color: 'from-violet-600 to-indigo-600',
      theme: 'dark'
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
    } catch (error) {
      console.error('[ProfileService] Failed to save new user profile:', error);
    }

    return newProfile;
  }

  /**
   * Updates an existing profile's display name or settings.
   */
  public static updateProfile(updates: Partial<UserProfile>): UserProfile | null {
    const existing = this.getProfile();
    if (!existing) return null;

    const updatedProfile: UserProfile = {
      ...existing,
      ...updates,
      name: updates.name ? updates.name.trim() : existing.name,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
      // Dispatch storage event for active tabs/hooks
      window.dispatchEvent(new Event('samvad_profile_updated'));
    } catch (error) {
      console.error('[ProfileService] Failed to update user profile:', error);
    }

    return updatedProfile;
  }

  /**
   * Records a user login timestamp without modifying name or creation date.
   */
  public static touchLastLogin(): UserProfile | null {
    return this.updateProfile({ last_login: new Date().toISOString() });
  }

  /**
   * Logs out the user by clearing the active session profile from localStorage.
   * Keeps meetings, audio files, and app parameters completely intact.
   */
  public static logout(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event('samvad_profile_updated'));
    } catch (error) {
      console.error('[ProfileService] Failed to clear user session profile:', error);
    }
  }

  /**
   * Deletes the user profile completely.
   */
  public static deleteProfile(): void {
    this.logout();
  }

  /**
   * Helper to generate 1-2 letter uppercase initials from display name.
   */
  public static getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
