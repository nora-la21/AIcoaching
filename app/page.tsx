'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Clock,
  Flame,
  Star,
  Play,
  ChevronRight,
  Lightbulb,
  TrendingUp,
  Phone,
  Search,
  Monitor,
  Shield,
  Target,
  DollarSign,
  type LucideIcon,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { getSessions } from '@/lib/storage';
import { Session } from '@/lib/types';
import { SCENARIOS } from '@/lib/scenarios';

const SCENARIO_ICONS: Record<string, LucideIcon> = {
  'cold-call': Phone,
  discovery: Search,
  demo: Monitor,
  objection: Shield,
  closing: Target,
  negotiation: DollarSign,
};

const COACHING_TIPS = [
  "The best salespeople listen twice as much as they talk. Aim for a 40/60 talk ratio today.",
  "When you hear 'it's too expensive', the real objection is usually about value. Dig deeper.",
  "Start your calls with a strong reason for calling — not 'How are you?' — but a compelling insight.",
  "Always confirm the next step before ending any call. 'Does Tuesday at 2pm work for a 30-minute follow-up?'",
  "Mirror your prospect's language and vocabulary. It builds instant rapport and trust.",
  "The close starts at the very beginning of the call. Every question should move you forward.",
  "Silence is powerful. After asking a question, wait. The first person to speak loses.",
  "Find the pain before presenting the solution. Pain drives urgency, not features.",
];

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
  const bg =
    score >= 80 ? 'rgba(34, 197, 94, 0.12)' : score >= 60 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)';
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ color, backgroundColor: bg }}
    >
      {score}
    </span>
  );
}

