'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  Mic,
  FileAudio,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  X,
  ArrowRight,
  Play,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import AnalysisModal from '@/components/AnalysisModal';
import { getSettings } from '@/lib/storage';
import { SessionAnalysis } from '@/lib/types';

type UploadPhase = 'idle' | 'transcribing' | 'analyzing' | 'done' | 'error';
type InputMode = 'audio' | 'transcript';

const ACCEPTED_AUDIO = '.mp3,.mp4,.m4a,.wav,.webm,.ogg,.mpeg,.mpga';

export default function RealCallsPage() {
  const [inputMode, setInputMode] = useState<InputMode>('audio');
  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [analysis, setAnalysis] = useState<SessionAnalysis | null>(null);
  const [transcript, setTranscript] = useState('');
  const [transcriptInput, setTranscriptInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const txtInputRef = useRef<HTMLInputElement>(null);

  // ── Analyze a known transcript string ────────────────────────────────────────
  const analyzeTranscript = useCallback(async (text: string, label: string) => {
    const settings = getSettings();
    setFileName(label);
    setPhase('analyzing');
    setErrorMsg('');
    setAnalysis(null);
    setTranscript(text);

    try {
      const aRes = await fetch('/api/analyze-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
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
      setErrorMsg(err instanceof Error ? err.message : 'Analysis failed');
      setPhase('error');
    }
  }, []);

  // ── Process audio file ────────────────────────────────────────────────────────
  const processAudioFile = useCallback(async (file: File) => {
    const settings = getSettings();
    setFileName(file.name);
    setPhase('transcribing');
    setErrorMsg('');
    setAnalysis(null);
    setTranscript('');

    try {
      const formData = new FormData();
      formData.append('audio', file);
      const tRes = await fetch('/api/transcribe', { method: 'POST', body: formData });
      if (!tRes.ok) {
        const err = await tRes.json();
        throw new Error(err.error || 'Transcription failed');
      }
      const { transcript: t } = await tRes.json();
      setTranscript(t);
      await analyzeTranscript(t, file.name);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Processing failed');
      setPhase('error');
    }
  }, [analyzeTranscript]);

  const handleAudioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processAudioFile(file);
    e.target.value = '';
  };

  const handleTxtFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setTranscriptInput(String(ev.target?.result || ''));
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processAudioFile(file);
  };

  const handleTranscriptDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (ev) => setTranscriptInput(String(ev.target?.result || ''));
      reader.readAsText(file);
    }
  };

  const handleAnalyzeTranscript = () => {
    const text = transcriptInput.trim();
    if (!text) return;
    analyzeTranscript(text, 'Pasted transcript');
  };

  const reset = () => {
    setPhase('idle');
    setAnalysis(null);
    setTranscript('');
    setFileName('');
    setErrorMsg('');
  };

  const scoreColor = analysis
    ? analysis.score >= 75 ? '#22c55e' : analysis.score >= 50 ? '#f59e0b' : '#ef4444'
    : '#6366f1';

  const tabStyle = (active: boolean) => ({
    flex: 1,
    padding: '9px 0',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.15s',
    backgroundColor: active ? '#6366f1' : 'transparent',
    color: active ? 'white' : '#64748b',
  } as React.CSSProperties);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0d0d14' }}>
      <Sidebar />
      <main className="flex-1 ml-60 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#f1f5f9' }}>Real Call Analysis</h1>
          <p className="text-sm" style={{ color: '#64748b' }}>
            Upload a recording or paste a transcript — AI coaches you on what to improve.
          </p>
        </div>

        <div className="max-w-3xl space-y-5">
          {/* ── Input panel (idle / error) ── */}
          {(phase === 'idle' || phase === 'error') && (
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#16161f', border: '1px solid #2a2a3c' }}>
              {/* Tabs */}
              <div className="p-2 flex gap-1" style={{ backgroundColor: '#0d0d14', borderBottom: '1px solid #2a2a3c' }}>
                <button style={tabStyle(inputMode === 'audio')} onClick={() => setInputMode('audio')}>
                  🎵  Audio File
                </button>
                <button style={tabStyle(inputMode === 'transcript')} onClick={() => setInputMode('transcript')}>
                  📄  Text Transcript
                </button>
              </div>

              {/* ── Audio tab ── */}
              {inputMode === 'audio' && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleAudioDrop}
                  onClick={() => audioInputRef.current?.click()}
                  className="p-10 flex flex-col items-center gap-4 cursor-pointer transition-all"
                  style={{ backgroundColor: dragOver ? 'rgba(99,102,241,0.06)' : 'transparent' }}
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
                    <p className="text-xs mt-2" style={{ color: '#475569' }}>MP3, MP4, M4A, WAV, WebM, OGG — up to 25 MB</p>
                  </div>
                  <input ref={audioInputRef} type="file" accept={ACCEPTED_AUDIO} onChange={handleAudioFileSelect} className="hidden" />
                </div>
              )}

              {/* ── Transcript tab ── */}
              {inputMode === 'transcript' && (
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: '#94a3b8' }}>
                      Paste your transcript
                    </label>
                    <textarea
                      value={transcriptInput}
                      onChange={(e) => setTranscriptInput(e.target.value)}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleTranscriptDrop}
                      placeholder={`Paste your call transcript here — any format works.\n\nExamples:\n  Alex: Hi, I'm calling from WeTravel...\n  Prospect: Who is this?\n  Alex: We help travel businesses...\n\nOr just a raw transcript without speaker labels.`}
                      rows={10}
                      className="w-full resize-none text-sm rounded-xl px-4 py-3 outline-none"
                      style={{
                        backgroundColor: dragOver ? 'rgba(99,102,241,0.06)' : '#0d0d14',
                        border: `1px solid ${dragOver ? '#6366f1' : '#2a2a3c'}`,
                        color: '#f1f5f9',
                        lineHeight: '1.6',
                        caretColor: '#6366f1',
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#6366f1'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = dragOver ? '#6366f1' : '#2a2a3c'; }}
                    />
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-xs" style={{ color: '#475569' }}>
                        {transcriptInput.length > 0 ? `${transcriptInput.split(/\s+/).filter(Boolean).length} words` : 'You can also drag a .txt file onto the box above'}
                      </p>
                      <button
                        onClick={() => txtInputRef.current?.click()}
                        className="text-xs transition-colors"
                        style={{ color: '#6366f1' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#a5b4fc'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#6366f1'; }}
                      >
                        Upload .txt file
                      </button>
                      <input ref={txtInputRef} type="file" accept=".txt,text/plain" onChange={handleTxtFileSelect} className="hidden" />
                    </div>
                  </div>

                  <button
                    onClick={handleAnalyzeTranscript}
                    disabled={!transcriptInput.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      backgroundColor: transcriptInput.trim() ? '#6366f1' : '#2a2a3c',
                      color: transcriptInput.trim() ? 'white' : '#64748b',
                    }}
                    onMouseEnter={(e) => { if (transcriptInput.trim()) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4f46e5'; }}
                    onMouseLeave={(e) => { if (transcriptInput.trim()) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6366f1'; }}
                  >
                    <Play size={14} />
                    Analyze Transcript
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Chrome extension promo — audio tab only */}
          {phase === 'idle' && inputMode === 'audio' && (
            <div className="rounded-xl p-5 flex items-start gap-4" style={{ backgroundColor: '#16161f', border: '1px solid #2a2a3c' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(99,102,241,0.12)' }}>
                <Mic size={17} style={{ color: '#6366f1' }} />
              </div>
              <div>
                <p className="font-medium text-sm mb-0.5" style={{ color: '#f1f5f9' }}>Want automatic recording?</p>
                <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
                  Install the AI Sales Coach Chrome extension to record Google Meet calls automatically.
                  Find it in the <code className="px-1 py-0.5 rounded" style={{ backgroundColor: '#0d0d14', color: '#94a3b8' }}>chrome-extension/</code> folder of the app.
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {phase === 'error' && (
            <div className="rounded-xl p-4 flex items-start gap-3" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p className="text-sm font-medium" style={{ color: '#ef4444' }}>Failed</p>
                <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{errorMsg}</p>
                {errorMsg.includes('GROQ') && (
                  <p className="text-xs mt-1" style={{ color: '#64748b' }}>Transcription requires a GROQ_API_KEY in your .env.local file.</p>
                )}
              </div>
            </div>
          )}

          {/* Processing */}
          {(phase === 'transcribing' || phase === 'analyzing') && (
            <div className="rounded-xl p-8 flex flex-col items-center gap-4" style={{ backgroundColor: '#16161f', border: '1px solid #2a2a3c' }}>
              <div className="flex items-center gap-3 mb-2">
                {phase === 'transcribing' ? <FileAudio size={18} style={{ color: '#6366f1' }} /> : <FileText size={18} style={{ color: '#6366f1' }} />}
                <span className="text-sm font-medium" style={{ color: '#94a3b8' }}>{fileName}</span>
              </div>
              <div className="flex flex-col items-center gap-3 w-full">
                {(['transcribing', 'analyzing'] as UploadPhase[]).map((p, i) => {
                  // If we jumped straight to analyzing (transcript mode), skip the transcribing step visually
                  if (p === 'transcribing' && phase === 'analyzing' && !transcript) return null;
                  const done = phase === 'analyzing' && p === 'transcribing';
                  const active = phase === p;
                  return (
                    <div key={p} className="flex items-center gap-3 w-full max-w-xs">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: done ? 'rgba(34,197,94,0.15)' : active ? 'rgba(99,102,241,0.15)' : '#1e1e2a',
                          border: `1px solid ${done ? '#22c55e' : active ? '#6366f1' : '#2a2a3c'}`,
                        }}>
                        {done ? <CheckCircle size={12} style={{ color: '#22c55e' }} /> : active ? <Loader2 size={12} className="animate-spin" style={{ color: '#6366f1' }} /> : <span className="text-xs" style={{ color: '#475569' }}>{i + 1}</span>}
                      </div>
                      <span className="text-sm" style={{ color: active ? '#f1f5f9' : done ? '#22c55e' : '#475569' }}>
                        {p === 'transcribing' ? 'Transcribing audio' : 'Analyzing sales technique'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs" style={{ color: '#475569' }}>
                {phase === 'transcribing' ? 'This takes 10-30 seconds depending on call length' : 'Reviewing your sales technique...'}
              </p>
            </div>
          )}

          {/* Results */}
          {phase === 'done' && analysis && (
            <>
              <div className="rounded-xl p-6" style={{ backgroundColor: '#16161f', border: '1px solid #2a2a3c' }}>
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
                  View full analysis with mistakes &amp; fixes <ArrowRight size={14} />
                </button>
              </div>

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
                          <span style={{ color, flexShrink: 0 }}>•</span>{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Transcript toggle */}
              {transcript && (
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
                    <div className="px-5 pb-5 text-xs leading-relaxed max-h-64 overflow-y-auto"
                      style={{ color: '#64748b', borderTop: '1px solid #2a2a3c', paddingTop: '1rem', whiteSpace: 'pre-wrap' }}>
                      {transcript}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={reset}
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

      {showAnalysisModal && analysis && (
        <AnalysisModal analysis={analysis} scenarioLabel="Real Call" onClose={() => setShowAnalysisModal(false)} />
      )}
    </div>
  );
}
