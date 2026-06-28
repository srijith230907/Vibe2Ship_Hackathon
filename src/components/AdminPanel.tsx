import { useState, useEffect, useCallback } from 'react';
import {
  Trash2,
  UserX,
  Coins,
  Plus,
  Minus,
  Crown,
  AlertTriangle,
  Loader2,
  Users,
  Building2,
  CheckCircle2,
  Zap,
  Search,
} from 'lucide-react';
import { db } from '../firebase';
import {
  collection,
  query,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  getDocs,
  orderBy,
} from 'firebase/firestore';
import { useAuth } from '../auth';

interface CommunityData {
  id: string;
  name: string;
  invite_code: string;
  memberCount: number;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  photoURL: string;
  streetCred: number;
  isAdmin: boolean;
  isBanned: boolean;
}

export function AdminPanel() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<CommunityData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'communities' | 'users' | 'economy'>('communities');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const unsubCommunities = onSnapshot(collection(db, 'communities'), (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CommunityData));
      setCommunities(items);
    });

    const unsubUsers = onSnapshot(query(collection(db, 'users'), orderBy('streetCred', 'desc')), (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserData));
      setUsers(items);
    });

    const unsubReports = onSnapshot(query(collection(db, 'reports'), orderBy('createdAt', 'desc')), (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setReports(items);
      setLoading(false);
    });

    return () => {
      unsubCommunities();
      unsubUsers();
      unsubReports();
    };
  }, []);

  const deleteCommunity = useCallback(async (id: string) => {
    setActionLoading(id);
    try {
      // Delete all members
      const membersSnap = await getDocs(collection(db, 'community_members'));
      const memberDeletions = membersSnap.docs
        .filter((d) => d.data().community_id === id)
        .map((d) => deleteDoc(doc(db, 'community_members', d.id)));
      await Promise.all(memberDeletions);

      // Delete all issues
      const issuesSnap = await getDocs(collection(db, 'community_issues'));
      const issueDeletions = issuesSnap.docs
        .filter((d) => d.data().community_id === id)
        .map((d) => deleteDoc(doc(db, 'community_issues', d.id)));
      await Promise.all(issueDeletions);

      // Delete community
      await deleteDoc(doc(db, 'communities', id));
      showToast('Community deleted successfully');
    } catch {
      showToast('Failed to delete community');
    }
    setActionLoading(null);
  }, [showToast]);

  const deleteReport = useCallback(async (id: string) => {
    setActionLoading(`report-${id}`);
    try {
      await deleteDoc(doc(db, 'reports', id));
      showToast('Report deleted');
    } catch {
      showToast('Failed to delete report');
    }
    setActionLoading(null);
  }, [showToast]);

  const toggleBan = useCallback(async (id: string, isBanned: boolean) => {
    setActionLoading(`ban-${id}`);
    try {
      await updateDoc(doc(db, 'users', id), { isBanned: !isBanned });
      showToast(isBanned ? 'User unbanned' : 'User banned');
    } catch {
      showToast('Failed to update ban status');
    }
    setActionLoading(null);
  }, [showToast]);

  const adjustPoints = useCallback(async (id: string, current: number, amount: number) => {
    setActionLoading(`points-${id}`);
    try {
      await updateDoc(doc(db, 'users', id), { streetCred: Math.max(0, current + amount) });
      showToast(`Adjusted points by ${amount > 0 ? '+' : ''}${amount}`);
    } catch {
      showToast('Failed to adjust points');
    }
    setActionLoading(null);
  }, [showToast]);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-neon-purple animate-spin" />
          <p className="text-sm text-slate-500">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-4 lg:p-6 space-y-5">
        {/* Header */}
        <div className="glass-strong p-5 relative overflow-hidden border-neon-red/30">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-neon-red/10 rounded-full blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-red to-orange-500 flex items-center justify-center shadow-neon-red">
              <Crown className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-white">Admin Panel</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neon-red/20 text-neon-red border border-neon-red/30">
                  OMNIPOTENT
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Absolute control over communities, users, and economy. Signed in as{' '}
                <span className="text-neon-amber font-medium">{user?.name}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'communities' as const, label: 'Communities', icon: Building2 },
            { id: 'users' as const, label: 'User Moderation', icon: Users },
            { id: 'economy' as const, label: 'Economy Control', icon: Coins },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-gradient-to-r from-neon-red/20 to-orange-500/20 text-white border border-neon-red/30'
                    : 'glass text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Communities Tab */}
        {selectedTab === 'communities' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-white">
                Community Management
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                {communities.length} communities
              </span>
            </div>
            <div className="space-y-3">
              {communities.map((comm) => (
                <div key={comm.id} className="glass-strong p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-purple to-neon-violet flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{comm.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Code: {comm.invite_code} · {comm.memberCount || 0} members
                    </p>
                  </div>
                  <button
                    onClick={() => deleteCommunity(comm.id)}
                    disabled={actionLoading === comm.id}
                    className="px-3 py-2 rounded-lg bg-neon-red/10 border border-neon-red/20 text-neon-red text-xs font-medium hover:bg-neon-red/20 transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {actionLoading === comm.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    Delete
                  </button>
                </div>
              ))}
              {communities.length === 0 && (
                <div className="glass p-8 text-center">
                  <p className="text-sm text-slate-500">No communities found.</p>
                </div>
              )}
            </div>

            {/* Reports cleanup */}
            <div className="mt-6">
              <h2 className="font-display text-lg font-bold text-white mb-3">
                Reports Cleanup
              </h2>
              <div className="space-y-2">
                {reports.slice(0, 10).map((report) => (
                  <div key={report.id} className="glass p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-white/[0.04] flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4 text-neon-amber" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">{report.title || 'Untitled'}</p>
                      <p className="text-[11px] text-slate-500">{report.category || 'Unknown'}</p>
                    </div>
                    <button
                      onClick={() => deleteReport(report.id)}
                      disabled={actionLoading === `report-${report.id}`}
                      className="px-2.5 py-1.5 rounded bg-neon-red/10 text-neon-red text-[11px] hover:bg-neon-red/20 transition flex items-center gap-1 disabled:opacity-50"
                    >
                      {actionLoading === `report-${report.id}` ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {selectedTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-white">
                User Moderation
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                {users.length} registered users
              </span>
            </div>
            <div className="glass p-2 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-500 ml-2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users by name or email..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-600 focus:outline-none py-2"
              />
            </div>
            <div className="space-y-2">
              {filteredUsers.map((u) => (
                <div key={u.id} className="glass-strong p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/[0.08] shrink-0 bg-white/[0.04]">
                    {u.photoURL ? (
                      <img src={u.photoURL} alt={u.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-slate-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{u.name}</p>
                      {u.isAdmin && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neon-red/20 text-neon-red border border-neon-red/30">
                          ADMIN
                        </span>
                      )}
                      {u.isBanned && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
                          BANNED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="flex items-center gap-1 text-xs font-mono text-neon-mint">
                      <Zap className="w-3 h-3" fill="currentColor" />
                      {u.streetCred || 0}
                    </span>
                    <button
                      onClick={() => toggleBan(u.id, !!u.isBanned)}
                      disabled={actionLoading === `ban-${u.id}`}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50 ${
                        u.isBanned
                          ? 'bg-neon-mint/10 text-neon-mint border border-neon-mint/20 hover:bg-neon-mint/20'
                          : 'bg-neon-red/10 text-neon-red border border-neon-red/20 hover:bg-neon-red/20'
                      }`}
                    >
                      {actionLoading === `ban-${u.id}` ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserX className="w-3.5 h-3.5" />
                      )}
                      {u.isBanned ? 'Unban' : 'Ban'}
                    </button>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="glass p-8 text-center">
                  <p className="text-sm text-slate-500">No users match your search.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Economy Tab */}
        {selectedTab === 'economy' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-white">
                Economy Control
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                {users.length} user wallets
              </span>
            </div>
            <div className="glass p-2 flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-slate-500 ml-2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-600 focus:outline-none py-2"
              />
            </div>
            <div className="space-y-2">
              {filteredUsers.map((u) => (
                <div key={u.id} className="glass-strong p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/[0.08] shrink-0 bg-white/[0.04]">
                    {u.photoURL ? (
                      <img src={u.photoURL} alt={u.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-slate-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{u.name}</p>
                    <p className="text-[11px] text-slate-500">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-mono font-bold text-neon-mint">
                      {u.streetCred || 0} SC
                    </span>
                    <button
                      onClick={() => adjustPoints(u.id, u.streetCred || 0, -50)}
                      disabled={actionLoading === `points-${u.id}`}
                      className="w-8 h-8 rounded-lg bg-neon-red/10 border border-neon-red/20 text-neon-red flex items-center justify-center hover:bg-neon-red/20 transition disabled:opacity-50"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => adjustPoints(u.id, u.streetCred || 0, 50)}
                      disabled={actionLoading === `points-${u.id}`}
                      className="w-8 h-8 rounded-lg bg-neon-mint/10 border border-neon-mint/20 text-neon-mint flex items-center justify-center hover:bg-neon-mint/20 transition disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => adjustPoints(u.id, u.streetCred || 0, 1000)}
                      disabled={actionLoading === `points-${u.id}`}
                      className="px-2 py-1.5 rounded-lg bg-neon-amber/10 border border-neon-amber/20 text-neon-amber text-[10px] font-medium hover:bg-neon-amber/20 transition disabled:opacity-50"
                    >
                      +1K
                    </button>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="glass p-8 text-center">
                  <p className="text-sm text-slate-500">No users match your search.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[2000] animate-slide-in">
          <div className="glass-strong px-5 py-3.5 flex items-center gap-3 border-neon-mint/30">
            <CheckCircle2 className="w-4 h-4 text-neon-mint" />
            <p className="text-sm text-slate-200 font-medium">{toast}</p>
          </div>
        </div>
      )}
    </div>
  );
}
