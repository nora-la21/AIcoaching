import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildSystemPrompt } from '@/lib/scenarios';
import { Settings } from '@/lib/types';

const ollama = new OpenAI({
  apiKey: 'ollama',
  baseURL: 'http://localhost:11434/v1',
});

const MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

interface ChatRequestMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatRequestMessage[];
  scenario: string;
  settings: Settings;
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
    const { messages, scenario, settings } = body;

    if (!messages || !scenario || !settings) {
      return NextResponse.json(
        { error: 'Missing required fields: messages, scenario, settings' },
        { status: 400 }
      );
    }

    const systemPrompt = buildSystemPrompt(scenario, settings);

    const response = await ollama.chat.completions.create({
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
      { error: 'Failed to get AI response. Make sure Ollama is running: ollama serve' },
      { status: 500 }
    );
  }
}
