'use client';

import { SessionAnalysis } from '@/lib/types';
import { X, CheckCircle, AlertCircle, TrendingUp, Mail, Copy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AnalysisModalProps {
  analysis: SessionAnalysis;
  scenarioLabel: string;
  onClose: () => void;
}

function ScoreRing({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  const color =
    score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="100" height="100" className="-rotate-90">
        {/* Background track */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#2a2a3c"
          strokeWidth="8"
        />
        {/* Score arc */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="score-ring-circle"
          style={{
            ['--dash-offset' as string]: dashOffset,
            transition: 'stroke-dashoffset 1s ease-out',
          }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-2xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="block text-xs" style={{ color: '#64748b' }}>
          / 100
        </span>
      </div>
    </div>
  );
}

export default function AnalysisModal({ analysis, scenarioLabel, onClose }: AnalysisModalProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Prevent scrolling when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(analysis.followUpEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scoreLabel =
    analysis.score >= 80
      ? 'Excellent'
      : analysis.score >= 70
      ? 'Good'
      : analysis.score >= 55
      ? 'Fair'
      : 'Needs Work';

  const scoreColor =
    analysis.score >= 80
      ? '#22c55e'
      : analysis.score >= 70
      ? '#f59e0b'
      : analysis.score >= 55
      ? '#f59e0b'
      : '#ef4444';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        zIndex: 100,
        backdropFilter: 'blur(4px)',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.2s ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{
          backgroundColor: '#16161f',
          border: '1px solid #2a2a3c',
          transform: mounted ? 'translateY(0)' : 'translateY(16px)',
          transition: 'transform 0.3s ease',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b sticky top-0"
          style={{ backgroundColor: '#16161f', borderColor: '#2a2a3c', zIndex: 10 }}
        >
          <div>
            <h2 className="text-lg font-semibold" style={{ color: '#f1f5f9' }}>
              Session Analysis
            </h2>
            <p className="text-sm" style={{ color: '#64748b' }}>
              {scenarioLabel} Practice
            </p>
          </div>
          <button
            onClick={onClose}
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
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Score section */}
          <div
            className="flex items-center gap-6 p-5 rounded-xl"
            style={{ backgroundColor: '#0d0d14', border: '1px solid #2a2a3c' }}
          >
            <ScoreRing score={analysis.score} />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-bold" style={{ color: scoreColor }}>
                  {scoreLabel}
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
                {analysis.summary}
              </p>
            </div>
          </div>

          {/* Talk ratio */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} style={{ color: '#6366f1' }} />
                <span className="text-sm font-medium" style={{ color: '#f1f5f9' }}>
                  Talk Ratio
                </span>
              </div>
              <span className="text-sm" style={{ color: '#64748b' }}>
                You: {analysis.talkRatio}% · Prospect: {100 - analysis.talkRatio}%
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: '#2a2a3c' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${analysis.talkRatio}%`,
                  backgroundColor:
                    analysis.talkRatio > 70
                      ? '#ef4444'
                      : analysis.talkRatio < 30
                      ? '#f59e0b'
                      : '#6366f1',
                }}
              />
            </div>
            {analysis.talkRatio > 65 && (
              <p className="text-xs mt-1" style={{ color: '#f59e0b' }}>
                You&apos;re talking too much. Aim for 40-60% talk ratio.
              </p>
            )}
          </div>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-2 gap-4">
            {/* Strengths */}
            <div
              className="p-4 rounded-xl"
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.05)',
                border: '1px solid rgba(34, 197, 94, 0.15)',
              }}
            >
              <h3
                className="text-sm font-semibold mb-3 flex items-center gap-2"
                style={{ color: '#22c55e' }}
              >
                <CheckCircle size={14} />
                Strengths
              </h3>
              <ul className="space-y-2">
                {analysis.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: '#22c55e' }}
                    />
                    <span className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>
                      {s}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div
              className="p-4 rounded-xl"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
              }}
            >
              <h3
                className="text-sm font-semibold mb-3 flex items-center gap-2"
                style={{ color: '#ef4444' }}
              >
                <AlertCircle size={14} />
                Improvements
              </h3>
              <ul className="space-y-2">
                {analysis.improvements.map((imp, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: '#ef4444' }}
                    />
                    <span className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>
                      {imp}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Follow-up Email */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: '#0d0d14', border: '1px solid #2a2a3c' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-sm font-semibold flex items-center gap-2"
                style={{ color: '#f1f5f9' }}
              >
                <Mail size={14} style={{ color: '#6366f1' }} />
                Suggested Follow-up Email
              </h3>
              <button
                onClick={handleCopyEmail}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  backgroundColor: copied ? 'rgba(34, 197, 94, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                  color: copied ? '#22c55e' : '#6366f1',
                  border: `1px solid ${copied ? 'rgba(34, 197, 94, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre
              className="text-xs leading-relaxed whitespace-pre-wrap font-sans"
              style={{ color: '#94a3b8' }}
            >
              {analysis.followUpEmail}
            </pre>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
            style={{
              backgroundColor: '#6366f1',
              color: 'white',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4f46e5';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6366f1';
            }}
          >
            Save & View Sessions
          </button>
        </div>
      </div>
    </div>
  );
}
