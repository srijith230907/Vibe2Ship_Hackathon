import { useState } from 'react';
import { useAuth } from '../auth';
import { Zap, ShieldCheck, MapPin, Trophy, Sparkles, AlertCircle } from 'lucide-react';

export function LoginScreen() {
  const { signInWithGoogle, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch {
      setError('Sign-in failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-purple/15 rounded-full blur-[120px] animate-glow-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-mint/10 rounded-full blur-[120px] animate-glow-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-cyan/5 rounded-full blur-[100px]" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(168,85,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 w-full max-w-md animate-float-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-purple to-neon-violet flex items-center justify-center shadow-neon-purple mb-4">
            <Zap className="w-10 h-10 text-white" fill="white" />
            <div className="absolute inset-0 rounded-2xl bg-neon-purple/30 animate-glow-pulse -z-10 blur-xl" />
          </div>
          <h1 className="font-display text-4xl font-bold text-white tracking-tight">
            CivicSnap
          </h1>
          <p className="text-sm text-slate-400 mt-2 text-center">
            Snap it. Map it. Fix it. <br />
            Your neighborhood, powered by community.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { icon: MapPin, label: 'Live Map' },
            { icon: Sparkles, label: 'AI Reports' },
            { icon: Trophy, label: 'Gamified' },
            { icon: ShieldCheck, label: 'Verified' },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.label}
                className="glass px-3 py-1.5 flex items-center gap-1.5 text-xs text-slate-300"
              >
                <Icon className="w-3.5 h-3.5 text-neon-purple" />
                {f.label}
              </div>
            );
          })}
        </div>

        {/* Login card */}
        <div className="glass-strong p-6 space-y-5">
          <div>
            <h2 className="font-display text-xl font-bold text-white text-center">
              Welcome back, neighbor
            </h2>
            <p className="text-sm text-slate-500 text-center mt-1">
              Sign in to report issues, join communities, and earn Street Cred
            </p>
          </div>

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-white text-slate-800 font-semibold text-sm hover:bg-slate-100 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </>
            )}
          </button>

          {error && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neon-red/10 border border-neon-red/20 text-neon-red text-xs animate-slide-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[10px] font-mono uppercase text-slate-600 tracking-wider">
              Secured by CivicGuard
            </span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-neon-mint" />
            <span>Anti-bot protected · Your data stays private</span>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-600 mt-6 font-mono">
          By signing in, you agree to CivicSnap's Community Guidelines
        </p>
      </div>
    </div>
  );
}
