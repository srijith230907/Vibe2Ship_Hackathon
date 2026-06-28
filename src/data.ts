export const MAP_CENTER: [number, number] = [12.9716, 77.5946]; // Bengaluru, India

export const achievements = [
  { id: 'first-report', name: 'First Report', description: 'File your first community issue', icon: 'Map', unlocked: false, rarity: 'common' as const },
  { id: 'verifier', name: 'Verifier', description: 'Verify 5 community issues', icon: 'Eye', unlocked: false, progress: 0, rarity: 'common' as const },
  { id: 'night-watch', name: 'Night Watch', description: 'Report an issue after 10 PM', icon: 'Moon', unlocked: false, rarity: 'rare' as const },
  { id: 'early-bird', name: 'Early Bird', description: 'Report an issue before 7 AM', icon: 'Sunrise', unlocked: false, rarity: 'rare' as const },
  { id: 'spotter', name: 'Spotter', description: 'File 10 reports', icon: 'Target', unlocked: false, progress: 0, rarity: 'rare' as const },
  { id: 'community-champion', name: 'Community Champion', description: 'Earn 1,000 Street Cred', icon: 'Crown', unlocked: false, rarity: 'epic' as const },
  { id: 'whistleblower', name: 'Whistleblower', description: 'Report a critical severity issue', icon: 'Siren', unlocked: false, rarity: 'epic' as const },
  { id: 'legend', name: 'Legend', description: 'Earn 5,000 Street Cred', icon: 'Flame', unlocked: false, rarity: 'legendary' as const },
];
