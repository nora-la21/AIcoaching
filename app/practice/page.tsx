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
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import MessageBubble from '@/components/MessageBubble';
import ScenarioCard from '@/components/ScenarioCard';
import AnalysisModal from '@/components/AnalysisModal';
import { SCENARIOS, getScenarioById } from '@/lib/scenarios';
import { getSettings, saveSession } from '@/lib/storage';
import { ChatMessage, Session, SessionAnalysis } from '@/lib/types';

type Phase = 'select' | 'chatting' | 'analyzing' | 'done';

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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, startTime]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const startSession = useCallback(async () => {
    if (!selectedScenario) return;
    const settings = getSettings();
    const scenarioObj = getScenarioById(selectedScenario);
    if (!scenarioObj) return;

    setMessages([]);
    setCoachingTip('');
    setTipHistory([]);
    setPhase('chatting');
    const now = Date.now();
    setStartTime(now);
    setElapsed(0);

    // Send initial message to get prospect's opening
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `[START] Begin the ${scenarioObj.label} scenario. Start as the prospect. Set the scene with your opening line.`,
            },
          ],
          scenario: selectedScenario,
          settings,
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
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to start session');
      setPhase('select');
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedScenario]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const settings = getSettings();

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Build API messages: exclude [START] message
      const apiMessages = updatedMessages
        .filter((m) => !m.content.startsWith('[START]'))
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          scenario: selectedScenario,
          settings,
        }),
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
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send message');
      setMessages((prev) => prev.slice(0, -1)); // Remove the user message on error
      setInput(userMsg.content);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const endSession = async () => {
    if (messages.length < 2) {
      showToast('Have at least one exchange before ending the session');
      return;
    }

    const settings = getSettings();
    const duration = Math.floor((Date.now() - startTime) / 1000);
    setPhase('analyzing');

    try {
      const cleanMessages = messages.filter((m) => !m.content.startsWith('[START]'));

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: cleanMessages,
          scenario: selectedScenario,
          settings,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to analyze session');
      }

      const analysisData: SessionAnalysis = await res.json();
      setAnalysis(analysisData);

      // Save session
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

  const handleCloseModal = () => {
    router.push('/sessions');
  };

  const scenarioObj = selectedScenario ? getScenarioById(selectedScenario) : null;

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0d0d14' }}>
      <Sidebar />

      <main className="flex-1 ml-60 flex flex-col min-h-screen">
        {/* ── PHASE: SELECT ─────────────────────────────────────── */}
        {phase === 'select' && (
          <div className="flex-1 p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-1" style={{ color: '#f1f5f9' }}>
                Practice Session
              </h1>
              <p className="text-sm" style={{ color: '#64748b' }}>
                Choose a scenario to practice and sharpen your sales skills
              </p>
            </div>

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

            {selectedScenario && (
              <div className="mt-8 max-w-4xl">
                <button
                  onClick={startSession}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    backgroundColor: '#6366f1',
                    color: 'white',
                    opacity: isLoading ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4f46e5';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6366f1';
                  }}
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  {isLoading
                    ? 'Starting...'
                    : `Start ${scenarioObj?.label || 'Session'}`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── PHASE: CHATTING ───────────────────────────────────── */}
        {(phase === 'chatting' || phase === 'analyzing') && (
          <div className="flex flex-1 h-screen overflow-hidden">
            {/* Chat area */}
            <div className="flex flex-col" style={{ width: '65%' }}>
              {/* Chat header */}
              <div
                className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
                style={{ backgroundColor: '#16161f', borderColor: '#2a2a3c' }}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPhase('select')}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{ color: '#64748b' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1e1e2a';
                      (e.currentTarget as HTMLButtonElement).style.color = '#f1f5f9';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                      (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
                    }}
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
                  {/* Timer */}
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium"
                    style={{
                      backgroundColor: '#0d0d14',
                      border: '1px solid #2a2a3c',
                      color: '#94a3b8',
                    }}
                  >
                    <Clock size={12} style={{ color: '#64748b' }} />
                    {formatDuration(elapsed)}
                  </div>

                  <button
                    onClick={endSession}
                    disabled={phase === 'analyzing' || messages.length < 2}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      backgroundColor:
                        phase === 'analyzing'
                          ? 'rgba(239, 68, 68, 0.1)'
                          : 'rgba(239, 68, 68, 0.15)',
                      color:
                        messages.length < 2 ? '#64748b' : '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      opacity: (phase === 'analyzing' || messages.length < 2) ? 0.6 : 1,
                    }}
                  >
                    {phase === 'analyzing' ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <StopCircle size={13} />
                    )}
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
                      style={{
                        backgroundColor: 'rgba(100, 116, 139, 0.15)',
                        border: '1px solid #2a2a3c',
                      }}
                    >
                      <span className="text-xs" style={{ color: '#64748b' }}>P</span>
                    </div>
                    <div
                      className="px-4 py-3 rounded-2xl flex items-center gap-1.5"
                      style={{
                        backgroundColor: '#16161f',
                        border: '1px solid #2a2a3c',
                        borderRadius: '18px 18px 18px 4px',
                      }}
                    >
                      <span className="loading-dot w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#64748b' }} />
                      <span className="loading-dot w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#64748b' }} />
                      <span className="loading-dot w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#64748b' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div
                className="px-6 py-4 border-t flex-shrink-0"
                style={{ backgroundColor: '#16161f', borderColor: '#2a2a3c' }}
              >
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
                    style={{
                      color: '#f1f5f9',
                      maxHeight: '120px',
                      minHeight: '24px',
                      lineHeight: '1.5',
                      caretColor: '#6366f1',
                    }}
                    onInput={(e) => {
                      const el = e.target as HTMLTextAreaElement;
                      el.style.height = 'auto';
                      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading || phase === 'analyzing'}
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{
                      backgroundColor:
                        !input.trim() || isLoading ? '#2a2a3c' : '#6366f1',
                      color: !input.trim() || isLoading ? '#64748b' : 'white',
                    }}
                    onMouseEnter={(e) => {
                      if (input.trim() && !isLoading)
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4f46e5';
                    }}
                    onMouseLeave={(e) => {
                      if (input.trim() && !isLoading)
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6366f1';
                    }}
                  >
                    {isLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                  </button>
                </div>
                <p className="text-xs mt-2 text-center" style={{ color: '#64748b' }}>
                  Press Enter to send · Shift+Enter for new line
                </p>
              </div>
            </div>

            {/* Coaching Tips Panel */}
            <div
              className="flex flex-col border-l"
              style={{
                width: '35%',
                backgroundColor: '#16161f',
                borderColor: '#2a2a3c',
              }}
            >
              <div
                className="px-5 py-4 border-b"
                style={{ borderColor: '#2a2a3c' }}
              >
                <div className="flex items-center gap-2">
                  <Lightbulb size={15} style={{ color: '#f59e0b' }} />
                  <h3 className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>
                    Coaching Tips
                  </h3>
                </div>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                  Live feedback after each exchange
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {coachingTip ? (
                  <>
                    {/* Latest tip */}
                    <div
                      className="p-4 rounded-xl"
                      style={{
                        backgroundColor: 'rgba(245, 158, 11, 0.06)',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                      }}
                    >
                      <p className="text-xs font-semibold mb-1.5" style={{ color: '#f59e0b' }}>
                        Latest Tip
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>
                        {coachingTip}
                      </p>
                    </div>

                    {/* Previous tips */}
                    {tipHistory.slice(1).map((tip, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg"
                        style={{
                          backgroundColor: '#0d0d14',
                          border: '1px solid #2a2a3c',
                          opacity: 1 - (i * 0.15),
                        }}
                      >
                        <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
                          {tip}
                        </p>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-8">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                      style={{
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                      }}
                    >
                      <Lightbulb size={20} style={{ color: '#f59e0b' }} />
                    </div>
                    <p className="text-xs text-center" style={{ color: '#64748b' }}>
                      Start the conversation to receive live coaching tips
                    </p>
                  </div>
                )}
              </div>

              {/* Scenario info */}
              <div
                className="p-4 border-t"
                style={{ borderColor: '#2a2a3c' }}
              >
                <p className="text-xs font-medium mb-1" style={{ color: '#64748b' }}>
                  Current Scenario
                </p>
                <p className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>
                  {scenarioObj?.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                  {scenarioObj?.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── PHASE: DONE (Analysis Modal) ─────────────────────── */}
        {phase === 'done' && analysis && (
          <>
            {/* Keep the chat visible behind the modal */}
            <div className="flex flex-1 h-screen overflow-hidden opacity-30 pointer-events-none">
              <div className="flex flex-col" style={{ width: '65%' }}>
                <div
                  className="px-6 py-4 border-b"
                  style={{ backgroundColor: '#16161f', borderColor: '#2a2a3c' }}
                >
                  <h2 className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>
                    {scenarioObj?.label}
                  </h2>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  {messages
                    .filter((m) => !m.content.startsWith('[START]'))
                    .map((msg) => (
                      <MessageBubble key={msg.id} message={msg} />
                    ))}
                </div>
              </div>
            </div>
            <AnalysisModal
              analysis={analysis}
              scenarioLabel={scenarioObj?.label || selectedScenario}
              onClose={handleCloseModal}
            />
          </>
        )}
      </main>

      {toast && <Toast message={toast.message} type={toast.type} />}
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
