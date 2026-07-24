export interface SpeakerProfile {
  originalLabel: string;
  displayName: string;
  avatarInitials: string;
  accentColor: string;
  role: 'Host' | 'Manager' | 'Client' | 'Guest' | 'Observer' | string;
  notes?: string;
}

export type SpeakerRole = 'Host' | 'Manager' | 'Client' | 'Guest' | 'Observer' | 'Participant';

export const SPEAKER_ROLES: SpeakerRole[] = ['Host', 'Manager', 'Client', 'Guest', 'Observer', 'Participant'];

export function getInitials(name: string): string {
  if (!name) return 'SP';
  const clean = name.replace(/^SPEAKER_/i, '').trim();
  const parts = clean.split(/[\s_]+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (clean.length >= 2) {
    return clean.substring(0, 2).toUpperCase();
  }
  return clean.substring(0, 1).toUpperCase();
}
