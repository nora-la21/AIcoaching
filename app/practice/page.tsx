'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Send,
  StopCircle,
  Lightbulb,
  ArrowLeft,
  Loader2,
  Clock,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  User,
  BookOpen,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import MessageBubble from '@/components/MessageBubble';
import ScenarioCard from '@/components/ScenarioCard';
import AnalysisModal from '@/components/AnalysisModal';
import GenerateScenarioModal from '@/components/GenerateScenarioModal';
import { SCENARIOS, FRAMEWORKS, getScenarioById, getFrameworkById } from '@/lib/scenarios';
import { getSettings, saveSession } from '@/lib/storage';
import { ChatMessage, Session, SessionAnalysis, CustomProspect } from '@/lib/types';
import { GeneratedObjection } from '@/app/api/generate-objections/route';

type Phase = 'select' | 'chatting' | 'analyzing' | 'done';
type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking';

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function Toast({ message, type }: { message: string; type: 'error' | 'success' }) {
  return (
    <div
      className="fixed bottom-6 right-6 px-4 py-3 rounded-xl text-sm font-medium shadow-lg z-50"
      style={{
        backgroundColor: type === 'error' ? '#ef4444' : '#22c55e',
        color: 'white',
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      {message}
    </div>
  );
}

function PracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = searchParams.get('scenario');

  const [phase, setPhase] = useState<Phase>('select');
  const [selectedScenario, setSelectedScenario] = useState<string>(preselected || '');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [coachingTip, setCoachingTip] = useState<string>('');
  const [tipHistory, setTipHistory] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<SessionAnalysis | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  // Custom prospect state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [customProspect, setCustomProspect] = useState<CustomProspect | null>(null);

  // Framework state
  const [selectedFramework, setSelectedFramework] = useState('none');

  // Generated objections
  const [generatedObjections, setGeneratedObjections] = useState<GeneratedObjection[]>([]);
  const generatedObjectionsRef = useRef<GeneratedObjection[]>([]);

  // Voice state
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const voiceModeRef = useRef(voiceMode);
  const isLoadingRef = useRef(isLoading);

  // Keep refs in sync
  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);

  // Auto-select from URL param
  useEffect(() => {
    if (preselected && SCENARIOS.find((s) => s.id === preselected)) {
      setSelectedScenario(preselected);
    }
  }, [preselected]);

  // Timer
  useEffect(() => {
    if (phase === 'chatting') {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, startTime]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check voice support
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setVoiceSupported(!!SR && !!window.speechSynthesis);
  }, []);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Speak AI text aloud and auto-listen after
  const speakText = useCallback((text: string, onDone?: () => void) => {
    if (!voiceModeRef.current || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    // Prefer a natural-sounding voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Google') || v.name.includes('Natural'))
    );
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setVoiceStatus('speaking');
    utterance.onend = () => {
      setVoiceStatus('idle');
      onDone?.();
    };
    utterance.onerror = () => setVoiceStatus('idle');
    window.speechSynthesis.speak(utterance);
  }, []);

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    window.speechSynthesis.cancel();
    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => setVoiceStatus('listening');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((r: any) => r[0].transcript)
        .join('');
      setLiveTranscript(transcript);
    };

    recognition.onend = () => {
      setVoiceStatus('processing');
      setLiveTranscript((pending) => {
        if (pending.trim()) {
          // Trigger send via input state + flag
          setInput(pending);
          setShouldVoiceSend(true);
        } else {
          setVoiceStatus('idle');
        }
        return '';
      });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech') showToast('Microphone error: ' + e.error);
      setVoiceStatus('idle');
    };

    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setVoiceStatus('idle');
    setLiveTranscript('');
  }, []);

  // Flag to trigger send from voice
  const [shouldVoiceSend, setShouldVoiceSend] = useState(false);

  // Core send function — accepts optional text to bypass input state timing
  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isLoadingRef.current) return;
    const settings = getSettings();

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => {
      const updated = [...prev, userMsg];
      return updated;
    });
    setInput('');
    setShouldVoiceSend(false);
    setIsLoading(true);

    try {
      const apiMessages = [...messages, userMsg]
        .filter((m) => !m.content.startsWith('[START]'))
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, scenario: selectedScenario, settings, customProspectProfile: customProspect?.generatedProfile, framework: selectedFramework, generatedObjections: generatedObjectionsRef.current.map(o => o.objection) }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to get response');
      }

      const data = await res.json();
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
        coachingTip: data.coachingTip,
      };

      setMessages((prev) => [...prev, aiMsg]);

      if (data.coachingTip) {
        setCoachingTip(data.coachingTip);
        setTipHistory((prev) => [data.coachingTip, ...prev].slice(0, 10));
      }

      // Voice: speak the reply, then auto-listen
      if (voiceModeRef.current) {
        speakText(data.reply, () => {
          if (voiceModeRef.current) startListening();
        });
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send message');
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      setInput(text);
      setVoiceStatus('idle');
    } finally {
      setIsLoading(false);
      if (!voiceModeRef.current) setTimeout(() => inputRef.current?.focus(), 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, messages, selectedScenario, speakText, startListening]);

  // Trigger voice send when input+flag are set
  useEffect(() => {
    if (shouldVoiceSend && input.trim()) {
      sendMessage(input.trim());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldVoiceSend, input]);

  const startSession = useCallback(async () => {
    if (!selectedScenario) return;
    const settings = getSettings();
    const scenarioObj = getScenarioById(selectedScenario);
    if (!scenarioObj) return;

    setMessages([]);
    setCoachingTip('');
    setTipHistory([]);
    setGeneratedObjections([]);
    generatedObjectionsRef.current = [];
    setPhase('chatting');
    const now = Date.now();
    setStartTime(now);
    setElapsed(0);

    setIsLoading(true);

    // Fetch objections and opening message in parallel
    // Fire and forget — updates state when ready, doesn't block the opening message
    void fetch('/api/generate-objections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings,
        scenario: selectedScenario,
        prospectTitle: customProspect?.title,
        prospectIndustry: customProspect?.industry,
        difficulty: customProspect?.difficulty || 'medium',
      }),
    }).then(r => r.json()).then(data => {
      if (data.objections) {
        setGeneratedObjections(data.objections);
        generatedObjectionsRef.current = data.objections;
      }
    }).catch(() => { /* non-fatal */ });

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `[START] Begin the ${customProspect ? customProspect.title + ' roleplay' : scenarioObj.label} scenario. Start as the prospect. Set the scene with your opening line.` }],
          scenario: selectedScenario,
          settings,
          customProspectProfile: customProspect?.generatedProfile,
          framework: selectedFramework,
          generatedObjections: generatedObjectionsRef.current.map(o => o.objection),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to start session');
      }

      const data = await res.json();
      const prospectMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
        coachingTip: data.coachingTip,
      };

      setMessages([prospectMsg]);
      if (data.coachingTip) {
        setCoachingTip(data.coachingTip);
        setTipHistory([data.coachingTip]);
      }

      // If voice mode is on, speak the opening and auto-start listening
      if (voiceModeRef.current) {
        speakText(data.reply, () => {
          if (voiceModeRef.current) startListening();
        });
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to start session');
      setPhase('select');
    } finally {
      setIsLoading(false);
      if (!voiceModeRef.current) setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedScenario, speakText, startListening]);

  const endSession = async () => {
    if (messages.length < 2) {
      showToast('Have at least one exchange before ending the session');
      return;
    }
    window.speechSynthesis.cancel();
    recognitionRef.current?.stop();
    setVoiceStatus('idle');

    const settings = getSettings();
    const duration = Math.floor((Date.now() - startTime) / 1000);
    setPhase('analyzing');

    try {
      const cleanMessages = messages.filter((m) => !m.content.startsWith('[START]'));
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: cleanMessages, scenario: selectedScenario, settings, framework: selectedFramework }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to analyze session');
      }

      const analysisData: SessionAnalysis = await res.json();
      setAnalysis(analysisData);

      const scenarioObj = getScenarioById(selectedScenario);
      const session: Session = {
        id: `session-${Date.now()}`,
        scenario: selectedScenario,
        scenarioLabel: scenarioObj?.label || selectedScenario,
        messages: cleanMessages,
        analysis: analysisData,
        createdAt: new Date().toISOString(),
        durationSeconds: duration,
      };
      saveSession(session);
      setPhase('done');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to analyze session');
      setPhase('chatting');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleVoiceMode = () => {
    if (voiceMode) {
      window.speechSynthesis.cancel();
      recognitionRef.current?.stop();
      setVoiceStatus('idle');
      setLiveTranscript('');
    }
    setVoiceMode((v) => !v);
  };

  const handleCloseModal = () => router.push('/sessions');
  const scenarioObj = selectedScenario ? getScenarioById(selectedScenario) : null;

  // Voice status label
  const voiceStatusLabel: Record<VoiceStatus, string> = {
    idle: 'Click mic to speak',
    listening: 'Listening...',
    processing: 'Processing...',
    speaking: 'Prospect is speaking...',
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0d0d14' }}>
      <Sidebar />

      <main className="flex-1 ml-60 flex flex-col h-screen overflow-hidden">
        {/* ── PHASE: SELECT ─────────────────────────────────────── */}
        {phase === 'select' && (
          <div className="flex-1 p-8">
            <div className="mb-8 flex items-start justify-between max-w-4xl">
              <div>
                <h1 className="text-2xl font-bold mb-1" style={{ color: '#f1f5f9' }}>
                  Practice Session
                </h1>
                <p className="text-sm" style={{ color: '#64748b' }}>
                  Choose a scenario or build a custom prospect
                </p>
              </div>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ backgroundColor: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#6366f1' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(99,102,241,0.2)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(99,102,241,0.12)'; }}
              >
                <Sparkles size={14} />
                Custom Prospect
              </button>
            </div>

            {/* Custom prospect badge */}
            {customProspect && (
              <div
                className="max-w-4xl mb-4 flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ backgroundColor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)' }}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(99,102,241,0.2)' }}>
                  <User size={13} style={{ color: '#6366f1' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold" style={{ color: '#f1f5f9' }}>{customProspect.name}</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>{customProspect.title} · {customProspect.difficulty} difficulty</p>
                </div>
                <button onClick={() => setCustomProspect(null)} className="text-xs px-2 py-1 rounded-lg" style={{ color: '#64748b' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#64748b'; }}
                >
                  Remove
                </button>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 max-w-4xl">
              {SCENARIOS.map((scenario) => (
                <ScenarioCard
                  key={scenario.id}
                  scenario={scenario}
                  onSelect={(id) => setSelectedScenario(id)}
                  isSelected={selectedScenario === scenario.id}
                />
              ))}
            </div>

            {/* Framework selector */}
            <div className="mt-8 max-w-4xl">
              <p className="text-xs font-medium mb-3 flex items-center gap-2" style={{ color: '#94a3b8' }}>
                <BookOpen size={13} /> Sales Framework
              </p>
              <div className="flex flex-wrap gap-2">
                {FRAMEWORKS.map((fw) => (
                  <button
                    key={fw.id}
                    onClick={() => setSelectedFramework(fw.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor: selectedFramework === fw.id ? 'rgba(99,102,241,0.15)' : '#16161f',
                      border: `1px solid ${selectedFramework === fw.id ? '#6366f1' : '#2a2a3c'}`,
                      color: selectedFramework === fw.id ? '#6366f1' : '#64748b',
                    }}
                    title={fw.description}
                  >
                    {fw.shortName}
                  </button>
                ))}
              </div>
              {selectedFramework !== 'none' && (
                <p className="text-xs mt-2" style={{ color: '#64748b' }}>
                  {FRAMEWORKS.find(f => f.id === selectedFramework)?.description}
                </p>
              )}
            </div>

            {selectedScenario && (
              <div className="mt-6 max-w-4xl flex items-center gap-4">
                <button
                  onClick={startSession}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all"
                  style={{ backgroundColor: '#6366f1', color: 'white', opacity: isLoading ? 0.7 : 1 }}
                  onMouseEnter={(e) => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4f46e5'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6366f1'; }}
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {isLoading ? 'Starting...' : `Start ${scenarioObj?.label || 'Session'}`}
                </button>

                {/* Voice mode toggle on start screen */}
                {voiceSupported && (
                  <button
                    onClick={() => setVoiceMode((v) => !v)}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      backgroundColor: voiceMode ? 'rgba(99, 102, 241, 0.15)' : '#16161f',
                      border: `1px solid ${voiceMode ? '#6366f1' : '#2a2a3c'}`,
                      color: voiceMode ? '#6366f1' : '#64748b',
                    }}
                  >
                    {voiceMode ? <Mic size={15} /> : <MicOff size={15} />}
                    {voiceMode ? 'Voice mode ON' : 'Voice mode OFF'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── PHASE: CHATTING ───────────────────────────────────── */}
        {(phase === 'chatting' || phase === 'analyzing') && (
          <div className="flex flex-1 overflow-hidden">
            {/* Chat area */}
            <div className="flex flex-col overflow-hidden" style={{ width: '65%' }}>
              {/* Chat header */}
              <div
                className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
                style={{ backgroundColor: '#16161f', borderColor: '#2a2a3c' }}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { window.speechSynthesis.cancel(); recognitionRef.current?.stop(); setPhase('select'); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{ color: '#64748b' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1e1e2a'; (e.currentTarget as HTMLButtonElement).style.color = '#f1f5f9'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#64748b'; }}
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div>
                    <h2 className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>
                      {scenarioObj?.label || 'Practice Session'}
                    </h2>
                    <p className="text-xs" style={{ color: '#64748b' }}>
                      {messages.filter((m) => m.role === 'user').length} exchanges
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Voice toggle */}
                  {voiceSupported && (
                    <button
                      onClick={toggleVoiceMode}
                      title={voiceMode ? 'Switch to text mode' : 'Switch to voice mode'}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        backgroundColor: voiceMode ? 'rgba(99, 102, 241, 0.15)' : '#0d0d14',
                        border: `1px solid ${voiceMode ? '#6366f1' : '#2a2a3c'}`,
                        color: voiceMode ? '#6366f1' : '#64748b',
                      }}
                    >
                      {voiceMode ? <Volume2 size={12} /> : <VolumeX size={12} />}
                      {voiceMode ? 'Voice' : 'Text'}
                    </button>
                  )}

                  {/* Timer */}
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium"
                    style={{ backgroundColor: '#0d0d14', border: '1px solid #2a2a3c', color: '#94a3b8' }}
                  >
                    <Clock size={12} style={{ color: '#64748b' }} />
                    {formatDuration(elapsed)}
                  </div>

                  <button
                    onClick={endSession}
                    disabled={phase === 'analyzing' || messages.length < 2}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      backgroundColor: phase === 'analyzing' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.15)',
                      color: messages.length < 2 ? '#64748b' : '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      opacity: (phase === 'analyzing' || messages.length < 2) ? 0.6 : 1,
                    }}
                  >
                    {phase === 'analyzing' ? <Loader2 size={13} className="animate-spin" /> : <StopCircle size={13} />}
                    {phase === 'analyzing' ? 'Analyzing...' : 'End Session'}
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {messages
                  .filter((m) => !m.content.startsWith('[START]'))
                  .map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}

                {isLoading && (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(100, 116, 139, 0.15)', border: '1px solid #2a2a3c' }}
                    >
                      <span className="text-xs" style={{ color: '#64748b' }}>P</span>
                    </div>
                    <div
                      className="px-4 py-3 rounded-2xl flex items-center gap-1.5"
                      style={{ backgroundColor: '#16161f', border: '1px solid #2a2a3c', borderRadius: '18px 18px 18px 4px' }}
                    >
                      <span className="loading-dot w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#64748b' }} />
                      <span className="loading-dot w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#64748b' }} />
                      <span className="loading-dot w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#64748b' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area — text or voice */}
              <div
                className="px-6 py-4 border-t flex-shrink-0"
                style={{ backgroundColor: '#16161f', borderColor: '#2a2a3c' }}
              >
                {voiceMode ? (
                  /* ── VOICE INPUT UI ── */
                  <div className="flex flex-col items-center gap-3 py-2">
                    {/* Live transcript preview */}
                    {liveTranscript && (
                      <div
                        className="w-full px-4 py-2 rounded-xl text-sm text-center italic"
                        style={{ backgroundColor: '#0d0d14', border: '1px solid #2a2a3c', color: '#94a3b8' }}
                      >
                        &ldquo;{liveTranscript}&rdquo;
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      {/* Big mic button */}
                      <button
                        onClick={() => {
                          if (voiceStatus === 'listening') stopListening();
                          else if (voiceStatus === 'idle') startListening();
                        }}
                        disabled={voiceStatus === 'speaking' || voiceStatus === 'processing' || isLoading}
                        className="relative w-16 h-16 rounded-full flex items-center justify-center transition-all"
                        style={{
                          backgroundColor:
                            voiceStatus === 'listening' ? '#ef4444' :
                            voiceStatus === 'speaking' ? 'rgba(99,102,241,0.2)' :
                            isLoading ? '#2a2a3c' :
                            '#6366f1',
                          boxShadow: voiceStatus === 'listening' ? '0 0 0 0 rgba(239,68,68,0.4)' : 'none',
                          animation: voiceStatus === 'listening' ? 'micPulse 1.4s infinite' : 'none',
                          opacity: (voiceStatus === 'speaking' || voiceStatus === 'processing') ? 0.5 : 1,
                        }}
                      >
                        {isLoading || voiceStatus === 'processing' ? (
                          <Loader2 size={24} className="animate-spin" style={{ color: 'white' }} />
                        ) : voiceStatus === 'speaking' ? (
                          <Volume2 size={24} style={{ color: '#6366f1' }} />
                        ) : voiceStatus === 'listening' ? (
                          <MicOff size={24} style={{ color: 'white' }} />
                        ) : (
                          <Mic size={24} style={{ color: 'white' }} />
                        )}
                      </button>

                      {/* Status label */}
                      <p className="text-sm" style={{ color: voiceStatus === 'listening' ? '#ef4444' : voiceStatus === 'speaking' ? '#6366f1' : '#64748b' }}>
                        {isLoading ? 'Getting response...' : voiceStatusLabel[voiceStatus]}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* ── TEXT INPUT UI ── */
                  <>
                    <div
                      className="flex items-end gap-3 rounded-xl p-3"
                      style={{ backgroundColor: '#0d0d14', border: '1px solid #2a2a3c' }}
                    >
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your response... (Enter to send, Shift+Enter for new line)"
                        disabled={isLoading || phase === 'analyzing'}
                        rows={1}
                        className="flex-1 resize-none bg-transparent text-sm outline-none"
                        style={{ color: '#f1f5f9', maxHeight: '120px', minHeight: '24px', lineHeight: '1.5', caretColor: '#6366f1' }}
                        onInput={(e) => {
                          const el = e.target as HTMLTextAreaElement;
                          el.style.height = 'auto';
                          el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                        }}
                      />
                      <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || isLoading || phase === 'analyzing'}
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                        style={{
                          backgroundColor: !input.trim() || isLoading ? '#2a2a3c' : '#6366f1',
                          color: !input.trim() || isLoading ? '#64748b' : 'white',
                        }}
                        onMouseEnter={(e) => { if (input.trim() && !isLoading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4f46e5'; }}
                        onMouseLeave={(e) => { if (input.trim() && !isLoading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6366f1'; }}
                      >
                        {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      </button>
                    </div>
                    <p className="text-xs mt-2 text-center" style={{ color: '#64748b' }}>
                      Press Enter to send · Shift+Enter for new line
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Coaching Tips Panel */}
            <div className="flex flex-col border-l" style={{ width: '35%', backgroundColor: '#16161f', borderColor: '#2a2a3c' }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: '#2a2a3c' }}>
                <div className="flex items-center gap-2">
                  <Lightbulb size={15} style={{ color: '#f59e0b' }} />
                  <h3 className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>Coaching Tips</h3>
                </div>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>Live feedback after each exchange</p>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {/* Expected objections — shown before first coaching tip arrives */}
                {generatedObjections.length > 0 && (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(99,102,241,0.25)' }}>
                    <div className="px-3 py-2" style={{ backgroundColor: 'rgba(99,102,241,0.1)' }}>
                      <p className="text-xs font-semibold" style={{ color: '#6366f1' }}>⚡ Expect these objections</p>
                    </div>
                    <div className="divide-y" style={{ borderColor: '#2a2a3c' }}>
                      {generatedObjections.map((obj, i) => (
                        <div key={i} className="px-3 py-2.5" style={{ backgroundColor: '#0d0d14' }}>
                          <div className="flex items-start gap-2">
                            <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 capitalize"
                              style={{
                                backgroundColor:
                                  obj.category === 'price' ? 'rgba(239,68,68,0.15)' :
                                  obj.category === 'competition' ? 'rgba(245,158,11,0.15)' :
                                  obj.category === 'timing' ? 'rgba(99,102,241,0.15)' :
                                  'rgba(100,116,139,0.15)',
                                color:
                                  obj.category === 'price' ? '#ef4444' :
                                  obj.category === 'competition' ? '#f59e0b' :
                                  obj.category === 'timing' ? '#6366f1' :
                                  '#64748b',
                              }}
                            >
                              {obj.category}
                            </span>
                            <div>
                              <p className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>
                                &ldquo;{obj.objection}&rdquo;
                              </p>
                              <p className="text-xs mt-1 leading-relaxed" style={{ color: '#64748b' }}>
                                → {obj.handleTip}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {coachingTip ? (
                  <>
                    <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                      <p className="text-xs font-semibold mb-1.5" style={{ color: '#f59e0b' }}>Latest Tip</p>
                      <p className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>{coachingTip}</p>
                    </div>
                    {tipHistory.slice(1).map((tip, i) => (
                      <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: '#0d0d14', border: '1px solid #2a2a3c', opacity: 1 - (i * 0.15) }}>
                        <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>{tip}</p>
                      </div>
                    ))}
                  </>
                ) : generatedObjections.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-8">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                      <Lightbulb size={20} style={{ color: '#f59e0b' }} />
                    </div>
                    <p className="text-xs text-center" style={{ color: '#64748b' }}>Start the conversation to receive live coaching tips</p>
                  </div>
                ) : null}
              </div>

              <div className="p-4 border-t" style={{ borderColor: '#2a2a3c' }}>
                <p className="text-xs font-medium mb-1" style={{ color: '#64748b' }}>Current Scenario</p>
                <p className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>{scenarioObj?.label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{scenarioObj?.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── PHASE: DONE ──────────────────────────────────────── */}
        {phase === 'done' && analysis && (
          <>
            <div className="flex flex-1 h-screen overflow-hidden opacity-30 pointer-events-none">
              <div className="flex flex-col overflow-hidden" style={{ width: '65%' }}>
                <div className="px-6 py-4 border-b" style={{ backgroundColor: '#16161f', borderColor: '#2a2a3c' }}>
                  <h2 className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>{scenarioObj?.label}</h2>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  {messages.filter((m) => !m.content.startsWith('[START]')).map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
                </div>
              </div>
            </div>
            <AnalysisModal analysis={analysis} scenarioLabel={scenarioObj?.label || selectedScenario} frameworkName={getFrameworkById(selectedFramework)?.name} onClose={handleCloseModal} />
          </>
        )}
      </main>

      {toast && <Toast message={toast.message} type={toast.type} />}

      {showGenerateModal && (
        <GenerateScenarioModal
          settings={getSettings()}
          onStart={(prospect) => {
            setCustomProspect(prospect);
            setSelectedScenario('custom');
            setShowGenerateModal(false);
          }}
          onClose={() => setShowGenerateModal(false)}
        />
      )}
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#0d0d14' }}>
        <Loader2 size={24} className="animate-spin" style={{ color: '#6366f1' }} />
      </div>
    }>
      <PracticeContent />
    </Suspense>
  );
}
