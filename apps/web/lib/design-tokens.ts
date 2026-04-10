/**
 * THE HEIST — Design Tokens
 * Tactical dark theme with amber/gold accents.
 */

export const colors = {
  bg: {
    primary: '#0a0a0a',
    secondary: '#111111',
    tertiary: '#1a1a1a',
  },
  border: {
    default: '#2a2a2a',
    active: '#d4a843',
  },
  text: {
    primary: '#f0f0f0',
    secondary: '#888888',
    accent: '#d4a843',
  },
  accent: {
    primary: '#d4a843',
    secondary: '#c49b38',
    glow: 'rgba(212, 168, 67, 0.15)',
  },
  status: {
    success: '#4ade80',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#60a5fa',
  },
  terminal: {
    bg: '#0d0d0d',
    text: '#d4a843',
    cursor: '#d4a843',
  },
  classified: {
    red: '#8b0000',
    bg: 'rgba(139, 0, 0, 0.1)',
  },
} as const;

export const fonts = {
  display: "'Black Ops One', 'Impact', sans-serif",
  body: "'Inter', 'Segoe UI', sans-serif",
  // Note: Droid Sans Mono isn't on Google Fonts. Using Fira Code as mono.
  // Swap to 'Droid Sans Mono' if self-hosting.
  mono: "'Fira Code', 'Droid Sans Mono', monospace",
} as const;

export const spacing = {
  unit: 4,
  borderRadius: '2px',
} as const;

export const ranks = [
  { name: 'Recruit', minXp: 0 },
  { name: 'Operative', minXp: 500 },
  { name: 'Specialist', minXp: 1500 },
  { name: 'Ghost', minXp: 4000 },
  { name: 'Architect', minXp: 10000 },
] as const;

export function getRank(xp: number) {
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (xp >= ranks[i].minXp) return ranks[i];
  }
  return ranks[0];
}

export function getNextRank(xp: number) {
  for (const rank of ranks) {
    if (xp < rank.minXp) return rank;
  }
  return null;
}
