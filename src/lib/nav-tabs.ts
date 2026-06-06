import { MapPin, Zap, Users, Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Mobile bottom-nav lenses. The skeleton's "Saved" slot is replaced by our real
// Rankings/leaderboard; Profile lives behind the top-right avatar instead.
export type Lens = 'map' | 'activity' | 'friends' | 'rankings';

export const navTabs: { key: Lens; label: string; icon: LucideIcon; color: string }[] = [
  { key: 'map', label: 'Map', icon: MapPin, color: 'var(--color-red)' },
  { key: 'activity', label: 'Activity', icon: Zap, color: 'var(--color-blue)' },
  { key: 'friends', label: 'Friends', icon: Users, color: 'var(--color-green)' },
  { key: 'rankings', label: 'Ranks', icon: Trophy, color: 'var(--color-pink)' },
];
