'use client';

import { SessionAnalysis } from '@/lib/types';
import { X, CheckCircle, AlertCircle, TrendingUp, Mail, Copy, Check, MessageSquareX, ArrowRight, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AnalysisModalProps {
  analysis: SessionAnalysis;
  scenarioLabel: string;
  frameworkName?: string;
  onClose: () => void;
}

type Tab = 'overview' | 'mistakes' | 'email';

function ScoreRing({ score, size = 100 }: { score: number; size?: number }) {
  const r = size * 0.4;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#2a2a3c" strokeWidth="8" />
        <circle
          cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
          className="score-ring-circle"
          style={{ ['--dash-offset' as string]: dashOffset, transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        <span className="block text-xs" style={{ color: '#64748b' }}>/ 100</span>
      </div>
    </div>
  );
}

export default function AnalysisModal({ analysis, scenarioLabel, frameworkName, onClose }: AnalysisModalProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(analysis.followUpEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scoreLabel = analysis.score >= 80 ? 'Excellent' : analysis.score >= 70 ? 'Good' : analysis.score >= 55 ? 'Fair' : 'Needs Work';
  const scoreColor = analysis.score >= 80 ? '#22c55e' : analysis.score >= 70 ? '#f59e0b' : analysis.score >= 55 ? '#f59e0b' : '#ef4444';

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'mistakes', label: 'Mistakes & Fixes', count: analysis.mistakes?.length || 0 },
    { id: 'email', label: 'Follow-up Email' },
  ];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 100, backdropFilter: 'blur(4px)', opacity: mounted ? 1 : 0, transition: 'opacity 0.2s ease' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ backgroundColor: '#16161f', border: '1px solid #2a2a3c', transform: mounted ? 'translateY(0)' : 'translateY(16px)', transition: 'transform 0.3s ease' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: '#2a2a3c' }}>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: '#f1f5f9' }}>Session Analysis</h2>
            <p className="text-sm" style={{ color: '#64748b' }}>
              {scenarioLabel}{frameworkName && frameworkName !== 'No Framework' ? ` · ${frameworkName}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: '#64748b' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1e1e2a'; (e.currentTarget as HTMLButtonElement).style.color = '#f1f5f9'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#64748b'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b flex-shrink-0" style={{ borderColor: '#2a2a3c' }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-5 py-3 text-xs font-medium transition-colors relative"
              style={{ color: tab === t.id ? '#f1f5f9' : '#64748b' }}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                  {t.count}
                </span>
              )}
              {tab === t.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: '#6366f1' }} />
              )}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* ── OVERVIEW TAB ── */}
          {tab === 'overview' && (
            <>
              {/* Score */}
              <div className="flex items-center gap-6 p-5 rounded-xl" style={{ backgroundColor: '#0d0d14', border: '1px solid #2a2a3c' }}>
                <ScoreRing score={analysis.score} />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-2xl font-bold" style={{ color: scoreColor }}>{scoreLabel}</span>
                    {analysis.frameworkScore !== undefined && frameworkName && frameworkName !== 'No Framework' && (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#6366f1' }}>
                        <BookOpen size={11} />
                        {frameworkName}: {analysis.frameworkScore}/100
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{analysis.summary}</p>
                </div>
              </div>

              {/* Framework feedback */}
              {analysis.frameworkFeedback && frameworkName && frameworkName !== 'No Framework' && (
                <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <p className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: '#6366f1' }}>
                    <BookOpen size={12} /> {frameworkName} Assessment
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>{analysis.frameworkFeedback}</p>
                </div>
              )}

              {/* Talk ratio */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} style={{ color: '#6366f1' }} />
                    <span className="text-sm font-medium" style={{ color: '#f1f5f9' }}>Talk Ratio</span>
                  </div>
                  <span className="text-sm" style={{ color: '#64748b' }}>You: {analysis.talkRatio}% · Prospect: {100 - analysis.talkRatio}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#2a2a3c' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${analysis.talkRatio}%`, backgroundColor: analysis.talkRatio > 70 ? '#ef4444' : analysis.talkRatio < 30 ? '#f59e0b' : '#6366f1' }}
                  />
                </div>
                {analysis.talkRatio > 65 && (
                  <p className="text-xs mt-1" style={{ color: '#f59e0b' }}>You&apos;re talking too much. Aim for 40–60% talk ratio.</p>
                )}
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)' }}>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#22c55e' }}>
                    <CheckCircle size={14} /> Strengths
                  </h3>
                  <ul className="space-y-2">
                    {analysis.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: '#22c55e' }} />
                        <span className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#ef4444' }}>
                    <AlertCircle size={14} /> Improvements
                  </h3>
                  <ul className="space-y-2">
                    {analysis.improvements.map((imp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: '#ef4444' }} />
                        <span className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Hint to see mistakes tab */}
              {analysis.mistakes && analysis.mistakes.length > 0 && (
                <button onClick={() => setTab('mistakes')}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-medium transition-all"
                  style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.14)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.08)'; }}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquareX size={13} />
                    {analysis.mistakes.length} specific mistake{analysis.mistakes.length !== 1 ? 's' : ''} found — see what to say instead
                  </div>
                  <ArrowRight size={13} />
                </button>
              )}
            </>
          )}

          {/* ── MISTAKES & FIXES TAB ── */}
          {tab === 'mistakes' && (
            <>
              {analysis.mistakes && analysis.mistakes.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-xs" style={{ color: '#64748b' }}>
                    Specific moments from this call where a different approach would have worked better.
                  </p>
                  {analysis.mistakes.map((mistake, i) => (
                    <div key={i} className="rounded-xl overflow-hidden" style={{ border: '1px solid #2a2a3c' }}>
                      {/* What was said */}
                      <div className="px-4 py-3" style={{ backgroundColor: 'rgba(239,68,68,0.07)' }}>
                        <p className="text-xs font-semibold mb-1.5" style={{ color: '#ef4444' }}>
                          ✕ What you said
                        </p>
                        <p className="text-xs leading-relaxed italic" style={{ color: '#94a3b8' }}>
                          &ldquo;{mistake.whatWasSaid}&rdquo;
                        </p>
                        {mistake.whyItMissed && (
                          <p className="text-xs mt-1.5" style={{ color: '#64748b' }}>
                            {mistake.whyItMissed}
                          </p>
                        )}
                      </div>

                      {/* Divider with arrow */}
                      <div className="flex items-center gap-2 px-4 py-2" style={{ backgroundColor: '#0d0d14', borderTop: '1px solid #2a2a3c', borderBottom: '1px solid #2a2a3c' }}>
                        <div className="flex-1 h-px" style={{ backgroundColor: '#2a2a3c' }} />
                        <ArrowRight size={13} style={{ color: '#6366f1' }} />
                        <div className="flex-1 h-px" style={{ backgroundColor: '#2a2a3c' }} />
                      </div>

                      {/* What to say instead */}
                      <div className="px-4 py-3" style={{ backgroundColor: 'rgba(34,197,94,0.07)' }}>
                        <p className="text-xs font-semibold mb-1.5" style={{ color: '#22c55e' }}>
                          ✓ Say this instead
                        </p>
                        <p className="text-xs leading-relaxed italic" style={{ color: '#94a3b8' }}>
                          &ldquo;{mistake.whatToSayInstead}&rdquo;
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <CheckCircle size={32} style={{ color: '#22c55e' }} className="mb-3" />
                  <p className="text-sm font-medium" style={{ color: '#f1f5f9' }}>No major mistakes found</p>
                  <p className="text-xs mt-1" style={{ color: '#64748b' }}>Good session — check the Overview for improvement areas.</p>
                </div>
              )}
            </>
          )}

          {/* ── EMAIL TAB ── */}
          {tab === 'email' && (
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#0d0d14', border: '1px solid #2a2a3c' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#f1f5f9' }}>
                  <Mail size={14} style={{ color: '#6366f1' }} /> Suggested Follow-up Email
                </h3>
                <button onClick={handleCopyEmail}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor: copied ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)',
                    color: copied ? '#22c55e' : '#6366f1',
                    border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(99,102,241,0.3)'}`,
                  }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="text-xs leading-relaxed whitespace-pre-wrap font-sans" style={{ color: '#94a3b8' }}>
                {analysis.followUpEmail}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex-shrink-0" style={{ borderColor: '#2a2a3c' }}>
          <button onClick={onClose}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
            style={{ backgroundColor: '#6366f1', color: 'white' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4f46e5'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6366f1'; }}
          >
            Save & View Sessions
          </button>
        </div>
      </div>
    </div>
  );
}
