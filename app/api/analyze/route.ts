import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Settings, ChatMessage, SessionAnalysis } from '@/lib/types';

const isGroq = !!process.env.GROQ_API_KEY;

const client = new OpenAI(
  isGroq
    ? { apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' }
    : { apiKey: 'ollama', baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1' }
);

const MODEL = isGroq
  ? (process.env.GROQ_MODEL || 'llama-3.3-70b-versatile')
  : (process.env.OLLAMA_MODEL || 'llama3.2');

interface AnalyzeRequest {
  messages: ChatMessage[];
  scenario: string;
  settings: Settings;
}

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeRequest = await req.json();
    const { messages, scenario, settings } = body;

    if (!messages || !scenario || !settings) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const userMessages = messages.filter((m) => m.role === 'user');
    const totalWords = messages.reduce((acc, m) => acc + m.content.split(/\s+/).length, 0);
    const userWords = userMessages.reduce((acc, m) => acc + m.content.split(/\s+/).length, 0);
    const estimatedTalkRatio = totalWords > 0 ? Math.round((userWords / totalWords) * 100) : 50;

    const conversationText = messages
      .map((m) => `${m.role === 'user' ? settings.userName : 'Prospect'}: ${m.content}`)
      .join('\n\n');

    const analysisPrompt = `You are an expert sales coach analyzing a sales call practice session.

Scenario: ${scenario}
Salesperson: ${settings.userName} from ${settings.companyName}
Product: ${settings.productDescription}

Conversation:
${conversationText}

Analyze this and respond with ONLY a valid JSON object in this exact format:
{
  "score": <number 0-100>,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "talkRatio": ${estimatedTalkRatio},
  "summary": "2-3 sentence summary of performance",
  "followUpEmail": "Subject: ...\\n\\nHi,\\n\\n...\\n\\nBest regards,\\n${settings.userName}"
}

Scoring: Opening/rapport (0-20), Discovery (0-20), Value prop (0-20), Objection handling (0-20), Closing (0-20).
Be honest and specific. Return ONLY the JSON, no other text.`;

    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: analysisPrompt }],
    });

    const rawText = response.choices[0]?.message?.content || '{}';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No valid JSON in response');

    const analysis: SessionAnalysis = JSON.parse(jsonMatch[0]);

    const sanitized: SessionAnalysis = {
      score: Math.max(0, Math.min(100, Number(analysis.score) || 50)),
      strengths: Array.isArray(analysis.strengths)
        ? analysis.strengths.slice(0, 3)
        : ['Engaged with the prospect', 'Communicated clearly', 'Maintained professionalism'],
      improvements: Array.isArray(analysis.improvements)
        ? analysis.improvements.slice(0, 3)
        : ['Ask more discovery questions', 'Handle objections more confidently', 'Be more concise'],
      talkRatio: estimatedTalkRatio,
      summary: analysis.summary || 'Good practice session. Keep working on your skills.',
      followUpEmail:
        analysis.followUpEmail ||
        `Subject: Great speaking with you today\n\nHi,\n\nThank you for your time.\n\nBest regards,\n${settings.userName}`,
    };

    return NextResponse.json(sanitized);
  } catch (error) {
    console.error('Analyze API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze session. Please try again.' },
      { status: 500 }
    );
  }
}
