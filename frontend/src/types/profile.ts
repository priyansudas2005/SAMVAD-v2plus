export interface UserProfile {
  id: string;
  name: string;
  created_at: string;
  last_login: string;
  avatar_color?: string;
  theme?: 'dark' | 'light' | 'system';
}

export interface ProfileServiceResponse {
  success: boolean;
  profile?: UserProfile | null;
  error?: string;
}
