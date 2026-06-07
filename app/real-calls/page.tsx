'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  Mic,
  FileAudio,
  Loader2,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Mail,
  ChevronDown,
  ChevronUp,
  X,
  ArrowRight,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import AnalysisModal from '@/components/AnalysisModal';
import { getSettings } from '@/lib/storage';
import { SessionAnalysis } from '@/lib/types';

type UploadPhase = 'idle' | 'uploading' | 'transcribing' | 'analyzing' | 'done' | 'error';

const ACCEPTED = '.mp3,.mp4,.m4a,.wav,.webm,.ogg,.mpeg,.mpga';

export default function RealCallsPage() {
  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [analysis, setAnalysis] = useState<SessionAnalysis | null>(null);
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    const settings = getSettings();
    setFileName(file.name);
    setPhase('transcribing');
    setErrorMsg('');
    setAnalysis(null);
    setTranscript('');

    try {
      // Step 1: Transcribe
      const formData = new FormData();
      formData.append('audio', file);
      const tRes = await fetch('/api/transcribe', { method: 'POST', body: formData });
      if (!tRes.ok) {
        const err = await tRes.json();
        throw new Error(err.error || 'Transcription failed');
      }
      const { transcript: t } = await tRes.json();
      setTranscript(t);

      // Step 2: Analyze
      setPhase('analyzing');
      const aRes = await fetch('/api/analyze-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: t,
          salespersonName: settings.userName,
          productDescription: settings.productDescription,
        }),
      });
      if (!aRes.ok) {
        const err = await aRes.json();
        throw new Error(err.error || 'Analysis failed');
      }
      const { analysis: a } = await aRes.json();
      setAnalysis(a);
      setPhase('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Processing failed');
      setPhase('error');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const scoreColor = analysis
    ? analysis.score >= 75 ? '#22c55e' : analysis.score >= 50 ? '#f59e0b' : '#ef4444'
    : '#6366f1';

  const phaseLabel: Record<UploadPhase, string> = {
    idle: '',
    uploading: 'Uploading...',
    transcribing: 'Transcribing with Whisper...',
    analyzing: 'Analyzing your call...',
    done: 'Analysis complete',
    error: 'Something went wrong',
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0d0d14' }}>
      <Sidebar />
      <main className="flex-1 ml-60 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#f1f5f9' }}>Real Call Analysis</h1>
          <p className="text-sm" style={{ color: '#64748b' }}>
            Upload a recorded sales call — AI transcribes and coaches you on it.
          </p>
        </div>

        <div className="max-w-3xl space-y-6">
          {/* Drop zone */}
          {(phase === 'idle' || phase === 'error') && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-all"
              style={{
                border: `2px dashed ${dragOver ? '#6366f1' : '#2a2a3c'}`,
                backgroundColor: dragOver ? 'rgba(99,102,241,0.06)' : '#16161f',
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}
              >
                <Upload size={24} style={{ color: '#6366f1' }} />
              </div>
              <div className="text-center">
                <p className="font-semibold mb-1" style={{ color: '#f1f5f9' }}>Drop your recording here</p>
                <p className="text-sm" style={{ color: '#64748b' }}>or click to browse</p>
                <p className="text-xs mt-2" style={{ color: '#475569' }}>
                  MP3, MP4, M4A, WAV, WebM, OGG — up to 25 MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Chrome extension promo */}
          {phase === 'idle' && (
            <div
              className="rounded-xl p-5 flex items-start gap-4"
              style={{ backgroundColor: '#16161f', border: '1px solid #2a2a3c' }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(99,102,241,0.12)' }}
              >
                <Mic size={17} style={{ color: '#6366f1' }} />
              </div>
              <div>
                <p className="font-medium text-sm mb-0.5" style={{ color: '#f1f5f9' }}>
                  Want automatic recording?
                </p>
                <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
                  Install the AI Sales Coach Chrome extension to record Google Meet calls automatically — no manual upload needed.
                  Find it in the <code className="px-1 py-0.5 rounded" style={{ backgroundColor: '#0d0d14', color: '#94a3b8' }}>chrome-extension/</code> folder of the app.
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {phase === 'error' && (
            <div
              className="rounded-xl p-4 flex items-start gap-3"
              style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p className="text-sm font-medium" style={{ color: '#ef4444' }}>Failed</p>
                <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{errorMsg}</p>
                {errorMsg.includes('GROQ') && (
                  <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                    Transcription requires a GROQ_API_KEY in your .env.local file.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Processing */}
          {(phase === 'transcribing' || phase === 'analyzing' || phase === 'uploading') && (
            <div
              className="rounded-xl p-8 flex flex-col items-center gap-4"
              style={{ backgroundColor: '#16161f', border: '1px solid #2a2a3c' }}
            >
              <div className="flex items-center gap-3 mb-2">
                <FileAudio size={18} style={{ color: '#6366f1' }} />
                <span className="text-sm font-medium" style={{ color: '#94a3b8' }}>{fileName}</span>
              </div>

              <div className="flex flex-col items-center gap-3 w-full">
                {(['transcribing', 'analyzing'] as UploadPhase[]).map((p, i) => {
                  const done = phase === 'analyzing' && p === 'transcribing';
                  const active = phase === p;
                  return (
                    <div key={p} className="flex items-center gap-3 w-full max-w-xs">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: done ? 'rgba(34,197,94,0.15)' : active ? 'rgba(99,102,241,0.15)' : '#1e1e2a',
                          border: `1px solid ${done ? '#22c55e' : active ? '#6366f1' : '#2a2a3c'}`,
                        }}
                      >
                        {done ? (
                          <CheckCircle size={12} style={{ color: '#22c55e' }} />
                        ) : active ? (
                          <Loader2 size={12} className="animate-spin" style={{ color: '#6366f1' }} />
                        ) : (
                          <span className="text-xs" style={{ color: '#475569' }}>{i + 1}</span>
                        )}
                      </div>
                      <span className="text-sm" style={{ color: active ? '#f1f5f9' : done ? '#22c55e' : '#475569' }}>
                        {p === 'transcribing' ? 'Transcribing audio' : 'Analyzing sales technique'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs" style={{ color: '#475569' }}>This takes 10-30 seconds depending on call length</p>
            </div>
          )}

          {/* Results */}
          {phase === 'done' && analysis && (
            <>
              {/* Score card */}
              <div
                className="rounded-xl p-6"
                style={{ backgroundColor: '#16161f', border: '1px solid #2a2a3c' }}
              >
                <div className="flex items-start gap-5 mb-5">
                  <div className="text-center">
                    <div className="text-5xl font-bold" style={{ color: scoreColor }}>{analysis.score}</div>
                    <div className="text-xs mt-1" style={{ color: '#64748b' }}>/ 100</div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold mb-1" style={{ color: '#f1f5f9' }}>{fileName}</p>
                    <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{analysis.summary}</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAnalysisModal(true)}
                  className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  style={{ backgroundColor: 'rgba(99,102,241,0.12)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.25)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(99,102,241,0.2)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(99,102,241,0.12)'; }}
                >
                  View full analysis with mistakes &amp; fixes
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Strengths + Improvements */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { title: 'What worked', items: analysis.strengths, color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)' },
                  { title: 'What to improve', items: analysis.improvements, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
                ].map(({ title, items, color, bg, border }) => (
                  <div key={title} className="rounded-xl p-4" style={{ backgroundColor: bg, border: `1px solid ${border}` }}>
                    <p className="text-xs font-semibold mb-3" style={{ color }}>{title}</p>
                    <ul className="space-y-2">
                      {items.map((item, i) => (
                        <li key={i} className="text-xs leading-relaxed flex gap-2" style={{ color: '#94a3b8' }}>
                          <span style={{ color, flexShrink: 0 }}>•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Transcript toggle */}
              <div className="rounded-xl" style={{ backgroundColor: '#16161f', border: '1px solid #2a2a3c' }}>
                <button
                  onClick={() => setShowTranscript((v) => !v)}
                  className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium"
                  style={{ color: '#94a3b8' }}
                >
                  <span className="flex items-center gap-2">
                    <TrendingUp size={14} style={{ color: '#6366f1' }} />
                    Full Transcript
                  </span>
                  {showTranscript ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showTranscript && (
                  <div
                    className="px-5 pb-5 text-xs leading-relaxed max-h-64 overflow-y-auto"
                    style={{ color: '#64748b', borderTop: '1px solid #2a2a3c', paddingTop: '1rem', whiteSpace: 'pre-wrap' }}
                  >
                    {transcript}
                  </div>
                )}
              </div>

              {/* New analysis button */}
              <button
                onClick={() => { setPhase('idle'); setAnalysis(null); setTranscript(''); setFileName(''); }}
                className="flex items-center gap-2 text-sm"
                style={{ color: '#64748b' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#64748b'; }}
              >
                <X size={13} /> Analyze another recording
              </button>
            </>
          )}
        </div>
      </main>

      {/* Full analysis modal */}
      {showAnalysisModal && analysis && (
        <AnalysisModal
          analysis={analysis}
          scenarioLabel="Real Call"
          onClose={() => setShowAnalysisModal(false)}
        />
      )}
    </div>
  );
}
