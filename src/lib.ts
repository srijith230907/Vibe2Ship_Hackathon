import type { IssueStatus, IssueCategory } from './types';

export const statusConfig: Record<
  IssueStatus,
  { color: string; ring: string; bg: string; text: string; label: string; hex: string }
> = {
  open: {
    color: 'red',
    ring: 'border-neon-red',
    bg: 'bg-neon-red/10',
    text: 'text-neon-red',
    label: 'Open',
    hex: '#f87171',
  },
  'in-progress': {
    color: 'amber',
    ring: 'border-neon-amber',
    bg: 'bg-neon-amber/10',
    text: 'text-neon-amber',
    label: 'In Progress',
    hex: '#fbbf24',
  },
  resolved: {
    color: 'mint',
    ring: 'border-neon-mint',
    bg: 'bg-neon-mint/10',
    text: 'text-neon-mint',
    label: 'Resolved',
    hex: '#34d399',
  },
};

export const categoryConfig: Record<
  IssueCategory,
  { emoji: string; gradient: string }
> = {
  Pothole: { emoji: '🕳️', gradient: 'from-orange-500/20 to-red-500/20' },
  'Broken Streetlight': { emoji: '💡', gradient: 'from-amber-500/20 to-yellow-500/20' },
  'Trash Accumulation': { emoji: '🗑️', gradient: 'from-lime-500/20 to-green-500/20' },
  Graffiti: { emoji: '🎨', gradient: 'from-pink-500/20 to-purple-500/20' },
  'Water Leak': { emoji: '💧', gradient: 'from-cyan-500/20 to-blue-500/20' },
  'Fallen Tree': { emoji: '🌳', gradient: 'from-green-500/20 to-emerald-500/20' },
  'Illegal Parking': { emoji: '🚗', gradient: 'from-slate-500/20 to-gray-500/20' },
  'Damaged Sidewalk': { emoji: '🚧', gradient: 'from-yellow-500/20 to-orange-500/20' },
};

const defaultCategory = { emoji: '📍', gradient: 'from-slate-500/20 to-gray-500/20' };

export function getCategory(category: string): { emoji: string; gradient: string } {
  return (categoryConfig as Record<string, { emoji: string; gradient: string }>)[category] || defaultCategory;
}

export function severityLabel(score: number): { label: string; color: string } {
  if (score >= 8) return { label: 'Critical', color: 'text-neon-red' };
  if (score >= 6) return { label: 'High', color: 'text-neon-amber' };
  if (score >= 4) return { label: 'Moderate', color: 'text-neon-cyan' };
  return { label: 'Low', color: 'text-neon-mint' };
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
