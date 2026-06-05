'use client';

import { useState, useEffect } from 'react';
import {
  History,
  ChevronDown,
  ChevronRight,
  Trash2,
  Phone,
  Search,
  Monitor,
  Shield,
  Target,
  DollarSign,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Mail,
  Filter,
  Clock,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import MessageBubble from '@/components/MessageBubble';
import { getSessions, deleteSession } from '@/lib/storage';
import { Session } from '@/lib/types';
import { SCENARIOS } from '@/lib/scenarios';
import Link from 'next/link';

const SCENARIO_ICONS: Record<string, LucideIcon> = {
  'cold-call': Phone,
  discovery: Search,
  demo: Monitor,
  objection: Shield,
  closing: Target,
  negotiation: DollarSign,
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
  const bg =
    score >= 80 ? 'rgba(34, 197, 94, 0.12)' : score >= 60 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)';
  const label = score >= 80 ? 'Excellent' : score >= 70 ? 'Good' : score >= 55 ? 'Fair' : 'Needs Work';
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
      style={{ color, backgroundColor: bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {score} · {label}
    </span>
  );
}

function formatDuration(seconds: number) {
  if (seconds >= 60) {
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterScenario, setFilterScenario] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'conversation' | 'analysis'>('analysis');

  useEffect(() => {
    setSessions(getSessions());
  }, []);

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      deleteSession(id);
      setSessions(getSessions());
      if (expandedId === id) setExpandedId(null);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const filtered = sessions
    .filter((s) => filterScenario === 'all' || s.scenario === filterScenario)
    .sort((a, b) => {
      if (sortBy === 'score') return b.analysis.score - a.analysis.score;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const expandedSession = expandedId ? sessions.find((s) => s.id === expandedId) : null;

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0d0d14' }}>
      <Sidebar />
      <main className="flex-1 ml-60 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#f1f5f9' }}>
              Sessions
            </h1>
            <p className="text-sm" style={{ color: '#64748b' }}>
              {sessions.length} total session{sessions.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
          <Link
            href="/practice"
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ backgroundColor: '#6366f1', color: 'white' }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#4f46e5')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#6366f1')
            }
          >
            + New Session
          </Link>
        </div>

        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              <History size={28} style={{ color: '#6366f1' }} />
            </div>
            <p className="text-base font-semibold mb-2" style={{ color: '#f1f5f9' }}>
              No sessions yet
            </p>
            <p className="text-sm mb-6" style={{ color: '#64748b' }}>
              Complete a practice session to see your history here
            </p>
            <Link
              href="/practice"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: '#6366f1', color: 'white' }}
            >
              Start Practicing
            </Link>
          </div>
        ) : (
          <div className="flex gap-6">
            {/* Sessions list */}
            <div style={{ width: expandedId ? '40%' : '100%', transition: 'width 0.3s ease' }}>
              {/* Filters */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Filter size={13} style={{ color: '#64748b' }} />
                  <span className="text-xs font-medium" style={{ color: '#64748b' }}>
                    Filter:
                  </span>
                </div>
                <select
                  value={filterScenario}
                  onChange={(e) => setFilterScenario(e.target.value)}
                  className="text-xs rounded-lg px-3 py-1.5 outline-none"
                  style={{
                    backgroundColor: '#16161f',
                    border: '1px solid #2a2a3c',
                    color: '#f1f5f9',
                  }}
                >
                  <option value="all">All Scenarios</option>
                  {SCENARIOS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'score')}
                  className="text-xs rounded-lg px-3 py-1.5 outline-none"
                  style={{
                    backgroundColor: '#16161f',
                    border: '1px solid #2a2a3c',
                    color: '#f1f5f9',
                  }}
                >
                  <option value="date">Sort by Date</option>
                  <option value="score">Sort by Score</option>
                </select>
                <span className="text-xs ml-auto" style={{ color: '#64748b' }}>
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                </span>
              </div>

              {filtered.length === 0 ? (
                <div
                  className="rounded-xl p-8 text-center"
                  style={{ backgroundColor: '#16161f', border: '1px solid #2a2a3c' }}
                >
                  <p className="text-sm" style={{ color: '#64748b' }}>
                    No sessions match the current filter
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((session) => {
                    const scenario = SCENARIOS.find((s) => s.id === session.scenario);
                    const Icon = SCENARIO_ICONS[session.scenario] || Phone;
                    const isExpanded = expandedId === session.id;
                    const date = new Date(session.createdAt);

                    return (
                      <div
                        key={session.id}
                        className="rounded-xl overflow-hidden transition-all"
                        style={{
                          backgroundColor: isExpanded ? '#1e1e2a' : '#16161f',
                          border: `1px solid ${isExpanded ? 'rgba(99, 102, 241, 0.3)' : '#2a2a3c'}`,
                        }}
                      >
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : session.id)}
                          className="w-full flex items-center gap-4 px-5 py-4 text-left"
                        >
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: `${scenario?.color || '#6366f1'}18`,
                              border: `1px solid ${scenario?.color || '#6366f1'}30`,
                            }}
                          >
                            <Icon size={17} color={scenario?.color || '#6366f1'} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>
                              {session.scenarioLabel}
                            </p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs" style={{ color: '#64748b' }}>
                                {date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              <span className="text-xs flex items-center gap-1" style={{ color: '#64748b' }}>
                                <Clock size={10} />
                                {formatDuration(session.durationSeconds)}
                              </span>
                              <span className="text-xs flex items-center gap-1" style={{ color: '#64748b' }}>
                                <MessageSquare size={10} />
                                {session.messages.filter((m) => m.role === 'user').length} msgs
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <ScoreBadge score={session.analysis.score} />
                            {isExpanded ? (
                              <ChevronDown size={15} style={{ color: '#64748b' }} />
                            ) : (
                              <ChevronRight size={15} style={{ color: '#64748b' }} />
                            )}
                          </div>
                        </button>

                        {/* Expanded inline summary (only when not side-panel mode) */}
                        {isExpanded && !expandedId && (
                          <div
                            className="px-5 pb-4 border-t"
                            style={{ borderColor: '#2a2a3c' }}
                          >
                            <p className="text-xs mt-3" style={{ color: '#94a3b8' }}>
                              {session.analysis.summary}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Session detail panel */}
            {expandedSession && (
              <div
                className="rounded-xl overflow-hidden flex flex-col"
                style={{
                  width: '60%',
                  backgroundColor: '#16161f',
                  border: '1px solid #2a2a3c',
                  maxHeight: 'calc(100vh - 160px)',
                }}
              >
                {/* Panel header */}
                <div
                  className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
                  style={{ borderColor: '#2a2a3c' }}
                >
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>
                      {expandedSession.scenarioLabel}
                    </h3>
                    <p className="text-xs" style={{ color: '#64748b' }}>
                      {new Date(expandedSession.createdAt).toLocaleDateString([], {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(expandedSession.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
                    style={{
                      backgroundColor:
                        confirmDelete === expandedSession.id
                          ? 'rgba(239, 68, 68, 0.2)'
                          : 'transparent',
                      color:
                        confirmDelete === expandedSession.id ? '#ef4444' : '#64748b',
                      border: `1px solid ${confirmDelete === expandedSession.id ? 'rgba(239, 68, 68, 0.4)' : 'transparent'}`,
                    }}
                  >
                    <Trash2 size={13} />
                    {confirmDelete === expandedSession.id ? 'Confirm Delete' : 'Delete'}
                  </button>
                </div>

                {/* Tabs */}
                <div
                  className="flex border-b flex-shrink-0"
                  style={{ borderColor: '#2a2a3c' }}
                >
                  {(['analysis', 'conversation'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className="px-5 py-3 text-xs font-medium capitalize transition-colors"
                      style={{
                        color: activeTab === tab ? '#6366f1' : '#64748b',
                        borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
                        marginBottom: '-1px',
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto p-5">
                  {activeTab === 'analysis' && (
                    <div className="space-y-5">
                      {/* Score */}
                      <div
                        className="p-4 rounded-xl flex items-center gap-4"
                        style={{ backgroundColor: '#0d0d14', border: '1px solid #2a2a3c' }}
                      >
                        <div className="text-center">
                          <div
                            className="text-3xl font-bold"
                            style={{
                              color:
                                expandedSession.analysis.score >= 80
                                  ? '#22c55e'
                                  : expandedSession.analysis.score >= 60
                                  ? '#f59e0b'
                                  : '#ef4444',
                            }}
                          >
                            {expandedSession.analysis.score}
                          </div>
                          <div className="text-xs" style={{ color: '#64748b' }}>
                            / 100
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>
                            {expandedSession.analysis.summary}
                          </p>
                        </div>
                      </div>

                      {/* Talk Ratio */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#f1f5f9' }}>
                            <TrendingUp size={12} style={{ color: '#6366f1' }} />
                            Talk Ratio
                          </span>
                          <span className="text-xs" style={{ color: '#64748b' }}>
                            You {expandedSession.analysis.talkRatio}% · Prospect {100 - expandedSession.analysis.talkRatio}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#2a2a3c' }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${expandedSession.analysis.talkRatio}%`,
                              backgroundColor:
                                expandedSession.analysis.talkRatio > 70 ? '#ef4444' : '#6366f1',
                            }}
                          />
                        </div>
                      </div>

                      {/* Strengths & Improvements */}
                      <div className="grid grid-cols-2 gap-3">
                        <div
                          className="p-4 rounded-xl"
                          style={{
                            backgroundColor: 'rgba(34, 197, 94, 0.05)',
                            border: '1px solid rgba(34, 197, 94, 0.15)',
                          }}
                        >
                          <h4
                            className="text-xs font-semibold mb-2 flex items-center gap-1.5"
                            style={{ color: '#22c55e' }}
                          >
                            <CheckCircle size={12} />
                            Strengths
                          </h4>
                          <ul className="space-y-1.5">
                            {expandedSession.analysis.strengths.map((s, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: '#22c55e' }} />
                                <span className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div
                          className="p-4 rounded-xl"
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.05)',
                            border: '1px solid rgba(239, 68, 68, 0.15)',
                          }}
                        >
                          <h4
                            className="text-xs font-semibold mb-2 flex items-center gap-1.5"
                            style={{ color: '#ef4444' }}
                          >
                            <AlertCircle size={12} />
                            Improvements
                          </h4>
                          <ul className="space-y-1.5">
                            {expandedSession.analysis.improvements.map((imp, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: '#ef4444' }} />
                                <span className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>{imp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Follow-up email */}
                      <div
                        className="p-4 rounded-xl"
                        style={{ backgroundColor: '#0d0d14', border: '1px solid #2a2a3c' }}
                      >
                        <h4
                          className="text-xs font-semibold mb-3 flex items-center gap-1.5"
                          style={{ color: '#f1f5f9' }}
                        >
                          <Mail size={12} style={{ color: '#6366f1' }} />
                          Follow-up Email Draft
                        </h4>
                        <pre
                          className="text-xs leading-relaxed whitespace-pre-wrap font-sans"
                          style={{ color: '#94a3b8' }}
                        >
                          {expandedSession.analysis.followUpEmail}
                        </pre>
                      </div>
                    </div>
                  )}

                  {activeTab === 'conversation' && (
                    <div className="space-y-4">
                      {expandedSession.messages.map((msg) => (
                        <MessageBubble key={msg.id} message={msg} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
