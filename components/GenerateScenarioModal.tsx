'use client';

import { useState } from 'react';
import { Sparkles, X, Loader2, ChevronDown, User, Play } from 'lucide-react';
import { Settings, CustomProspect } from '@/lib/types';

const INDUSTRIES = [
  'Any', 'Technology', 'Healthcare', 'Finance', 'Manufacturing',
  'Retail', 'Education', 'Real Estate', 'Legal', 'Marketing & Advertising',
  'Logistics', 'Energy', 'Pharma', 'Government', 'Non-profit',
];

interface Props {
  settings: Settings;
  onStart: (prospect: CustomProspect) => void;
  onClose: () => void;
}

export default function GenerateScenarioModal({ settings, onStart, onClose }: Props) {
  const [description, setDescription] = useState('');
  const [prospectName, setProspectName] = useState('');
  const [prospectTitle, setProspectTitle] = useState('');
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('Any');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState<CustomProspect | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!description.trim() && !prospectTitle.trim()) {
      setError('Add a description or at least a job title to continue.');
      return;
    }
    setIsGenerating(true);
    setError('');
    setGenerated(null);

    try {
      const res = await fetch('/api/generate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, prospectName, prospectTitle, company, industry, difficulty, settings }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate');
      }

      const data = await res.json();
      setGenerated(data.prospect);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const difficultyColors = {
    easy: { bg: 'rgba(34, 197, 94, 0.15)', border: '#22c55e', text: '#22c55e' },
    medium: { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#f59e0b' },
    hard: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#ef4444' },
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: '#16161f', border: '1px solid #2a2a3c' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#2a2a3c' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
            >
              <Sparkles size={15} style={{ color: '#6366f1' }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>Generate Custom Prospect</h2>
              <p className="text-xs" style={{ color: '#64748b' }}>AI builds a realistic persona for your practice</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ color: '#64748b' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1e1e2a'; (e.currentTarget as HTMLButtonElement).style.color = '#f1f5f9'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#64748b'; }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {!generated ? (
            <>
              {/* Main description */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>
                  Describe the prospect <span style={{ color: '#64748b' }}>(required)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. A skeptical VP of Operations at a mid-size logistics company. They care about cost reduction and integration with their existing WMS. Currently using a competitor."
                  rows={3}
                  className="w-full resize-none text-sm rounded-xl px-4 py-3 outline-none"
                  style={{
                    backgroundColor: '#0d0d14',
                    border: '1px solid #2a2a3c',
                    color: '#f1f5f9',
                    lineHeight: '1.6',
                    caretColor: '#6366f1',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#6366f1'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#2a2a3c'; }}
                />
                <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                  {description.length}/500 — the more detail, the better the persona
                </p>
              </div>

              {/* Name + Title row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>
                    Prospect name <span style={{ color: '#64748b' }}>(optional)</span>
                  </label>
                  <input
                    value={prospectName}
                    onChange={(e) => setProspectName(e.target.value)}
                    placeholder="e.g. Sarah Chen"
                    className="w-full text-sm rounded-xl px-4 py-2.5 outline-none"
                    style={{ backgroundColor: '#0d0d14', border: '1px solid #2a2a3c', color: '#f1f5f9', caretColor: '#6366f1' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#6366f1'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#2a2a3c'; }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>
                    Job title
                  </label>
                  <input
                    value={prospectTitle}
                    onChange={(e) => setProspectTitle(e.target.value)}
                    placeholder="e.g. VP of Operations"
                    className="w-full text-sm rounded-xl px-4 py-2.5 outline-none"
                    style={{ backgroundColor: '#0d0d14', border: '1px solid #2a2a3c', color: '#f1f5f9', caretColor: '#6366f1' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#6366f1'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#2a2a3c'; }}
                  />
                </div>
              </div>

              {/* Company + Industry row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>Company</label>
                  <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Acme Logistics Inc."
                    className="w-full text-sm rounded-xl px-4 py-2.5 outline-none"
                    style={{ backgroundColor: '#0d0d14', border: '1px solid #2a2a3c', color: '#f1f5f9', caretColor: '#6366f1' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#6366f1'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#2a2a3c'; }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>Industry</label>
                  <div className="relative">
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full text-sm rounded-xl px-4 py-2.5 outline-none appearance-none pr-8"
                      style={{ backgroundColor: '#0d0d14', border: '1px solid #2a2a3c', color: '#f1f5f9' }}
                    >
                      {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#64748b' }} />
                  </div>
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: '#94a3b8' }}>Difficulty</label>
                <div className="flex gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((d) => {
                    const active = difficulty === d;
                    const c = difficultyColors[d];
                    return (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all"
                        style={{
                          backgroundColor: active ? c.bg : '#0d0d14',
                          border: `1px solid ${active ? c.border : '#2a2a3c'}`,
                          color: active ? c.text : '#64748b',
                        }}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs mt-1.5" style={{ color: '#64748b' }}>
                  {difficulty === 'easy' && 'Receptive prospect, clear budget, minimal objections'}
                  {difficulty === 'medium' && 'Realistic objections, needs convincing, evaluating alternatives'}
                  {difficulty === 'hard' && 'Skeptical, tight budget, strong competitor loyalty'}
                </p>
              </div>

              {error && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
                  {error}
                </p>
              )}

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{
                  backgroundColor: isGenerating ? 'rgba(99,102,241,0.3)' : '#6366f1',
                  color: 'white',
                  opacity: isGenerating ? 0.8 : 1,
                }}
                onMouseEnter={(e) => { if (!isGenerating) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4f46e5'; }}
                onMouseLeave={(e) => { if (!isGenerating) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6366f1'; }}
              >
                {isGenerating ? (
                  <><Loader2 size={15} className="animate-spin" /> Generating prospect profile...</>
                ) : (
                  <><Sparkles size={15} /> Generate Prospect</>
                )}
              </button>
            </>
          ) : (
            /* ── GENERATED PROFILE PREVIEW ── */
            <>
              <div
                className="flex items-center gap-3 p-4 rounded-xl"
                style={{ backgroundColor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}
                >
                  <User size={18} style={{ color: '#6366f1' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>{generated.name}</p>
                  <p className="text-xs" style={{ color: '#94a3b8' }}>
                    {generated.title}{generated.company && generated.company !== 'Prospect Company' ? ` · ${generated.company}` : ''}{generated.industry !== 'Any' ? ` · ${generated.industry}` : ''}
                  </p>
                </div>
                <span
                  className="ml-auto text-xs px-2.5 py-1 rounded-lg font-semibold capitalize"
                  style={{
                    backgroundColor: difficultyColors[generated.difficulty].bg,
                    border: `1px solid ${difficultyColors[generated.difficulty].border}`,
                    color: difficultyColors[generated.difficulty].text,
                  }}
                >
                  {generated.difficulty}
                </span>
              </div>

              {/* Profile preview */}
              <div
                className="rounded-xl p-4 text-xs leading-relaxed max-h-48 overflow-y-auto"
                style={{ backgroundColor: '#0d0d14', border: '1px solid #2a2a3c', color: '#94a3b8', whiteSpace: 'pre-wrap' }}
              >
                {generated.generatedProfile.slice(0, 600)}{generated.generatedProfile.length > 600 ? '...' : ''}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setGenerated(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all"
                  style={{ backgroundColor: '#0d0d14', border: '1px solid #2a2a3c', color: '#64748b' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#6366f1'; (e.currentTarget as HTMLButtonElement).style.color = '#f1f5f9'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2a3c'; (e.currentTarget as HTMLButtonElement).style.color = '#64748b'; }}
                >
                  Regenerate
                </button>
                <button
                  onClick={() => onStart(generated)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all"
                  style={{ backgroundColor: '#6366f1', color: 'white' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4f46e5'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6366f1'; }}
                >
                  <Play size={13} /> Start Session
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
