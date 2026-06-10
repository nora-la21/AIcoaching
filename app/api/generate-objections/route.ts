import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Settings } from '@/lib/types';

const isGroq = !!process.env.GROQ_API_KEY;

const client = new OpenAI(
  isGroq
    ? { apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' }
    : { apiKey: 'ollama', baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1' }
);

const MODEL = isGroq
  ? (process.env.GROQ_MODEL || 'llama-3.3-70b-versatile')
  : (process.env.OLLAMA_MODEL || 'llama3.2');

export interface GeneratedObjection {
  objection: string;
  category: 'price' | 'timing' | 'competition' | 'risk' | 'authority' | 'need' | 'other';
  handleTip: string;
}

interface GenerateObjectionsRequest {
  settings: Settings;
  scenario: string;
  prospectTitle?: string;
  prospectIndustry?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateObjectionsRequest = await req.json();
    const { settings, scenario, prospectTitle, prospectIndustry, difficulty = 'medium' } = body;

    const prospectContext = prospectTitle
      ? `The prospect is a ${prospectTitle}${prospectIndustry ? ` in ${prospectIndustry}` : ''}.`
      : `The prospect is a typical ${settings.targetCustomer}.`;

    const difficultyGuide = {
      easy: '2-3 mild objections (budget is available, mostly need reassurance)',
      medium: '4-5 realistic objections (genuine concerns about ROI, timing, risk)',
      hard: '5-6 tough objections (skeptical, has a competitor, budget is tight, needs multiple approvals)',
    };

    const prompt = `You are a sales training expert. Generate realistic objections a prospect would raise during a ${scenario} sales call.

Product being sold: ${settings.productDescription}
Company: ${settings.companyName}
Value proposition: ${settings.valueProposition}
${prospectContext}
Difficulty: ${difficulty} — ${difficultyGuide[difficulty]}

Generate objections that are specific to THIS product and THIS type of prospect — not generic filler. Think about:
- What would a ${prospectTitle || settings.targetCustomer} specifically worry about with "${settings.productDescription}"?
- What competitors might they mention?
- What internal challenges (budget approval, IT concerns, change management) are realistic for their role?

Return ONLY a valid JSON array, no other text:
[
  {
    "objection": "<exactly what the prospect would say, in their voice, 1-2 sentences>",
    "category": "<one of: price, timing, competition, risk, authority, need, other>",
    "handleTip": "<1 sentence practical tip for the salesperson on how to handle this specific objection>"
  }
]`;

    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = response.choices[0]?.message?.content || '[]';
    const clean = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    const jsonMatch = clean.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return NextResponse.json({ objections: [] });

    let objections: GeneratedObjection[];
    try {
      objections = JSON.parse(jsonMatch[0]);
    } catch {
      const repaired = jsonMatch[0]
        .replace(/:\s*'((?:[^'\\]|\\.)*)'/g, ': "$1"')
        .replace(/,\s*([}\]])/g, '$1');
      objections = JSON.parse(repaired);
    }

    return NextResponse.json({ objections: objections.slice(0, 6) });
  } catch (error) {
    console.error('Generate objections error:', error);
    return NextResponse.json({ error: 'Failed to generate objections.' }, { status: 500 });
  }
}
