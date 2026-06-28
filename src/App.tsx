import { useState, useCallback, useMemo } from 'react';
import { Menu, Zap, ShieldAlert } from 'lucide-react';
import { AuthProvider, useAuth } from './auth';
import { useCommunity } from './useCommunity';
import { Sidebar } from './components/Sidebar';
import type { View } from './components/Sidebar';
import { MapDashboard } from './components/MapDashboard';
import { ReportForm } from './components/ReportForm';
import { ProfileView } from './components/ProfileView';
import { CommunityView } from './components/CommunityView';
import { ReportsHistoryView } from './components/ReportsHistoryView';
import { AdminPanel } from './components/AdminPanel';
import { IssueModal } from './components/IssueModal';
import { LoginScreen } from './components/LoginScreen';
import { MAP_CENTER } from './data';
import { communityIssueToMapIssue, type MapIssue, type IssueStatus } from './types';

type StatusFilter = 'all' | IssueStatus;

function AppContent() {
  const { user, signOut } = useAuth();
  const community = useCommunity(user);

  const [view, setView] = useState<View>('map');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<MapIssue | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [verifiedIssues, setVerifiedIssues] = useState<Set<string>>(new Set());
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Build the issue list for the map: community-scoped if joined, empty otherwise
  const mapIssues: MapIssue[] = useMemo(() => {
    if (community.currentCommunity && community.issues.length > 0) {
      return community.issues.map(communityIssueToMapIssue);
    }
    return [];
  }, [community.currentCommunity, community.issues]);

  const handleNavigate = useCallback((v: View) => {
    setView(v);
    setMobileNavOpen(false);
  }, []);

  const handleVerify = useCallback(
    (issue: MapIssue) => {
      setVerifiedIssues((prev) => new Set(prev).add(issue.id));
      showToast(`Verified "${issue.title}" — +10 Street Cred!`);
    },
    [showToast]
  );

  const handleLocate = useCallback(() => {
    if (community.currentCommunity) {
      setCoordinates({
        lat: community.currentCommunity.center_lat,
        lng: community.currentCommunity.center_lng,
      });
      showToast(`Location captured: ${community.currentCommunity.name}`);
    } else {
      setCoordinates({ lat: MAP_CENTER[0], lng: MAP_CENTER[1] });
      showToast('Location captured: Bengaluru, India');
    }
  }, [community.currentCommunity, showToast]);

  const handleJoin = useCallback(
    async (code: string) => {
      const result = await community.joinCommunity(code);
      if (result.success) {
        showToast('Successfully joined community!');
      }
      return result;
    },
    [community, showToast]
  );

  const handleCreate = useCallback(
    async (name: string, desc: string) => {
      const result = await community.createCommunity(name, desc);
      if (result.success) {
        showToast('Community created! You are now the Community Head.');
      }
      return result;
    },
    [community, showToast]
  );

  const handleLeave = useCallback(async () => {
    const result = await community.leaveCommunity();
    if (result.success) {
      showToast('You have left the community.');
      setView('community');
    }
    return result;
  }, [community, showToast]);

  const handleSwitch = useCallback(() => {
    community.leaveCommunity().then(() => {
      setView('community');
      showToast('You can now join or create a new community.');
    });
  }, [community, showToast]);

  const handleDeleteCommunity = useCallback(async () => {
    const result = await community.deleteCommunity();
    if (result.success) {
      showToast('Community deleted.');
      setView('community');
    }
    return result;
  }, [community, showToast]);

  // Auth gate
  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar
        current={view}
        onNavigate={handleNavigate}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        user={user}
        communityName={community.currentCommunity?.name || null}
        onSignOut={signOut}
      />

      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-ink-900/80 backdrop-blur-xl border-b border-white/[0.06] z-30">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="w-10 h-10 rounded-lg glass flex items-center justify-center text-slate-300"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-purple to-neon-violet flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="font-display font-bold text-white">CivicSnap</span>
          </div>
          <div className="w-10" />
        </div>

        {/* Gatekeeper Broadcast Banner */}
        <GatekeeperBanner />

        {/* View content */}
        <div className="flex-1 min-h-0 relative">
          {view === 'map' && (
            <MapDashboard
              issues={mapIssues}
              selectedIssue={selectedIssue}
              onSelectIssue={setSelectedIssue}
              statusFilter={statusFilter}
              onStatusFilter={setStatusFilter}
            />
          )}
          {view === 'report' && (
            <ReportForm onLocate={handleLocate} coordinates={coordinates} />
          )}
          {view === 'history' && <ReportsHistoryView />}
          {view === 'community' && (
            <CommunityView
              user={user}
              community={community.currentCommunity}
              members={community.members}
              issues={community.issues}
              loading={community.loading}
              onJoin={handleJoin}
              onCreate={handleCreate}
              onLeave={handleLeave}
              onSwitch={handleSwitch}
              onDeleteCommunity={handleDeleteCommunity}
            />
          )}
          {view === 'profile' && <ProfileView />}
          {view === 'admin' && user.isAdmin && <AdminPanel />}
        </div>
      </main>

      {/* Issue detail modal */}
      {selectedIssue && (
        <IssueModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onVerify={handleVerify}
          verified={verifiedIssues.has(selectedIssue.id)}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[2000] animate-slide-in">
          <div className="glass-strong px-5 py-3.5 flex items-center gap-3 shadow-glass border-neon-mint/30">
            <div className="w-2 h-2 rounded-full bg-neon-mint animate-pulse" />
            <p className="text-sm text-slate-200 font-medium">{toast}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function GatekeeperBanner() {
  const [dismissed, setDismissed] = useState(false);
  // In production, this would pull from a Firestore broadcast collection
  const broadcast = {
    active: false,
    message: 'Community Head Srijith has issued an emergency broadcast.',
  };

  if (!broadcast.active || dismissed) return null;

  return (
    <div className="relative z-40 bg-neon-red/10 border-b border-neon-red/30 animate-pulse">
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-neon-red shrink-0 animate-pulse" />
          <p className="text-xs font-semibold text-neon-red">
            Gatekeeper Broadcast: {broadcast.message}
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-neon-red/60 hover:text-neon-red transition shrink-0"
        >
          <span className="text-xs">Dismiss</span>
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