export default function DashboardPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [todayTip, setTodayTip] = useState('');

  useEffect(() => {
    const data = getSessions();
    setSessions(data);
    // Pick a tip based on day of year
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    setTodayTip(COACHING_TIPS[dayOfYear % COACHING_TIPS.length]);
  }, []);

  // Stats
  const totalSessions = sessions.length;
  const avgScore =
    totalSessions > 0
      ? Math.round(sessions.reduce((a, s) => a + s.analysis.score, 0) / totalSessions)
      : 0;
  const hoursPracticed =
    Math.round((sessions.reduce((a, s) => a + s.durationSeconds, 0) / 3600) * 10) / 10;

  // Streak: count consecutive days with sessions
  const streak = (() => {
    if (sessions.length === 0) return 0;
    const days = new Set(
      sessions.map((s) => new Date(s.createdAt).toDateString())
    );
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (days.has(d.toDateString())) {
        count++;
      } else if (i > 0) {
        break;
      }
    }
    return count;
  })();

  const recentSessions = sessions.slice(0, 5);

  const stats = [
    {
      label: 'Total Sessions',
      value: totalSessions,
      icon: BarChart3,
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.1)',
      suffix: '',
    },
    {
      label: 'Avg Score',
      value: avgScore,
      icon: Star,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
      suffix: '',
    },
    {
      label: 'Hours Practiced',
      value: hoursPracticed,
      icon: Clock,
      color: '#06b6d4',
      bg: 'rgba(6, 182, 212, 0.1)',
      suffix: 'h',
    },
    {
      label: 'Day Streak',
      value: streak,
      icon: Flame,
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.1)',
      suffix: streak === 1 ? ' day' : ' days',
    },
  ];

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0d0d14' }}>
      <Sidebar />

      <main className="flex-1 ml-60 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#f1f5f9' }}>
            Welcome back 👋
          </h1>
          <p className="text-sm" style={{ color: '#64748b' }}>
            Ready to sharpen your sales skills today?
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, color, bg, suffix }) => (
            <div
              key={label}
              className="rounded-xl p-5"
              style={{
                backgroundColor: '#16161f',
                border: '1px solid #2a2a3c',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium" style={{ color: '#64748b' }}>
                  {label}
                </span>
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: bg }}
                >
                  <Icon size={17} color={color} />
                </div>
              </div>
              <div className="text-3xl font-bold" style={{ color: '#f1f5f9' }}>
                {value}
                <span className="text-lg font-medium ml-0.5" style={{ color: '#64748b' }}>
                  {suffix}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Main content: Recent Sessions + Quick Start */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Recent Sessions */}
          <div
            className="col-span-2 rounded-xl p-5"
            style={{ backgroundColor: '#16161f', border: '1px solid #2a2a3c' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: '#f1f5f9' }}>
                Recent Sessions
              </h2>
              {sessions.length > 0 && (
                <Link
                  href="/sessions"
                  className="flex items-center gap-1 text-xs font-medium transition-colors"
                  style={{ color: '#6366f1' }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#4f46e5')}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#6366f1')}
                >
                  View all <ChevronRight size={13} />
                </Link>
              )}
            </div>

            {recentSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}
                >
                  <TrendingUp size={24} style={{ color: '#6366f1' }} />
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: '#f1f5f9' }}>
                  No sessions yet
                </p>
                <p className="text-xs text-center" style={{ color: '#64748b' }}>
                  Complete your first practice session to see your progress here
                </p>
                <Link
                  href="/practice"
                  className="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ backgroundColor: '#6366f1', color: 'white' }}
                >
                  Start Practicing
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentSessions.map((session) => {
                  const Icon = SCENARIO_ICONS[session.scenario] || Phone;
                  const scenario = SCENARIOS.find((s) => s.id === session.scenario);
                  const date = new Date(session.createdAt);
                  const dateStr = date.toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  });
                  const timeStr = date.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const dur = session.durationSeconds;
                  const durStr =
                    dur >= 60
                      ? `${Math.floor(dur / 60)}m ${dur % 60}s`
                      : `${dur}s`;

                  return (
                    <Link
                      key={session.id}
                      href="/sessions"
                      className="flex items-center gap-4 px-4 py-3 rounded-lg transition-colors group"
                      style={{ backgroundColor: 'transparent' }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#1e1e2a')
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent')
                      }
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: `${scenario?.color || '#6366f1'}18`,
                          border: `1px solid ${scenario?.color || '#6366f1'}30`,
                        }}
                      >
                        <Icon size={16} color={scenario?.color || '#6366f1'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: '#f1f5f9' }}>
                          {session.scenarioLabel}
                        </p>
                        <p className="text-xs" style={{ color: '#64748b' }}>
                          {dateStr} at {timeStr} · {durStr}
                        </p>
                      </div>
                      <ScoreBadge score={session.analysis.score} />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Start */}
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: '#16161f', border: '1px solid #2a2a3c' }}
          >
            <h2 className="text-base font-semibold mb-4" style={{ color: '#f1f5f9' }}>
              Quick Start
            </h2>
            <div className="space-y-2">
              {SCENARIOS.slice(0, 5).map((scenario) => {
                const Icon = SCENARIO_ICONS[scenario.id] || Phone;
                return (
                  <Link
                    key={scenario.id}
                    href={`/practice?scenario=${scenario.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group"
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.backgroundColor = '#1e1e2a';
                      el.style.borderColor = '#2a2a3c';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.backgroundColor = 'transparent';
                      el.style.borderColor = 'transparent';
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${scenario.color}18` }}
                    >
                      <Icon size={13} color={scenario.color} />
                    </div>
                    <span className="text-sm flex-1 truncate" style={{ color: '#94a3b8' }}>
                      {scenario.label}
                    </span>
                    <Play
                      size={13}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: '#6366f1' }}
                    />
                  </Link>
                );
              })}
            </div>
            <Link
              href="/practice"
              className="mt-4 w-full py-2.5 rounded-lg text-sm font-semibold text-center flex items-center justify-center gap-2 transition-colors"
              style={{ backgroundColor: '#6366f1', color: 'white' }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#4f46e5')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#6366f1')
              }
            >
              <Play size={14} />
              Start Practice
            </Link>
          </div>
        </div>

        {/* Coaching Tip of the Day */}
        {todayTip && (
          <div
            className="rounded-xl p-5 flex items-start gap-4"
            style={{
              backgroundColor: 'rgba(99, 102, 241, 0.06)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}
            >
              <Lightbulb size={18} style={{ color: '#6366f1' }} />
            </div>
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: '#6366f1' }}>
                Coaching Tip of the Day
              </p>
              <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
                {todayTip}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
