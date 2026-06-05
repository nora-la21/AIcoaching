export type Role = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: string;
  coachingTip?: string;
}

export interface SessionAnalysis {
  score: number;
  strengths: string[];
  improvements: string[];
  talkRatio: number;
  summary: string;
  followUpEmail: string;
}

export interface Session {
  id: string;
  scenario: string;
  scenarioLabel: string;
  messages: ChatMessage[];
  analysis: SessionAnalysis;
  createdAt: string;
  durationSeconds: number;
}

export interface Script {
  id: string;
  name: string;
  content: string;
  tags: string[];
  createdAt: string;
}

export interface CustomProspect {
  name: string;
  title: string;
  company: string;
  industry: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  generatedProfile: string;
}

export interface Settings {
  userName: string;
  companyName: string;
  productDescription: string;
  targetCustomer: string;
  valueProposition: string;
  commonObjections: string[];
}
