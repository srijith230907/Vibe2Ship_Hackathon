import { Map, Camera, Trophy, Zap, X, Building2, LogOut, History, ShieldCheck } from 'lucide-react';
import type { AuthUser } from '../auth';

export type View = 'map' | 'report' | 'history' | 'profile' | 'community' | 'admin';

interface SidebarProps {
  current: View;
  onNavigate: (view: View) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  user: AuthUser | null;
  communityName: string | null;
  onSignOut: () => void;
}

const navItems: { id: View; label: string; icon: typeof Map; description: string; adminOnly?: boolean }[] = [
  { id: 'map', label: 'Live Map', icon: Map, description: 'Community issues' },
  { id: 'report', label: 'Snap & Report', icon: Camera, description: 'Report a problem' },
  { id: 'history', label: 'My Reports', icon: History, description: 'Your filed reports' },
  { id: 'community', label: 'My Community', icon: Building2, description: 'Apartment & members' },
  { id: 'profile', label: 'Profile', icon: Trophy, description: 'Your stats & badges' },
  { id: 'admin', label: 'Admin Panel', icon: ShieldCheck, description: 'Srijith Controls', adminOnly: true },
];

export function Sidebar({ current, onNavigate, mobileOpen, onCloseMobile, user, communityName, onSignOut }: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 z-50 flex flex-col gap-2 p-4 transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } bg-ink-900/80 backdrop-blur-2xl border-r border-white/[0.06]`}
      >
        <div className="flex items-center justify-between px-2 py-3">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-neon-purple to-neon-violet flex items-center justify-center shadow-neon-purple">
              <Zap className="w-6 h-6 text-white" fill="white" />
              <div className="absolute inset-0 rounded-xl bg-neon-purple/30 animate-glow-pulse -z-10" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-white tracking-tight">
                CivicSnap
              </h1>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                Snap · Map · Fix
              </p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1.5 mt-4">
          {navItems.filter((item) => !item.adminOnly || user?.isAdmin).map((item) => {
            const Icon = item.icon;
            const active = current === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-white/[0.08] border border-white/[0.12]'
                    : 'hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-neon-purple to-neon-mint" />
                )}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                    active
                      ? 'bg-gradient-to-br from-neon-purple/30 to-neon-violet/20 text-neon-purple'
                      : 'bg-white/[0.04] text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p
                    className={`text-sm font-semibold ${
                      active ? 'text-white' : 'text-slate-300'
                    }`}
                  >
                    {item.label}
                  </p>
                  <p className="text-[11px] text-slate-500">{item.description}</p>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          {user && (
            <div className="glass p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg overflow-hidden border border-white/[0.08] shrink-0 bg-white/[0.04]">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Zap className="w-4 h-4 text-slate-500" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
              </div>
              <button
                onClick={onSignOut}
                className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-slate-400 hover:text-neon-red transition shrink-0"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="glass p-4 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-neon-mint/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-neon-mint animate-pulse" />
                <p className="text-[11px] font-mono text-neon-mint uppercase tracking-wider">
                  {communityName ? communityName : 'No community'}
                </p>
              </div>
              <p className="text-sm text-slate-300 font-medium">
                {communityName ? 'Community active' : 'Join a community'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {communityName ? 'Issues scoped to your area' : 'See My Community tab'}
              </p>
            </div>
          </div>
          <p className="text-[10px] text-slate-600 text-center font-mono">
            v2.4 · Hackathon Build
          </p>
        </div>
      </aside>
    </>
  );
}
