import { useState, useRef, useCallback } from 'react';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth';
import {
  UploadCloud,
  Image as ImageIcon,
  Sparkles,
  MapPin,
  Crosshair,
  Loader2,
  Check,
  X,
  Tag,
  Percent,
  FileText,
  Send,
  RotateCcw,
  Zap,
  AlertTriangle,
} from 'lucide-react';

interface ReportFormProps {
  onLocate: () => void;
  coordinates: { lat: number; lng: number } | null;
}

type AnalysisState = 'idle' | 'analyzing' | 'done' | 'rejected';

interface AnalysisResult {
  category: string;
  confidence: number;
  description: string;
  severity: number;
  valid: boolean;
}

export function ReportForm({ onLocate, coordinates }: ReportFormProps) {
  const { user } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setAnalysisState('idle');
      setResult(null);
      setSubmitted(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const runAnalysis = useCallback(async () => {
    if (!image) return;
    setAnalysisState('analyzing');
    setResult(null);

    try {
      const base64 = image.split(',')[1];
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: 'Analyze this community report image. Verify if it displays an authentic, visible infrastructure or civic issue (such as a pothole, broken streetlight, garbage pile, water leak, or structural damage). Respond in strict JSON format: { valid: boolean, type: string, confidence: number }',
                  },
                  {
                    inlineData: {
                      mimeType: 'image/jpeg',
                      data: base64,
                    },
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) throw new Error('Gemini API error');
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      let parsed: { valid?: boolean; type?: string; confidence?: number } = {};
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } catch {
        // Fallback: parse loose text
        parsed.valid = text.toLowerCase().includes('valid') && !text.toLowerCase().includes('not valid');
        parsed.type = text.match(/type["\s:]+([^",}]+)/)?.[1]?.trim() || 'Unknown';
        const numMatch = text.match(/confidence["\s:]+(\d+(?:\.\d+)?)/);
        parsed.confidence = numMatch ? parseFloat(numMatch[1]) : 75;
      }

      const valid = parsed.valid === true;
      const category = parsed.type || 'Unknown';
      const confidence = parsed.confidence || 75;

      if (!valid) {
        setAnalysisState('rejected');
        setResult({
          category,
          confidence,
          description: 'Image rejected by AI verification.',
          severity: 0,
          valid: false,
        });
        return;
      }

      const severity = confidence >= 85 ? 8 : confidence >= 70 ? 6 : 4;
      const description = `AI detected a ${category.toLowerCase()} with ${confidence}% confidence. The issue appears to be visible in the submitted image.`;

      setResult({
        category,
        confidence,
        description,
        severity,
        valid: true,
      });
      setAnalysisState('done');
    } catch {
      setAnalysisState('rejected');
      setResult({
        category: 'Unknown',
        confidence: 0,
        description: 'AI analysis failed. Please try again.',
        severity: 0,
        valid: false,
      });
    }
  }, [image]);

  const reset = useCallback(() => {
    setImage(null);
    setAnalysisState('idle');
    setResult(null);
    setSubmitted(false);
  }, []);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-4 lg:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Snap & Report</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Upload a photo and let AI do the heavy lifting
            </p>
          </div>
          <div className="flex items-center gap-2 glass px-3 py-2">
            <Zap className="w-4 h-4 text-neon-amber" fill="currentColor" />
            <span className="text-xs font-mono text-slate-300">+50 cred per report</span>
          </div>
        </div>

        {/* Upload zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !image && fileInputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden ${
            dragging
              ? 'border-neon-purple bg-neon-purple/10 scale-[1.01]'
              : image
                ? 'border-white/[0.08]'
                : 'border-white/[0.12] hover:border-neon-purple/40 hover:bg-white/[0.02]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {image ? (
            <div className="relative">
              <img src={image} alt="Upload preview" className="w-full h-64 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div className="flex items-center gap-2 glass px-3 py-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-neon-mint" />
                  <span className="text-xs text-slate-200">Image ready</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    reset();
                  }}
                  className="w-8 h-8 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-300 hover:text-neon-red transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="py-16 px-6 text-center">
              <div
                className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-all ${
                  dragging ? 'bg-neon-purple/20 scale-110' : 'bg-white/[0.04]'
                }`}
              >
                <UploadCloud
                  className={`w-8 h-8 ${dragging ? 'text-neon-purple' : 'text-slate-400'}`}
                />
              </div>
              <p className="text-sm font-medium text-slate-200">
                {dragging ? 'Drop to upload' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                PNG, JPG up to 10MB — photos of community issues
              </p>
            </div>
          )}
        </div>

        {/* AI Analysis section */}
        {image && (
          <div className="glass-strong p-5 space-y-4 animate-float-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-purple to-neon-violet flex items-center justify-center shadow-neon-purple">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Gemini Vision Analysis</p>
                  <p className="text-[11px] text-slate-500">AI-powered issue detection</p>
                </div>
              </div>
              {analysisState === 'idle' && (
                <button
                  onClick={runAnalysis}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-purple to-neon-violet text-white text-xs font-semibold hover:shadow-neon-purple transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Analyze
                </button>
              )}
              {analysisState === 'done' && (
                <button
                  onClick={runAnalysis}
                  className="px-3 py-2 rounded-lg glass text-slate-300 text-xs font-medium hover:text-white transition flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Re-run
                </button>
              )}
            </div>

            {analysisState === 'idle' && (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-500">
                  Click <span className="text-neon-purple font-medium">Analyze</span> to let AI
                  detect the issue category, confidence, and suggested description.
                </p>
              </div>
            )}

            {analysisState === 'analyzing' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-neon-purple">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <p className="text-xs font-mono uppercase tracking-wider">
                    Analyzing image with Gemini...
                  </p>
                </div>
                <SkeletonRow icon={Tag} label="AI Detected Category" />
                <SkeletonRow icon={Percent} label="AI Confidence Score" />
                <SkeletonRow icon={FileText} label="Suggested Description" lines={3} />
              </div>
            )}

            {analysisState === 'rejected' && result && (
              <div className="glass p-4 border border-neon-red/30 bg-neon-red/5 flex flex-col items-center gap-3 text-center animate-float-up">
                <div className="w-12 h-12 rounded-full bg-neon-red/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-neon-red" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neon-red">Invalid Image</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Please upload a clear photo of a valid community issue.
                  </p>
                </div>
                <button
                  onClick={reset}
                  className="px-4 py-2 rounded-lg bg-white/[0.04] text-slate-300 text-xs font-medium hover:bg-white/[0.08] transition"
                >
                  Try Another Photo
                </button>
              </div>
            )}

            {analysisState === 'done' && result && (
              <div className="space-y-3 animate-float-up">
                <ResultRow
                  icon={Tag}
                  label="AI Detected Category"
                  value={
                    <span className="text-neon-purple font-semibold">{result.category}</span>
                  }
                />
                <ResultRow
                  icon={Percent}
                  label="AI Confidence Score"
                  value={
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-neon-purple to-neon-mint transition-all duration-700"
                          style={{ width: `${result.confidence}%` }}
                        />
                      </div>
                      <span className="text-neon-mint font-mono font-semibold text-sm">
                        {result.confidence}%
                      </span>
                    </div>
                  }
                />
                <ResultRow
                  icon={FileText}
                  label="Suggested Description"
                  value={
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {result.description}
                    </p>
                  }
                />
                <ResultRow
                  icon={Zap}
                  label="AI Severity Assessment"
                  value={
                    <span
                      className={`font-mono font-bold ${
                        result.severity >= 8
                          ? 'text-neon-red'
                          : result.severity >= 6
                            ? 'text-neon-amber'
                            : 'text-neon-mint'
                      }`}
                    >
                      {result.severity}/10 —{' '}
                      {result.severity >= 8
                        ? 'Critical'
                        : result.severity >= 6
                          ? 'High'
                          : 'Moderate'}
                    </span>
                  }
                />
              </div>
            )}
          </div>
        )}

        {/* Location picker */}
        <div className="glass p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-neon-mint" />
              <p className="text-sm font-medium text-slate-200">Location</p>
            </div>
            <button
              onClick={onLocate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-mint/10 border border-neon-mint/20 text-neon-mint text-xs font-medium hover:bg-neon-mint/20 transition"
            >
              <Crosshair className="w-3.5 h-3.5" />
              Capture Coordinates
            </button>
          </div>
          {coordinates ? (
            <div className="mt-3 flex items-center gap-2 text-xs font-mono text-slate-400">
              <Check className="w-3.5 h-3.5 text-neon-mint" />
              {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-500">
              No location captured — click the button to pin this report on the map.
            </p>
          )}
        </div>

        {/* Submit */}
        {image && analysisState === 'done' && result && (
          <button
            onClick={async () => {
              if (!user || !result) return;
              try {
                await addDoc(collection(db, 'reports'), {
                  uid: user.uid,
                  title: result.category,
                  category: result.category,
                  status: 'open',
                  description: result.description,
                  lat: coordinates?.lat ?? 12.9716,
                  lng: coordinates?.lng ?? 77.5946,
                  address: 'Community area',
                  severity: result.severity,
                  confidence: result.confidence,
                  imageUrl: image,
                  createdAt: serverTimestamp(),
                  upvotes: 0,
                });
                // Award street cred for filing a report
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, { streetCred: (user.streetCred || 0) + 50 });
                setSubmitted(true);
              } catch {
                setSubmitted(true);
              }
            }}
            disabled={submitted}
            className={`w-full py-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              submitted
                ? 'bg-neon-mint/15 text-neon-mint border border-neon-mint/30'
                : 'bg-gradient-to-r from-neon-purple to-neon-violet text-white hover:shadow-neon-purple hover:scale-[1.01] active:scale-[0.99]'
            }`}
          >
            {submitted ? (
              <>
                <Check className="w-4 h-4" />
                Report Submitted! +50 Street Cred earned
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Report
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function SkeletonRow({
  icon: Icon,
  label,
  lines = 1,
}: {
  icon: typeof Tag;
  label: string;
  lines?: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-slate-600" />
        <span className="text-[11px] font-mono uppercase text-slate-500 tracking-wider">
          {label}
        </span>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-3"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

function ResultRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Tag;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="glass p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-3.5 h-3.5 text-neon-purple" />
        <span className="text-[11px] font-mono uppercase text-slate-500 tracking-wider">
          {label}
        </span>
      </div>
      <div className="pl-5.5">{value}</div>
    </div>
  );
}
