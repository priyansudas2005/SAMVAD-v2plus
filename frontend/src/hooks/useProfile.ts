import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types/profile';
import { ProfileService } from '../services/profileService';

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    return ProfileService.getProfile();
  });
  const [loading, setLoading] = useState<boolean>(false);

  // Sync profile state with localStorage changes
  const reloadProfile = useCallback(() => {
    const current = ProfileService.getProfile();
    setProfile(current);
  }, []);

  useEffect(() => {
    // Touch last login on mount if profile exists
    if (profile) {
      const updated = ProfileService.touchLastLogin();
      if (updated) setProfile(updated);
    }

    const handleProfileUpdate = () => {
      reloadProfile();
    };

    window.addEventListener('samvad_profile_updated', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);

    return () => {
      window.removeEventListener('samvad_profile_updated', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, []);

  const createProfile = useCallback((name: string) => {
    setLoading(true);
    const newProf = ProfileService.createProfile(name);
    setProfile(newProf);
    setLoading(false);
    return newProf;
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setLoading(true);
    const updated = ProfileService.updateProfile(updates);
    setProfile(updated);
    setLoading(false);
    return updated;
  }, []);

  const logout = useCallback(() => {
    setLoading(true);
    ProfileService.logout();
    setProfile(null);
    setLoading(false);
  }, []);

  const initials = profile ? ProfileService.getInitials(profile.name) : '';

  return {
    profile,
    loading,
    initials,
    hasProfile: !!profile,
    createProfile,
    updateProfile,
    logout,
    reloadProfile
  };
};
