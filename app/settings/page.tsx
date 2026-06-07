'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Save,
  Plus,
  X,
  Settings as SettingsIcon,
  Building2,
  User,
  Package,
  Users,
  Star,
  MessageSquare,
  CheckCircle,
  Layers,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import {
  getSettings,
  saveSettings,
  DEFAULT_SETTINGS,
  getProfiles,
  saveProfiles,
  getActiveProfileId,
  setActiveProfileId,
} from '@/lib/storage';
import { Settings, SettingsProfile } from '@/lib/types';

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  type?: 'input' | 'textarea';
  rows?: number;
  hint?: string;
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  icon,
  type = 'input',
  rows = 3,
  hint,
}: InputFieldProps) {
  const baseStyle = {
    backgroundColor: '#0d0d14',
    border: '1px solid #2a2a3c',
    color: '#f1f5f9',
  };

  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    (e.target as HTMLElement).style.borderColor = '#6366f1';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    (e.target as HTMLElement).style.borderColor = '#2a2a3c';
  };

  return (
    <div>
      <label className="flex items-center gap-2 text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>
        {icon && <span style={{ color: '#6366f1' }}>{icon}</span>}
        {label}
      </label>
      {type === 'input' ? (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
          style={baseStyle}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
          style={{ ...baseStyle, lineHeight: '1.6' }}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      )}
      {hint && (
        <p className="text-xs mt-1" style={{ color: '#64748b' }}>
          {hint}
        </p>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [newObjection, setNewObjection] = useState('');
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [profiles, setProfilesState] = useState<SettingsProfile[]>([]);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(null);
  const [newProfileName, setNewProfileName] = useState('');
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const newProfileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let loaded = getProfiles();
    let activeId = getActiveProfileId();

    if (loaded.length === 0) {
      // First time: wrap existing flat settings into a "Default" profile
      const existing = getSettings();
      const defaultProfile: SettingsProfile = {
        id: `profile-${Date.now()}`,
        name: 'Default',
        settings: existing,
        createdAt: new Date().toISOString(),
      };
      loaded = [defaultProfile];
      saveProfiles(loaded);
      setActiveProfileId(defaultProfile.id);
      activeId = defaultProfile.id;
    }

    if (!activeId || !loaded.find((p) => p.id === activeId)) {
      activeId = loaded[0].id;
      setActiveProfileId(activeId);
    }

    setProfilesState(loaded);
    setActiveProfileIdState(activeId);
    const active = loaded.find((p) => p.id === activeId);
    if (active) setSettings({ ...DEFAULT_SETTINGS, ...active.settings });
  }, []);

  useEffect(() => {
    if (isCreatingProfile) newProfileInputRef.current?.focus();
  }, [isCreatingProfile]);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveSettings(settings);
    // Keep profiles state in sync
    if (activeProfileId) {
      setProfilesState((prev) =>
        prev.map((p) => (p.id === activeProfileId ? { ...p, settings } : p))
      );
    }
    setSaved(true);
    setHasChanges(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setHasChanges(true);
  };

  const switchProfile = (id: string) => {
    if (id === activeProfileId) return;
    // Auto-save current edits before switching
    saveSettings(settings);
    const target = profiles.find((p) => p.id === id);
    if (!target) return;
    setActiveProfileId(id);
    setActiveProfileIdState(id);
    setSettings({ ...DEFAULT_SETTINGS, ...target.settings });
    setHasChanges(false);
  };

  const createProfile = () => {
    const name = newProfileName.trim();
    if (!name) return;
    const newProfile: SettingsProfile = {
      id: `profile-${Date.now()}`,
      name,
      settings: { ...settings },
      createdAt: new Date().toISOString(),
    };
    const updated = [...profiles, newProfile];
    saveProfiles(updated);
    setProfilesState(updated);
    setActiveProfileId(newProfile.id);
    setActiveProfileIdState(newProfile.id);
    setNewProfileName('');
    setIsCreatingProfile(false);
    setHasChanges(false);
  };

  const deleteProfile = (id: string) => {
    if (profiles.length <= 1) return;
    const updated = profiles.filter((p) => p.id !== id);
    saveProfiles(updated);
    setProfilesState(updated);
    if (id === activeProfileId) {
      const next = updated[0];
      setActiveProfileId(next.id);
      setActiveProfileIdState(next.id);
      setSettings({ ...DEFAULT_SETTINGS, ...next.settings });
      setHasChanges(false);
    }
  };

  const addObjection = () => {
    const t = newObjection.trim();
    if (t && !settings.commonObjections.includes(t)) {
      update('commonObjections', [...settings.commonObjections, t]);
      setNewObjection('');
    }
  };

  const removeObjection = (idx: number) => {
    update('commonObjections', settings.commonObjections.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0d0d14' }}>
      <Sidebar />
      <main className="flex-1 ml-60 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#f1f5f9' }}>
              Settings
            </h1>
            <p className="text-sm" style={{ color: '#64748b' }}>
              Personalize your AI coaching experience
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                Unsaved changes
              </span>
            )}
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                backgroundColor: saved ? '#22c55e' : '#6366f1',
                color: 'white',
              }}
              onMouseEnter={(e) => {
                if (!saved) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4f46e5';
              }}
              onMouseLeave={(e) => {
                if (!saved) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6366f1';
              }}
            >
              {saved ? <CheckCircle size={15} /> : <Save size={15} />}
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="max-w-3xl space-y-6">
          {/* Profiles */}
          <div
            className="rounded-xl p-6"
            style={{ backgroundColor: '#16161f', border: '1px solid #2a2a3c' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}
              >
                <Layers size={15} style={{ color: '#6366f1' }} />
              </div>
              <h2 className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>
                Profiles
              </h2>
              <span className="text-xs ml-1" style={{ color: '#64748b' }}>
                — save different setups for different products or personas
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {profiles.map((p) => {
                const isActive = p.id === activeProfileId;
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium cursor-pointer transition-all select-none"
                    style={{
                      backgroundColor: isActive ? 'rgba(99, 102, 241, 0.18)' : '#0d0d14',
                      border: `1px solid ${isActive ? '#6366f1' : '#2a2a3c'}`,
                      color: isActive ? '#a5b4fc' : '#64748b',
                    }}
                    onClick={() => switchProfile(p.id)}
                  >
                    {p.name}
                    {profiles.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteProfile(p.id); }}
                        className="ml-0.5 rounded flex items-center justify-center transition-colors"
                        style={{ color: isActive ? '#6366f1' : '#475569' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = isActive ? '#6366f1' : '#475569'; }}
                        title={`Delete "${p.name}"`}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                );
              })}

              {isCreatingProfile ? (
                <div
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2"
                  style={{ backgroundColor: '#0d0d14', border: '1px solid #6366f1' }}
                >
                  <input
                    ref={newProfileInputRef}
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') createProfile();
                      if (e.key === 'Escape') { setIsCreatingProfile(false); setNewProfileName(''); }
                    }}
                    placeholder="Profile name..."
                    className="bg-transparent outline-none text-sm w-32"
                    style={{ color: '#f1f5f9' }}
                  />
                  <button onClick={createProfile} style={{ color: '#6366f1' }}>
                    <CheckCircle size={14} />
                  </button>
                  <button onClick={() => { setIsCreatingProfile(false); setNewProfileName(''); }} style={{ color: '#475569' }}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsCreatingProfile(true)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px dashed #2a2a3c',
                    color: '#475569',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#6366f1';
                    (e.currentTarget as HTMLButtonElement).style.color = '#6366f1';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2a3c';
                    (e.currentTarget as HTMLButtonElement).style.color = '#475569';
                  }}
                >
                  <Plus size={13} />
                  New Profile
                </button>
              )}
            </div>

            <p className="text-xs mt-3" style={{ color: '#475569' }}>
              Switching profiles auto-saves your current edits. Settings below apply to the active profile.
            </p>
          </div>

          {/* Personal Info */}
          <div
            className="rounded-xl p-6"
            style={{ backgroundColor: '#16161f', border: '1px solid #2a2a3c' }}
          >
            <div className="flex items-center gap-2 mb-5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}
              >
                <User size={15} style={{ color: '#6366f1' }} />
              </div>
              <h2 className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>
                Personal Info
              </h2>
            </div>
            <InputField
              label="Your Name"
              value={settings.userName}
              onChange={(v) => update('userName', v)}
              placeholder="e.g., Alex Johnson"
              icon={<User size={12} />}
              hint="Used to personalize AI conversations and follow-up emails"
            />
          </div>

          {/* Company & Product */}
          <div
            className="rounded-xl p-6"
            style={{ backgroundColor: '#16161f', border: '1px solid #2a2a3c' }}
          >
            <div className="flex items-center gap-2 mb-5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}
              >
                <Building2 size={15} style={{ color: '#6366f1' }} />
              </div>
              <h2 className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>
                Company & Product
              </h2>
            </div>
            <div className="space-y-4">
              <InputField
                label="Company Name"
                value={settings.companyName}
                onChange={(v) => update('companyName', v)}
                placeholder="e.g., Acme Corp"
                icon={<Building2 size={12} />}
              />
              <InputField
                label="Product Description"
                value={settings.productDescription}
                onChange={(v) => update('productDescription', v)}
                placeholder="Describe what your product does and for whom..."
                icon={<Package size={12} />}
                type="textarea"
                rows={3}
                hint="The AI will play a prospect interested in (or skeptical of) this product"
              />
            </div>
          </div>

          {/* Customer & Value */}
          <div
            className="rounded-xl p-6"
            style={{ backgroundColor: '#16161f', border: '1px solid #2a2a3c' }}
          >
            <div className="flex items-center gap-2 mb-5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}
              >
                <Users size={15} style={{ color: '#6366f1' }} />
              </div>
              <h2 className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>
                Target Customer & Value
              </h2>
            </div>
            <div className="space-y-4">
              <InputField
                label="Target Customer"
                value={settings.targetCustomer}
                onChange={(v) => update('targetCustomer', v)}
                placeholder="e.g., VP of Sales at mid-market SaaS companies"
                icon={<Users size={12} />}
                type="textarea"
                rows={2}
                hint="Who is your ideal customer? Include role, company size, and industry"
              />
              <InputField
                label="Value Proposition"
                value={settings.valueProposition}
                onChange={(v) => update('valueProposition', v)}
                placeholder="e.g., Cut CRM admin time by 80%, increase pipeline accuracy by 30%"
                icon={<Star size={12} />}
                type="textarea"
                rows={2}
                hint="What specific outcomes do you deliver? Be quantitative"
              />
            </div>
          </div>

          {/* Objections */}
          <div
            className="rounded-xl p-6"
            style={{ backgroundColor: '#16161f', border: '1px solid #2a2a3c' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}
              >
                <MessageSquare size={15} style={{ color: '#6366f1' }} />
              </div>
              <h2 className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>
                Common Objections
              </h2>
            </div>
            <p className="text-xs mb-5" style={{ color: '#64748b' }}>
              The AI will raise these objections during practice sessions to help you prepare
            </p>

            <div className="space-y-2 mb-4">
              {settings.commonObjections.map((obj, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg group"
                  style={{ backgroundColor: '#0d0d14', border: '1px solid #2a2a3c' }}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}
                  >
                    {i + 1}
                  </div>
                  <span className="flex-1 text-sm" style={{ color: '#94a3b8' }}>
                    {obj}
                  </span>
                  <button
                    onClick={() => removeObjection(i)}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md flex items-center justify-center transition-all"
                    style={{ color: '#64748b' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                      (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                      (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={newObjection}
                onChange={(e) => setNewObjection(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addObjection();
                  }
                }}
                placeholder="Add a common objection you face..."
                className="flex-1 px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{
                  backgroundColor: '#0d0d14',
                  border: '1px solid #2a2a3c',
                  color: '#f1f5f9',
                }}
                onFocus={(e) => ((e.target as HTMLInputElement).style.borderColor = '#6366f1')}
                onBlur={(e) => ((e.target as HTMLInputElement).style.borderColor = '#2a2a3c')}
              />
              <button
                onClick={addObjection}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                  color: '#6366f1',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(99, 102, 241, 0.25)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(99, 102, 241, 0.15)';
                }}
              >
                <Plus size={14} />
                Add
              </button>
            </div>
          </div>

          {/* About AI Coaching */}
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: 'rgba(99, 102, 241, 0.04)',
              border: '1px solid rgba(99, 102, 241, 0.15)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <SettingsIcon size={14} style={{ color: '#6366f1' }} />
              <h3 className="text-sm font-medium" style={{ color: '#6366f1' }}>
                How settings affect your coaching
              </h3>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
              Your company context, product details, and common objections are passed to the AI for every practice session. This makes the AI prospect more realistic and the coaching tips more relevant to your actual sales situation. The more specific you are, the better your practice sessions will be.
            </p>
          </div>

          {/* Reset & Save */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleReset}
              className="text-sm transition-colors"
              style={{ color: '#64748b' }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#94a3b8')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#64748b')}
            >
              Reset to defaults
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                backgroundColor: saved ? '#22c55e' : '#6366f1',
                color: 'white',
              }}
              onMouseEnter={(e) => {
                if (!saved) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4f46e5';
              }}
              onMouseLeave={(e) => {
                if (!saved) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6366f1';
              }}
            >
              {saved ? <CheckCircle size={15} /> : <Save size={15} />}
              {saved ? 'Saved Successfully!' : 'Save All Settings'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
