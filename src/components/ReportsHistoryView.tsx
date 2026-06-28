import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../auth';
import type { IssueStatus, IssueCategory } from '../types';
import { statusConfig, getCategory, severityLabel, timeAgo } from '../lib';
import {
  History,
  Edit3,
  Trash2,
  ThumbsUp,
  X,
  AlertTriangle,
  Loader2,
  FileText,
  Tag,
  MapPin,
  Clock,
  Zap,
  CheckCircle2,
  X as XIcon,
} from 'lucide-react';

export interface Report {
  id: string;
  title: string;
  category: string;
  status: IssueStatus;
  description: string;
  lat: number;
  lng: number;
  address: string;
  severity: number;
  confidence: number;
  imageUrl: string;
  upvotes?: number;
  createdAt: { seconds: number } | string;
}

const CATEGORIES: IssueCategory[] = [
  'Pothole',
  'Broken Streetlight',
  'Trash Accumulation',
  'Graffiti',
  'Water Leak',
  'Fallen Tree',
  'Illegal Parking',
  'Damaged Sidewalk',
];

export function ReportsHistoryView() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [deletingReport, setDeletingReport] = useState<Report | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'reports'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: Report[] = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Report);
        setReports(items);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [user]);

  const handleEdit = useCallback(async (id: string, description: string, category: string) => {
    await updateDoc(doc(db, 'reports', id), { description, category });
    setEditingReport(null);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deletingReport) return;
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, 'reports', deletingReport.id));
      setDeletingReport(null);
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingReport]);

  const handleUpvote = useCallback(async (id: string, current: number) => {
    await updateDoc(doc(db, 'reports', id), { upvotes: (current || 0) + 1 });
  }, []);

  const sortedReports = [...reports].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-neon-purple animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-4 lg:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
              <History className="w-6 h-6 text-neon-purple" />
              My Reports History
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {sortedReports.length} {sortedReports.length === 1 ? 'report' : 'reports'} filed by you
            </p>
          </div>
        </div>

        {/* Empty state */}
        {sortedReports.length === 0 && (
          <div className="glass-strong p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-300">No reports yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Head to Snap & Report to file your first community issue.
            </p>
          </div>
        )}

        {/* Reports grid */}
        {sortedReports.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedReports.map((report) => {
              const cat = getCategory(report.category);
              const sev = severityLabel(report.severity);
              const status = statusConfig[report.status] || statusConfig['open'];
              const time = typeof report.createdAt === 'string'
                ? timeAgo(report.createdAt)
                : timeAgo(new Date(report.createdAt.seconds * 1000).toISOString());

              return (
                <div
                  key={report.id}
                  className="glass-strong p-4 flex flex-col gap-3 hover:border-white/[0.12] transition-all group"
                >
                  {/* Top row: image + status */}
                  <div className="flex gap-3">
                    {report.imageUrl && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-white/[0.06]">
                        <img
                          src={report.imageUrl}
                          alt={report.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-white truncate">
                          {report.title}
                        </h3>
                        <span
                          className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${status.ring} ${status.bg} ${status.text}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-base">{cat.emoji}</span>
                        <span className="text-xs text-slate-400">{report.category}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                        <Clock className="w-3 h-3" />
                        {time}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {report.description && (
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {report.description}
                    </p>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className={`flex items-center gap-1 font-mono font-bold ${sev.color}`}>
                      <Zap className="w-3 h-3" />
                      {report.severity}/10
                    </span>
                    {report.address && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3" />
                        {report.address}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1 border-t border-white/[0.04]">
                    <button
                      onClick={() => handleUpvote(report.id, report.upvotes || 0)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] text-slate-300 text-xs font-medium hover:bg-neon-mint/10 hover:text-neon-mint transition"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      Me Too {report.upvotes ? `· ${report.upvotes}` : ''}
                    </button>
                    <button
                      onClick={() => setEditingReport(report)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] text-slate-300 text-xs font-medium hover:bg-neon-purple/10 hover:text-neon-purple transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingReport(report)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] text-slate-300 text-xs font-medium hover:bg-neon-red/10 hover:text-neon-red transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingReport && (
        <EditReportModal
          report={editingReport}
          onSave={handleEdit}
          onClose={() => setEditingReport(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingReport && (
        <DeleteConfirmModal
          reportTitle={deletingReport.title}
          loading={deleteLoading}
          onConfirm={handleDelete}
          onClose={() => setDeletingReport(null)}
        />
      )}
    </div>
  );
}

function EditReportModal({
  report,
  onSave,
  onClose,
}: {
  report: Report;
  onSave: (id: string, description: string, category: string) => Promise<void>;
  onClose: () => void;
}) {
  const [description, setDescription] = useState(report.description || '');
  const [category, setCategory] = useState(report.category);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(report.id, description, category);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-strong w-full max-w-md p-6 space-y-4 animate-float-up">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-neon-purple" />
            Edit Report
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-[11px] font-mono uppercase text-slate-500 tracking-wider">
            <Tag className="w-3.5 h-3.5" />
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-ink-900/60 border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-neon-purple/40"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-ink-900">
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-[11px] font-mono uppercase text-slate-500 tracking-wider">
            <FileText className="w-3.5 h-3.5" />
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full bg-ink-900/60 border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white resize-none focus:outline-none focus:border-neon-purple/40"
            placeholder="Describe the issue..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg bg-white/[0.04] text-slate-300 text-sm font-medium hover:bg-white/[0.08] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-neon-purple to-neon-violet text-white text-sm font-semibold hover:shadow-neon-purple transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  reportTitle,
  loading,
  onConfirm,
  onClose,
}: {
  reportTitle: string;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-strong w-full max-w-sm p-6 space-y-4 animate-float-up">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-neon-red/10 border border-neon-red/20 flex items-center justify-center mb-3">
            <AlertTriangle className="w-7 h-7 text-neon-red" />
          </div>
          <h2 className="font-display text-lg font-bold text-white">Delete Report?</h2>
          <p className="text-sm text-slate-400 mt-1">
            You're about to permanently delete{' '}
            <span className="text-white font-medium">"{reportTitle}"</span>. This action cannot be
            undone.
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg bg-white/[0.04] text-slate-300 text-sm font-medium hover:bg-white/[0.08] transition flex items-center justify-center gap-2"
          >
            <XIcon className="w-4 h-4" />
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg bg-neon-red/15 border border-neon-red/30 text-neon-red text-sm font-semibold hover:bg-neon-red/25 transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
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
  );
}
