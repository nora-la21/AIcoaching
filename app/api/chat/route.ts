import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildSystemPrompt } from '@/lib/scenarios';
import { Settings } from '@/lib/types';

// Supports both Groq (deployed) and Ollama (local). Set GROQ_API_KEY in production.
const isGroq = !!process.env.GROQ_API_KEY;

const client = new OpenAI(
  isGroq
    ? { apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' }
    : { apiKey: 'ollama', baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1' }
);

const MODEL = isGroq
  ? (process.env.GROQ_MODEL || 'llama-3.3-70b-versatile')
  : (process.env.OLLAMA_MODEL || 'llama3.2');

interface ChatRequestMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatRequestMessage[];
  scenario: string;
  settings: Settings;
  customProspectProfile?: string;
  framework?: string;
}

function parseCoachingTip(text: string): { reply: string; coachingTip: string } {
  const tipMarker = 'COACHING_TIP:';
  const tipIndex = text.lastIndexOf(tipMarker);
  if (tipIndex === -1) return { reply: text.trim(), coachingTip: '' };
  return {
    reply: text.substring(0, tipIndex).trim(),
    coachingTip: text.substring(tipIndex + tipMarker.length).trim(),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { messages, scenario, settings, customProspectProfile, framework } = body;

    if (!messages || !scenario || !settings) {
      return NextResponse.json(
        { error: 'Missing required fields: messages, scenario, settings' },
        { status: 400 }
      );
    }

    const systemPrompt = customProspectProfile || buildSystemPrompt(scenario, settings, framework);

    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 512,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    const rawText = response.choices[0]?.message?.content || '';
    const { reply, coachingTip } = parseCoachingTip(rawText);

    return NextResponse.json({ reply, coachingTip });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: isGroq ? 'Failed to get AI response. Check your GROQ_API_KEY.' : 'Failed to get AI response. Make sure Ollama is running: ollama serve' },
      { status: 500 }
    );
  }
}
