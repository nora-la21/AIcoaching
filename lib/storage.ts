import { Session, Script, Settings } from './types';

const SESSIONS_KEY = 'ai_coach_sessions';
const SCRIPTS_KEY = 'ai_coach_scripts';
const SETTINGS_KEY = 'ai_coach_settings';

// ─── Sessions ───────────────────────────────────────────────────────────────

export function getSessions(): Session[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSession(session: Session): void {
  if (typeof window === 'undefined') return;
  try {
    const sessions = getSessions();
    const existingIndex = sessions.findIndex((s) => s.id === session.id);
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.unshift(session);
    }
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    console.error('Failed to save session');
  }
}

export function deleteSession(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const sessions = getSessions().filter((s) => s.id !== id);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    console.error('Failed to delete session');
  }
}

// ─── Scripts ─────────────────────────────────────────────────────────────────

export function getScripts(): Script[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SCRIPTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveScript(script: Script): void {
  if (typeof window === 'undefined') return;
  try {
    const scripts = getScripts();
    const existingIndex = scripts.findIndex((s) => s.id === script.id);
    if (existingIndex >= 0) {
      scripts[existingIndex] = script;
    } else {
      scripts.unshift(script);
    }
    localStorage.setItem(SCRIPTS_KEY, JSON.stringify(scripts));
  } catch {
    console.error('Failed to save script');
  }
}

export function deleteScript(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const scripts = getScripts().filter((s) => s.id !== id);
    localStorage.setItem(SCRIPTS_KEY, JSON.stringify(scripts));
  } catch {
    console.error('Failed to delete script');
  }
}

// ─── Settings ────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: Settings = {
  userName: 'Alex',
  companyName: 'Acme Corp',
  productDescription: 'a B2B SaaS platform that automates sales workflows and CRM data entry using AI, saving sales reps 10+ hours per week',
  targetCustomer: 'Sales managers and VP of Sales at mid-market companies (50-500 employees) using Salesforce or HubSpot',
  valueProposition: 'Cut CRM admin time by 80%, increase rep productivity by 30%, and get accurate pipeline forecasts automatically',
  commonObjections: [
    "We already have a solution for that",
    "The price is too high",
    "We don't have budget right now",
    "I need to think about it",
    "Can you send me more information?",
  ],
};

export function getSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const stored = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...stored };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    console.error('Failed to save settings');
  }
}
