import { MapPin, User, Clock, ShieldCheck, Sparkles, X, BadgeCheck, AlertTriangle } from 'lucide-react';
import type { MapIssue } from '../types';
import { statusConfig, getCategory, severityLabel, timeAgo } from '../lib';

interface IssueModalProps {
  issue: MapIssue;
  onClose: () => void;
  onVerify: (issue: MapIssue) => void;
  verified: boolean;
}

export function IssueModal({ issue, onClose, onVerify, verified }: IssueModalProps) {
  const status = statusConfig[issue.status];
  const cat = getCategory(issue.category);
  const sev = severityLabel(issue.severity);

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-scale-in"
      onClick={onClose}
    >
      <div
        className="glass-strong w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-glass"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-48 overflow-hidden rounded-t-2xl">
          <img src={issue.image} alt={issue.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/40 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-black/70 transition"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-4 flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${status.ring} ${status.bg} ${status.text} backdrop-blur-md`}
            >
              {status.label}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/50 text-slate-200 backdrop-blur-md border border-white/10">
              {cat.emoji} {issue.category}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold text-white">{issue.title}</h2>
            <div className="flex items-center gap-1.5 mt-1.5 text-sm text-slate-400">
              <MapPin className="w-3.5 h-3.5" />
              <span>{issue.address}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="glass p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <AlertTriangle className={`w-3.5 h-3.5 ${sev.color}`} />
                <p className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">
                  Severity
                </p>
              </div>
              <p className={`text-lg font-bold ${sev.color}`}>{issue.severity}/10</p>
              <p className={`text-[10px] ${sev.color}`}>{sev.label}</p>
            </div>
            <div className="glass p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-neon-purple" />
                <p className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">
                  AI Conf.
                </p>
              </div>
              <p className="text-lg font-bold text-neon-purple">{issue.confidence}%</p>
              <p className="text-[10px] text-slate-500">Gemini Vision</p>
            </div>
            <div className="glass p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <BadgeCheck className="w-3.5 h-3.5 text-neon-mint" />
                <p className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">
                  Verified
                </p>
              </div>
              <p className="text-lg font-bold text-neon-mint">{issue.verifications}</p>
              <p className="text-[10px] text-slate-500">community checks</p>
            </div>
          </div>

          <div className="glass p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-neon-purple to-neon-violet flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-xs font-mono uppercase text-neon-purple tracking-wider">
                AI Analysis
              </p>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{issue.aiDescription}</p>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>{issue.reportedBy}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{timeAgo(issue.reportedAt)}</span>
            </div>
          </div>

          <button
            onClick={() => onVerify(issue)}
            disabled={verified}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              verified
                ? 'bg-neon-mint/15 text-neon-mint border border-neon-mint/30 cursor-default'
                : 'bg-gradient-to-r from-neon-purple to-neon-violet text-white hover:shadow-neon-purple hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {verified ? 'Verified by You (+10 cred)' : 'Verify Issue'}
          </button>
        </div>
      </div>
    </div>
  );
}
