import { useState, useCallback } from 'react';
import {
  Building2,
  Users,
  KeyRound,
  Plus,
  ArrowRight,
  X,
  Crown,
  Wrench,
  User,
  ShieldCheck,
  MapPin,
  Zap,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Trash2,
} from 'lucide-react';
import type { Community, CommunityMember, CommunityIssue, CommunityRole } from '../types';
import type { AuthUser } from '../auth';

interface CommunityViewProps {
  user: AuthUser;
  community: Community | null;
  members: CommunityMember[];
  issues: CommunityIssue[];
  loading: boolean;
  onJoin: (code: string) => Promise<{ success: boolean; error?: string }>;
  onCreate: (name: string, desc: string) => Promise<{ success: boolean; error?: string }>;
  onLeave: () => Promise<{ success: boolean; error?: string }>;
  onSwitch: () => void;
  onDeleteCommunity: () => Promise<{ success: boolean; error?: string }>;
}

const roleConfig: Record<
  CommunityRole,
  { label: string; icon: typeof Crown; color: string; bg: string; border: string }
> = {
  head: {
    label: 'Community Head',
    icon: Crown,
    color: 'text-neon-amber',
    bg: 'bg-neon-amber/10',
    border: 'border-neon-amber/30',
  },
  maintenance: {
    label: 'Maintenance Lead',
    icon: Wrench,
    color: 'text-neon-cyan',
    bg: 'bg-neon-cyan/10',
    border: 'border-neon-cyan/30',
  },
  resident: {
    label: 'Resident',
    icon: User,
    color: 'text-neon-mint',
    bg: 'bg-neon-mint/10',
    border: 'border-neon-mint/30',
  },
};

