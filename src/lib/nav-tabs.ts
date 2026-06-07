import { MapPin, Zap, Users, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Mobile bottom-nav lenses. Profile lives behind the top-right avatar.
export type Lens = 'map' | 'activity' | 'friends' | 'profile';

export const navTabs: { key: Lens; label: string; icon: LucideIcon; color: string }[] = [
  { key: 'map', label: 'Map', icon: MapPin, color: 'var(--color-red)' },
  { key: 'activity', label: 'Activity', icon: Zap, color: 'var(--color-blue)' },
  { key: 'friends', label: 'Friends', icon: Users, color: 'var(--color-green)' },
  { key: 'profile', label: 'Wrapped', icon: Sparkles, color: 'var(--color-pink)' },
];
