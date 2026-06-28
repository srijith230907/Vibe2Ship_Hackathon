import { useState, useEffect } from 'react';
import {
  Flame,
  MapPin,
  BadgeCheck,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Target,
  Eye,
  CheckCircle2,
  Crown,
  Siren,
  Moon,
  Sunrise,
  CircleDot,
  Map as MapIcon,
  Lock,
} from 'lucide-react';
import { useAuth } from '../auth';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import type { Achievement } from '../types';
import { achievements } from '../data';

const iconMap: Record<string, typeof Flame> = {
  Flame,
  Map: MapIcon,
  BadgeCheck,
  Crown,
  Siren,
  Moon,
  Sunrise,
  CircleDot,
  Trophy,
  Eye,
  Target,
};

const rarityConfig: Record<
  Achievement['rarity'],
  { ring: string; glow: string; label: string; text: string }
> = {
  common: {
    ring: 'border-slate-500/30',
    glow: '',
    label: 'Common',
    text: 'text-slate-400',
  },
  rare: {
    ring: 'border-neon-cyan/40',
    glow: 'shadow-neon-cyan',
    label: 'Rare',
    text: 'text-neon-cyan',
  },
  epic: {
    ring: 'border-neon-purple/40',
    glow: 'shadow-neon-purple',
    label: 'Epic',
    text: 'text-neon-purple',
  },
  legendary: {
    ring: 'border-neon-amber/40',
    glow: 'shadow-neon-purple',
    label: 'Legendary',
    text: 'text-neon-amber',
  },
};

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  email: string;
  streetCred: number;
  reports: number;
  verifications: number;
}