export function CommunityView({
  user,
  community,
  members,
  issues,
  loading,
  onJoin,
  onCreate,
  onLeave,
  onSwitch,
  onDeleteCommunity,
}: CommunityViewProps) {
  const [showJoin, setShowJoin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleCopyCode = useCallback(() => {
    if (!community) return;
    navigator.clipboard.writeText(community.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [community]);

  const handleDelete = useCallback(async () => {
    setDeleteLoading(true);
    const result = await onDeleteCommunity();
    setDeleteLoading(false);
    if (result.success) setShowDeleteConfirm(false);
  }, [onDeleteCommunity]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-neon-purple animate-spin" />
          <p className="text-sm text-slate-500">Loading community...</p>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <>
        <EmptyCommunityState
          onJoin={() => setShowJoin(true)}
          onCreate={() => setShowCreate(true)}
        />
        {showJoin && (
          <JoinModal
            onClose={() => setShowJoin(false)}
            onJoin={onJoin}
          />
        )}
        {showCreate && (
          <CreateModal
            onClose={() => setShowCreate(false)}
            onCreate={onCreate}
          />
        )}
      </>
    );
  }

  const currentUserMember = members.find((m) => m.user_email === user.email);
  const userRole = currentUserMember?.role || 'resident';
  const isHead = userRole === 'head';
  const issueStats = {
    open: issues.filter((i) => i.status === 'open').length,
    'in-progress': issues.filter((i) => i.status === 'in-progress').length,
    resolved: issues.filter((i) => i.status === 'resolved').length,
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-4 lg:p-6 space-y-5">
        {/* Community header */}
        <div className="glass-strong p-5 lg:p-6 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-neon-purple/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-neon-cyan/8 rounded-full blur-3xl" />
          <div className="relative flex flex-col sm:flex-row items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-purple to-neon-violet flex items-center justify-center shadow-neon-purple shrink-0">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-xl font-bold text-white">{community.name}</h1>
                {roleConfig[userRole] && (() => {
                  const RoleIcon = roleConfig[userRole].icon;
                  return (
                    <span
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${roleConfig[userRole].bg} ${roleConfig[userRole].border} ${roleConfig[userRole].color}`}
                    >
                      <RoleIcon className="w-3 h-3" />
                      {roleConfig[userRole].label}
                    </span>
                  );
                })()}
              </div>
              <p className="text-sm text-slate-400 mt-1">{community.description}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {members.length} members
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {community.boundary_radius}m radius
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={handleCopyCode}
                className="glass px-3 py-2 flex items-center gap-2 text-xs font-mono text-slate-200 hover:text-white hover:border-neon-purple/30 transition group"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-neon-mint" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-neon-purple" />
                )}
                {community.invite_code}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={onSwitch}
                  className="flex-1 text-[11px] text-slate-400 hover:text-neon-cyan transition text-center py-1"
                >
                  Switch community
                </button>
                <button
                  onClick={onLeave}
                  className="flex-1 text-[11px] text-slate-600 hover:text-neon-red transition text-center py-1"
                >
                  Leave
                </button>
              </div>
              {isHead && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-[11px] text-neon-red/60 hover:text-neon-red transition text-center py-1 flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete community
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Issue stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={AlertCircle} label="Open" value={issueStats.open} color="text-neon-red" bg="from-neon-red/10" />
          <StatCard icon={Clock} label="In Progress" value={issueStats['in-progress']} color="text-neon-amber" bg="from-neon-amber/10" />
          <StatCard icon={CheckCircle2} label="Resolved" value={issueStats.resolved} color="text-neon-mint" bg="from-neon-mint/10" />
        </div>

        {/* Community issues preview */}
        {issues.length > 0 && (
          <div>
            <h2 className="font-display text-lg font-bold text-white mb-3">
              Community Issues
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {issues.slice(0, 4).map((issue) => (
                <div key={issue.id} className="glass p-3 flex items-start gap-3">
                  <img
                    src={issue.image}
                    alt={issue.title}
                    className="w-14 h-14 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-200 truncate">{issue.title}</p>
                    <p className="text-[11px] text-slate-500 truncate">{issue.address}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          issue.status === 'open'
                            ? 'bg-neon-red/10 text-neon-red'
                            : issue.status === 'in-progress'
                              ? 'bg-neon-amber/10 text-neon-amber'
                              : 'bg-neon-mint/10 text-neon-mint'
                        }`}
                      >
                        {issue.status === 'in-progress' ? 'In Progress' : issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                      </span>
                      <span className="text-[10px] text-slate-600">SEV {issue.severity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Members directory */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold text-white">Members Directory</h2>
            <span className="text-xs text-slate-500 font-mono">{members.length} active</span>
          </div>
          <div className="glass-strong overflow-hidden">
            {members.map((member, idx) => {
              const role = roleConfig[member.role];
              const RoleIcon = role.icon;
              const isCurrentUser = member.user_email === user.email;
              return (
                <div
                  key={member.id}
                  className={`flex items-center gap-3 px-4 py-3 transition-all ${
                    idx !== members.length - 1 ? 'border-b border-white/[0.04]' : ''
                  } ${isCurrentUser ? 'bg-neon-purple/10' : 'hover:bg-white/[0.02]'}`}
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/[0.08] shrink-0">
                    {member.user_avatar ? (
                      <img
                        src={member.user_avatar}
                        alt={member.user_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/[0.04]">
                        <User className="w-5 h-5 text-slate-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-white truncate">
                        {member.user_name}
                      </p>
                      {isCurrentUser && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neon-purple/20 text-neon-purple uppercase">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{member.user_email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border ${role.bg} ${role.border} ${role.color}`}
                    >
                      <RoleIcon className="w-3 h-3" />
                      {role.label}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-mono text-neon-mint">
                      <Zap className="w-3 h-3" fill="currentColor" />
                      {member.street_cred.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Delete community confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-scale-in">
          <div className="glass-strong w-full max-w-sm p-6 space-y-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-neon-red/10 border border-neon-red/20 flex items-center justify-center mb-3">
                <Trash2 className="w-7 h-7 text-neon-red" />
              </div>
              <h2 className="font-display text-lg font-bold text-white">Delete Community?</h2>
              <p className="text-sm text-slate-400 mt-1">
                This will permanently delete <span className="text-white font-medium">{community.name}</span> and all its data. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/[0.04] text-slate-300 text-sm font-medium hover:bg-white/[0.08] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-neon-red/15 border border-neon-red/30 text-neon-red text-sm font-semibold hover:bg-neon-red/25 transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {deleteLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyCommunityState({
  onJoin,
  onCreate,
}: {
  onJoin: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-4 lg:p-6">
        <div className="text-center mb-8 mt-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-purple/20 to-neon-violet/10 flex items-center justify-center mx-auto mb-4 border border-neon-purple/20">
            <Building2 className="w-8 h-8 text-neon-purple" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Join Your Community</h1>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Create or join an apartment/neighborhood community to start reporting
            hyperlocal issues with your neighbors.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Create */}
          <button
            onClick={onCreate}
            className="glass-strong p-6 text-left group hover:border-neon-purple/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-purple to-neon-violet flex items-center justify-center shadow-neon-purple mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-display text-lg font-bold text-white">Create a Community</h3>
            <p className="text-sm text-slate-500 mt-1">
              Start a new community for your apartment or neighborhood. You'll
              become the Community Head with admin powers.
            </p>
            <div className="flex items-center gap-1 mt-4 text-xs text-neon-purple font-medium">
              Get started
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Join */}
          <button
            onClick={onJoin}
            className="glass-strong p-6 text-left group hover:border-neon-mint/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-mint to-neon-cyan flex items-center justify-center shadow-neon-mint mb-4 group-hover:scale-110 transition-transform">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-display text-lg font-bold text-white">Join via Invite Code</h3>
            <p className="text-sm text-slate-500 mt-1">
              Have an invite code from your community head? Enter it to
              join your neighborhood's issue tracking network.
            </p>
            <div className="flex items-center gap-1 mt-4 text-xs text-neon-mint font-medium">
              Enter code
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function JoinModal({
  onClose,
  onJoin,
}: {
  onClose: () => void;
  onJoin: (code: string) => Promise<{ success: boolean; error?: string }>;
}) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (code.length < 5) {
        setError('Invite code must be at least 5 characters');
        return;
      }
      setLoading(true);
      setError(null);
      const result = await onJoin(code);
      setLoading(false);
      if (!result.success) {
        setError(result.error || 'Failed to join');
      } else {
        onClose();
      }
    },
    [code, onJoin, onClose]
  );

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-scale-in"
      onClick={onClose}
    >
      <div className="glass-strong w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neon-mint to-neon-cyan flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-display text-lg font-bold text-white">Join Community</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-slate-400 mb-4">
          Enter the invite code shared by your Community Head.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="e.g. PREM75"
            maxLength={6}
            autoFocus
            className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-center text-2xl font-mono font-bold tracking-[0.3em] text-white placeholder:text-slate-600 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-neon-mint/40 focus:bg-white/[0.06] transition uppercase"
          />
          {error && (
            <p className="text-xs text-neon-red mt-2 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || code.length < 5}
            className="w-full mt-4 py-3.5 rounded-xl bg-gradient-to-r from-neon-mint to-neon-cyan text-ink-950 font-semibold text-sm hover:shadow-neon-mint transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Join Community
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function CreateModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, desc: string) => Promise<{ success: boolean; error?: string }>;
}) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (name.trim().length < 3) {
        setError('Community name must be at least 3 characters');
        return;
      }
      setLoading(true);
      setError(null);
      const result = await onCreate(name.trim(), desc.trim());
      setLoading(false);
      if (!result.success) {
        setError(result.error || 'Failed to create community');
      } else {
        onClose();
      }
    },
    [name, desc, onCreate, onClose]
  );

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-scale-in"
      onClick={onClose}
    >
      <div className="glass-strong w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neon-purple to-neon-violet flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-display text-lg font-bold text-white">Create Community</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-slate-400 mb-4">
          You'll become the <span className="text-neon-amber font-medium">Community Head</span> with
          admin powers to resolve issues, approve posts, and generate invite codes.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-mono uppercase text-slate-500 tracking-wider mb-1.5 block">
              Community Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Prestige Apartments"
              maxLength={50}
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-neon-purple/40 focus:bg-white/[0.06] transition"
            />
          </div>
          <div>
            <label className="text-[11px] font-mono uppercase text-slate-500 tracking-wider mb-1.5 block">
              Description (optional)
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="A brief description of your community..."
              maxLength={200}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-neon-purple/40 focus:bg-white/[0.06] transition resize-none"
            />
          </div>
          {error && (
            <p className="text-xs text-neon-red flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || name.trim().length < 3}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-violet text-white font-semibold text-sm hover:shadow-neon-purple transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Crown className="w-4 h-4" />
                Create & Become Head
              </>
            )}
          </button>
        </form>
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
  icon: typeof AlertCircle;
  label: string;
  value: number;
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
