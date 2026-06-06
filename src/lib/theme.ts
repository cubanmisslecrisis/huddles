// Brand-color helpers — resolve a semantic color name to its CSS token.

export type BrandColor =
  | 'pink'
  | 'blue'
  | 'green'
  | 'orange'
  | 'yellow'
  | 'red'
  | 'purple'
  | 'warmth';

const brandColors: Record<BrandColor, string> = {
  pink: 'var(--color-pink)',
  blue: 'var(--color-blue)',
  green: 'var(--color-green)',
  orange: 'var(--color-orange)',
  yellow: 'var(--color-yellow)',
  red: 'var(--color-red)',
  purple: 'var(--color-purple)',
  warmth: 'var(--color-warmth)',
};

export function brandColor(color: BrandColor): string {
  return brandColors[color];
}

export type PinColor = 'yellow' | 'pink' | 'blue' | 'green';
export function pinColor(color: PinColor): string {
  return brandColors[color];
}

// Our emergent huddles don't have the skeleton's blue/orange tag — derive an accent
// from the live state machine status instead.
export function huddleStatusColor(status: string): string {
  if (status === 'active') return brandColors.blue;
  if (status === 'cooling') return brandColors.purple;
  return brandColors.orange; // candidate / forming
}

export function huddleStatusLabel(status: string): string {
  if (status === 'active') return 'Active Huddle';
  if (status === 'cooling') return 'Cooling';
  if (status === 'candidate') return 'Forming';
  return status;
}

// Dark text that reads on the bright yellow brand color.
export const onYellow = '#3a2c00';
