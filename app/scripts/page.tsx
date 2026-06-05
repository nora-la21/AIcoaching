'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  FileText,
  Edit2,
  Trash2,
  Tag,
  X,
  Save,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { getScripts, saveScript, deleteScript } from '@/lib/storage';
import { Script } from '@/lib/types';

function generateId() {
  return `script-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const SAMPLE_SCRIPTS: Script[] = [
  {
    id: 'sample-1',
    name: 'Cold Call Opener',
    content: `Hi [Name], this is [Your Name] from [Company]. I know I'm catching you out of the blue — I'll be brief.

We work with sales teams at companies like yours to cut CRM admin time by 80% using AI automation.

I was curious — is reducing the time your reps spend on manual data entry something that's on your radar right now?

[PAUSE — wait for response]

If yes: "Great, what's the biggest pain point with your current process?"
If no/busy: "Totally understand. Would it be okay if I sent over a quick 2-minute overview? No obligation."`,
    tags: ['cold-call', 'opener', 'B2B'],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'sample-2',
    name: 'Objection: "Too Expensive"',
    content: `"I completely understand — budget is always a consideration. Can I ask, when you say it's expensive, are you comparing it to the cost of doing nothing, or to a competitor?"

[If comparing to doing nothing]:
"What's the cost of your reps spending 10+ hours per week on manual data entry? Over a year, that's [calculate: hourly rate × reps × 10 hrs × 50 weeks]."

[If comparing to competitor]:
"That's fair. The difference is [specific differentiator]. For most of our customers, the ROI difference covers the price gap in the first 90 days."

"Would it help if I walked you through the numbers specifically for your team size?"`,
    tags: ['objection', 'pricing', 'ROI'],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'sample-3',
    name: 'Discovery Question Bank',
    content: `BUSINESS PAIN QUESTIONS:
• "Walk me through your current process for updating CRM after a call."
• "How many hours per week would you estimate your team spends on admin work?"
• "What happens when CRM data is incomplete or stale?"

IMPACT QUESTIONS:
• "How does inaccurate pipeline data affect your forecasting?"
• "What deals have you lost visibility into because of poor CRM hygiene?"
• "If your team had 10 extra hours per week, what would they focus on?"

BUYING PROCESS QUESTIONS:
• "If we found a solution that could solve this, what would the decision process look like?"
• "Who else would need to be involved in evaluating this?"
• "What's your timeline for making a change?"`,
    tags: ['discovery', 'questions', 'SPIN'],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

interface ScriptFormProps {
  initial?: Script;
  onSave: (script: Script) => void;
  onCancel: () => void;
}

function ScriptForm({ initial, onSave, onCancel }: ScriptFormProps) {
  const [name, setName] = useState(initial?.name || '');
  const [content, setContent] = useState(initial?.content || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initial?.tags || []);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    const script: Script = {
      id: initial?.id || generateId(),
      name: name.trim(),
      content: content.trim(),
      tags,
      createdAt: initial?.createdAt || new Date().toISOString(),
    };
    onSave(script);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>
          Script Name *
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Cold Call Opener, Price Objection Handler"
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
          style={{
            backgroundColor: '#0d0d14',
            border: '1px solid #2a2a3c',
            color: '#f1f5f9',
          }}
          onFocus={(e) => ((e.target as HTMLInputElement).style.borderColor = '#6366f1')}
          onBlur={(e) => ((e.target as HTMLInputElement).style.borderColor = '#2a2a3c')}
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>
          Content *
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your script, talking points, or objection responses here..."
          rows={10}
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none font-mono"
          style={{
            backgroundColor: '#0d0d14',
            border: '1px solid #2a2a3c',
            color: '#f1f5f9',
            lineHeight: '1.7',
          }}
          onFocus={(e) => ((e.target as HTMLTextAreaElement).style.borderColor = '#6366f1')}
          onBlur={(e) => ((e.target as HTMLTextAreaElement).style.borderColor = '#2a2a3c')}
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>
          Tags
        </label>
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add tag and press Enter"
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: '#0d0d14',
              border: '1px solid #2a2a3c',
              color: '#f1f5f9',
            }}
            onFocus={(e) => ((e.target as HTMLInputElement).style.borderColor = '#6366f1')}
            onBlur={(e) => ((e.target as HTMLInputElement).style.borderColor = '#2a2a3c')}
          />
          <button
            type="button"
            onClick={addTag}
            className="px-3 py-2 rounded-lg text-sm transition-colors"
            style={{
              backgroundColor: '#1e1e2a',
              border: '1px solid #2a2a3c',
              color: '#94a3b8',
            }}
          >
            Add
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  color: '#818cf8',
                }}
              >
                <Tag size={10} />
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-white transition-colors"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          style={{ backgroundColor: '#6366f1', color: 'white' }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4f46e5')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6366f1')
          }
        >
          <Save size={14} />
          {initial ? 'Update Script' : 'Save Script'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'transparent',
            border: '1px solid #2a2a3c',
            color: '#64748b',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#3d3d55';
            (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2a3c';
            (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [hasSamples, setHasSamples] = useState(false);

  useEffect(() => {
    const stored = getScripts();
    if (stored.length === 0 && !hasSamples) {
      // Offer sample scripts
    }
    setScripts(stored);
  }, [hasSamples]);

  const handleLoadSamples = () => {
    SAMPLE_SCRIPTS.forEach((s) => saveScript(s));
    setScripts(getScripts());
    setHasSamples(true);
  };

  const handleSave = (script: Script) => {
    saveScript(script);
    setScripts(getScripts());
    setShowForm(false);
    setEditingScript(null);
    setExpandedId(script.id);
  };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      deleteScript(id);
      setScripts(getScripts());
      if (expandedId === id) setExpandedId(null);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const handleEdit = (script: Script) => {
    setEditingScript(script);
    setShowForm(true);
    setExpandedId(null);
  };

  const filtered = scripts.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.content.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0d0d14' }}>
      <Sidebar />
      <main className="flex-1 ml-60 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#f1f5f9' }}>
              Scripts & Playbooks
            </h1>
            <p className="text-sm" style={{ color: '#64748b' }}>
              {scripts.length} script{scripts.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <button
            onClick={() => {
              setEditingScript(null);
              setShowForm(true);
              setExpandedId(null);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{ backgroundColor: '#6366f1', color: 'white' }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4f46e5')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6366f1')
            }
          >
            <Plus size={16} />
            New Script
          </button>
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <div
            className="rounded-xl p-6 mb-6"
            style={{ backgroundColor: '#16161f', border: '1px solid #2a2a3c' }}
          >
            <h2 className="text-base font-semibold mb-5" style={{ color: '#f1f5f9' }}>
              {editingScript ? 'Edit Script' : 'New Script'}
            </h2>
            <ScriptForm
              initial={editingScript || undefined}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditingScript(null);
              }}
            />
          </div>
        )}

        {scripts.length === 0 && !showForm ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              <FileText size={28} style={{ color: '#6366f1' }} />
            </div>
            <p className="text-base font-semibold mb-2" style={{ color: '#f1f5f9' }}>
              No scripts yet
            </p>
            <p className="text-sm mb-6 text-center max-w-sm" style={{ color: '#64748b' }}>
              Build your personal sales playbook with scripts, objection handlers, and talking points.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: '#6366f1', color: 'white' }}
              >
                Create Your First Script
              </button>
              <button
                onClick={handleLoadSamples}
                className="px-4 py-2.5 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #2a2a3c',
                  color: '#94a3b8',
                }}
              >
                Load Sample Scripts
              </button>
            </div>
          </div>
        ) : (
          scripts.length > 0 && (
            <>
              {/* Search */}
              <div className="relative mb-4">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#64748b' }}
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search scripts by name, content, or tag..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: '#16161f',
                    border: '1px solid #2a2a3c',
                    color: '#f1f5f9',
                  }}
                  onFocus={(e) => ((e.target as HTMLInputElement).style.borderColor = '#6366f1')}
                  onBlur={(e) => ((e.target as HTMLInputElement).style.borderColor = '#2a2a3c')}
                />
              </div>

              {filtered.length === 0 ? (
                <div
                  className="rounded-xl p-8 text-center"
                  style={{ backgroundColor: '#16161f', border: '1px solid #2a2a3c' }}
                >
                  <p className="text-sm" style={{ color: '#64748b' }}>
                    No scripts match &quot;{search}&quot;
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((script) => {
                    const isExpanded = expandedId === script.id;
                    const date = new Date(script.createdAt);

                    return (
                      <div
                        key={script.id}
                        className="rounded-xl overflow-hidden"
                        style={{
                          backgroundColor: isExpanded ? '#1e1e2a' : '#16161f',
                          border: `1px solid ${isExpanded ? 'rgba(99, 102, 241, 0.25)' : '#2a2a3c'}`,
                        }}
                      >
                        {/* Header row */}
                        <div className="flex items-center gap-4 px-5 py-4">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : script.id)}
                            className="flex items-center gap-3 flex-1 min-w-0 text-left"
                          >
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                                border: '1px solid rgba(99, 102, 241, 0.2)',
                              }}
                            >
                              <FileText size={15} style={{ color: '#6366f1' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate" style={{ color: '#f1f5f9' }}>
                                {script.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs" style={{ color: '#64748b' }}>
                                  {date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                {script.tags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                                    style={{
                                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                      color: '#818cf8',
                                    }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </button>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleEdit(script)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                              style={{ color: '#64748b' }}
                              title="Edit"
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1e1e2a';
                                (e.currentTarget as HTMLButtonElement).style.color = '#6366f1';
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                                (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
                              }}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(script.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                              style={{
                                color: confirmDelete === script.id ? '#ef4444' : '#64748b',
                                backgroundColor: confirmDelete === script.id ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                              }}
                              title={confirmDelete === script.id ? 'Click again to confirm' : 'Delete'}
                              onMouseEnter={(e) => {
                                if (confirmDelete !== script.id) {
                                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1e1e2a';
                                  (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (confirmDelete !== script.id) {
                                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                                  (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
                                }
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : script.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                              style={{ color: '#64748b' }}
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                        </div>

                        {/* Content */}
                        {isExpanded && (
                          <div
                            className="px-5 pb-5 border-t"
                            style={{ borderColor: '#2a2a3c' }}
                          >
                            <pre
                              className="mt-4 text-sm leading-relaxed whitespace-pre-wrap font-sans"
                              style={{ color: '#94a3b8' }}
                            >
                              {script.content}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )
        )}
      </main>
    </div>
  );
}