export function ProfileView() {
  const { user: authUser } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('streetCred', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const items: LeaderboardUser[] = snap.docs.map((d) => ({
        id: d.id,
        name: d.data().name || 'Anonymous',
        avatar: d.data().photoURL || d.data().avatar || '',
        email: d.data().email || '',
        streetCred: d.data().streetCred || 0,
        reports: d.data().reports || 0,
        verifications: d.data().verifications || 0,
      }));
      setLeaderboard(items);
    });
    return unsub;
  }, []);

  const user = {
    name: authUser?.name || 'Anonymous',
    avatar: authUser?.avatar || '',
    email: authUser?.email || '',
    handle: authUser?.email?.split('@')[0] || 'user',
    level: Math.floor((authUser?.streetCred || 0) / 500) + 1,
    streetCred: authUser?.streetCred || 0,
    nextLevelAt: (Math.floor((authUser?.streetCred || 0) / 500) + 1) * 500,
    reports: 0,
    verifications: 0,
    resolved: 0,
    streak: 1,
    joinDate: 'Recently',
  };

  const levelProgress = Math.min((user.streetCred / user.nextLevelAt) * 100, 100);
  const credToNext = user.nextLevelAt - user.streetCred;
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-4 lg:p-6 space-y-5">
        {/* Profile header */}
        <div className="glass-strong p-5 lg:p-6 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-neon-purple/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-neon-mint/8 rounded-full blur-3xl" />
          <div className="relative flex flex-col sm:flex-row items-start gap-5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-neon-purple/40 shadow-neon-purple bg-white/[0.04]">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Crown className="w-8 h-8 text-slate-500" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-gradient-to-br from-neon-purple to-neon-violet flex items-center justify-center text-white text-xs font-bold border-2 border-ink-900">
                {user.level}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold text-white">{user.name}</h1>
                <BadgeCheck className="w-4 h-4 text-neon-mint" />
              </div>
              <p className="text-sm text-slate-500 font-mono">@{user.handle}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs text-slate-400">
                  Member since {user.joinDate}
                </span>
                <span className="text-slate-600">·</span>
                <span className="flex items-center gap-1 text-xs text-neon-amber">
                  <Flame className="w-3 h-3" />
                  {user.streak} day streak
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-mono uppercase text-slate-500 tracking-wider">
                Street Cred
              </p>
              <p className="font-display text-3xl font-bold text-white neon-text-purple">
                {user.streetCred.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Level progress bar */}
          <div className="relative mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-300">
                Level {user.level}
              </span>
              <span className="text-xs text-slate-500">
                {credToNext.toLocaleString()} cred to Level {user.level + 1}
              </span>
            </div>
            <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden relative">
              <div
                className="h-full rounded-full bg-gradient-to-r from-neon-purple via-neon-violet to-neon-mint transition-all duration-700 relative"
                style={{ width: `${levelProgress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-glow-pulse rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={MapPin}
            label="Reports Filed"
            value={user.reports}
            color="text-neon-purple"
            bg="from-neon-purple/10"
          />
          <StatCard
            icon={BadgeCheck}
            label="Verifications"
            value={user.verifications}
            color="text-neon-mint"
            bg="from-neon-mint/10"
          />
          <StatCard
            icon={CheckCircle2}
            label="Issues Resolved"
            value={user.resolved}
            color="text-neon-cyan"
            bg="from-neon-cyan/10"
          />
          <StatCard
            icon={Trophy}
            label="Badges Unlocked"
            value={`${unlockedCount}/${achievements.length}`}
            color="text-neon-amber"
            bg="from-neon-amber/10"
          />
        </div>

        {/* Achievements */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold text-white">Achievements</h2>
            <span className="text-xs text-slate-500 font-mono">
              {unlockedCount} / {achievements.length} unlocked
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {achievements.map((ach) => {
              const Icon = iconMap[ach.icon] || Star;
              const rarity = rarityConfig[ach.rarity];
              return (
                <div
                  key={ach.id}
                  className={`glass p-4 text-center relative overflow-hidden transition-all ${
                    ach.unlocked
                      ? `${rarity.ring} ${rarity.glow} hover:scale-[1.03]`
                      : 'opacity-50 border-white/[0.06]'
                  }`}
                >
                  {ach.unlocked && (
                    <div className="absolute top-2 right-2">
                      <span
                        className={`text-[8px] font-mono uppercase tracking-wider ${rarity.text}`}
                      >
                        {rarity.label}
                      </span>
                    </div>
                  )}
                  <div
                    className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-2 ${
                      ach.unlocked
                        ? 'bg-gradient-to-br from-white/[0.08] to-white/[0.02]'
                        : 'bg-white/[0.02]'
                    }`}
                  >
                    {ach.unlocked ? (
                      <Icon className={`w-6 h-6 ${rarity.text}`} />
                    ) : (
                      <Lock className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                  <p
                    className={`text-xs font-semibold ${ach.unlocked ? 'text-white' : 'text-slate-500'}`}
                  >
                    {ach.name}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                    {ach.description}
                  </p>
                  {!ach.unlocked && ach.progress !== undefined && (
                    <div className="mt-2">
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-neon-purple to-neon-mint"
                          style={{ width: `${ach.progress}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-slate-600 mt-1 font-mono">
                        {ach.progress}%
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Leaderboard */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold text-white">
              Neighborhood Leaderboard
            </h2>
            <span className="text-xs text-slate-500 font-mono">Live from Firestore</span>
          </div>
          <div className="glass-strong overflow-hidden">
            {leaderboard.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-500">No users yet. Be the first to earn Street Cred!</p>
              </div>
            )}
            {leaderboard.map((entry, idx) => {
              const isCurrentUser = entry.email === user.email;
              const trend: 'up' | 'down' | 'same' = 'up';
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 px-4 py-3 transition-all ${
                    idx !== leaderboard.length - 1 ? 'border-b border-white/[0.04]' : ''
                  } ${isCurrentUser ? 'bg-neon-purple/10' : 'hover:bg-white/[0.02]'}`}
                >
                  <div className="w-8 text-center shrink-0">
                    {idx < 3 ? (
                      <span
                        className={`text-lg font-bold ${
                          idx === 0
                            ? 'text-neon-amber'
                            : idx === 1
                              ? 'text-slate-300'
                              : 'text-neon-purple'
                        }`}
                      >
                        {idx === 0 ? '👑' : idx + 1}
                      </span>
                    ) : (
                      <span className="text-sm font-mono text-slate-500">
                        {idx + 1}
                      </span>
                    )}
                  </div>
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/[0.08] shrink-0 bg-white/[0.04]">
                    {entry.avatar ? (
                      <img
                        src={entry.avatar}
                        alt={entry.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Crown className="w-5 h-5 text-slate-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-white truncate">
                        {entry.name}
                      </p>
                      {isCurrentUser && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neon-purple/20 text-neon-purple uppercase">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {entry.reports} reports · {entry.verifications} verifications
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <TrendIcon trend={trend} />
                    <span className="text-sm font-mono font-bold text-neon-mint">
                      {entry.streetCred.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: typeof Flame;
  label: string;
  value: string | number;
  color: string;
  bg: string;
}) {
  return (
    <div className={`glass p-4 bg-gradient-to-br ${bg} to-transparent`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-[11px] font-mono uppercase text-slate-500 tracking-wider">
          {label}
        </span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'same' }) {
  if (trend === 'up')
    return <TrendingUp className="w-3.5 h-3.5 text-neon-mint" />;
  if (trend === 'down')
    return <TrendingDown className="w-3.5 h-3.5 text-neon-red" />;
  return <Minus className="w-3.5 h-3.5 text-slate-500" />;
}
