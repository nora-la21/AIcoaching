'use client';

import { useState } from 'react';
import { Sparkles, X, Loader2, CheckCircle, Edit3 } from 'lucide-react';
import { Settings } from '@/lib/types';

interface GeneratedDraft {
  suggestedName: string;
  companyName: string;
  productDescription: string;
  targetCustomer: string;
  valueProposition: string;
  commonObjections: string[];
}

interface Props {
  currentUserName: string;
  onSave: (name: string, settings: Settings) => void;
  onClose: () => void;
}

export default function GenerateProfileModal({ currentUserName, onSave, onClose }: Props) {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [draft, setDraft] = useState<GeneratedDraft | null>(null);
  const [profileName, setProfileName] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please describe your company or product first.');
      return;
    }
    setIsGenerating(true);
    setError('');
    setDraft(null);

    try {
      const res = await fetch('/api/generate-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Generation failed');
      }
      const data: GeneratedDraft = await res.json();
      setDraft(data);
      setProfileName(data.suggestedName || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!draft || !profileName.trim()) return;
    onSave(profileName.trim(), {
      userName: currentUserName,
      companyName: draft.companyName,
      productDescription: draft.productDescription,
      targetCustomer: draft.targetCustomer,
      valueProposition: draft.valueProposition,
      commonObjections: draft.commonObjections,
    });
  };

  const inputStyle = {
    backgroundColor: '#0d0d14',
    border: '1px solid #2a2a3c',
    color: '#f1f5f9',
    caretColor: '#6366f1',
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
              <h2 className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>Generate Profile with AI</h2>
              <p className="text-xs" style={{ color: '#64748b' }}>Describe your company — AI fills the rest</p>
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

        <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Description input — always visible */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>
              Describe your company and what you sell
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. We're WeTravel — a booking and payment platform built for group travel businesses. We replace spreadsheets and disconnected tools that tour operators use to manage bookings, collect payments, and pay suppliers."
              rows={4}
              className="w-full resize-none text-sm rounded-xl px-4 py-3 outline-none"
              style={{ ...inputStyle, lineHeight: '1.6' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#6366f1'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#2a2a3c'; }}
            />
            <p className="text-xs mt-1" style={{ color: '#64748b' }}>
              {description.length} chars — add your product name, what it does, and who buys it for best results
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
            disabled={isGenerating || !description.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              backgroundColor: isGenerating || !description.trim() ? '#2a2a3c' : '#6366f1',
              color: isGenerating || !description.trim() ? '#64748b' : 'white',
            }}
            onMouseEnter={(e) => { if (!isGenerating && description.trim()) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4f46e5'; }}
            onMouseLeave={(e) => { if (!isGenerating && description.trim()) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6366f1'; }}
          >
            {isGenerating ? (
              <><Loader2 size={15} className="animate-spin" /> Generating profile...</>
            ) : (
              <><Sparkles size={15} /> {draft ? 'Regenerate' : 'Generate Profile'}</>
            )}
          </button>

          {/* Generated draft — editable fields */}
          {draft && (
            <>
              <div
                className="flex items-center gap-2 pt-2 pb-1"
                style={{ borderTop: '1px solid #2a2a3c' }}
              >
                <Edit3 size={13} style={{ color: '#6366f1' }} />
                <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>Review & edit before saving</span>
              </div>

              {[
                { label: 'Company Name', key: 'companyName' as const, rows: 1 },
                { label: 'Product Description', key: 'productDescription' as const, rows: 3 },
                { label: 'Target Customer', key: 'targetCustomer' as const, rows: 2 },
                { label: 'Value Proposition', key: 'valueProposition' as const, rows: 2 },
              ].map(({ label, key, rows }) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>{label}</label>
                  {rows === 1 ? (
                    <input
                      value={draft[key] as string}
                      onChange={(e) => setDraft((d) => d ? { ...d, [key]: e.target.value } : d)}
                      className="w-full text-sm rounded-xl px-4 py-2.5 outline-none"
                      style={inputStyle}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#6366f1'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#2a2a3c'; }}
                    />
                  ) : (
                    <textarea
                      value={draft[key] as string}
                      onChange={(e) => setDraft((d) => d ? { ...d, [key]: e.target.value } : d)}
                      rows={rows}
                      className="w-full resize-none text-sm rounded-xl px-4 py-3 outline-none"
                      style={{ ...inputStyle, lineHeight: '1.6' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#6366f1'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#2a2a3c'; }}
                    />
                  )}
                </div>
              ))}

              {/* Objections */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>Common Objections</label>
                <div className="space-y-2">
                  {draft.commonObjections.map((obj, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-2"
                        style={{ backgroundColor: 'rgba(99,102,241,0.15)', color: '#6366f1' }}
                      >
                        {i + 1}
                      </span>
                      <input
                        value={obj}
                        onChange={(e) => setDraft((d) => {
                          if (!d) return d;
                          const updated = [...d.commonObjections];
                          updated[i] = e.target.value;
                          return { ...d, commonObjections: updated };
                        })}
                        className="flex-1 text-sm rounded-xl px-4 py-2 outline-none"
                        style={inputStyle}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#6366f1'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = '#2a2a3c'; }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Profile name + save */}
              <div style={{ borderTop: '1px solid #2a2a3c', paddingTop: '1rem' }}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>
                  Profile name
                </label>
                <div className="flex gap-2">
                  <input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                    placeholder="e.g. WeTravel B2B"
                    className="flex-1 text-sm rounded-xl px-4 py-2.5 outline-none"
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#6366f1'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#2a2a3c'; }}
                  />
                  <button
                    onClick={handleSave}
                    disabled={!profileName.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      backgroundColor: profileName.trim() ? '#6366f1' : '#2a2a3c',
                      color: profileName.trim() ? 'white' : '#64748b',
                    }}
                    onMouseEnter={(e) => { if (profileName.trim()) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4f46e5'; }}
                    onMouseLeave={(e) => { if (profileName.trim()) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6366f1'; }}
                  >
                    <CheckCircle size={14} /> Save Profile
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
