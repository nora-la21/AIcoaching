import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from '@/lib/scenarios';
import { Settings } from '@/lib/types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

  if (tipIndex === -1) {
    return { reply: text.trim(), coachingTip: '' };
  }

  const reply = text.substring(0, tipIndex).trim();
  const coachingTip = text.substring(tipIndex + tipMarker.length).trim();

  return { reply, coachingTip };
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

    // Convert messages to Anthropic format
    const anthropicMessages = messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    const rawText =
      response.content[0].type === 'text' ? response.content[0].text : '';

    const { reply, coachingTip } = parseCoachingTip(rawText);

    return NextResponse.json({ reply, coachingTip });
  } catch (error) {
    console.error('Chat API error:', error);

    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `API error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get AI response. Please try again.' },
      { status: 500 }
    );
  }
}
