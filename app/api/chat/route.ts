import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildSystemPrompt } from '@/lib/scenarios';
import { Settings } from '@/lib/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
    });

    // Build Gemini history from all messages except the last (which is the current user turn)
    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({ history });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const rawText = result.response.text();

    const { reply, coachingTip } = parseCoachingTip(rawText);

    return NextResponse.json({ reply, coachingTip });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response. Please try again.' },
      { status: 500 }
    );
  }
}
