import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Settings, ChatMessage, SessionAnalysis } from '@/lib/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
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

Here is the full conversation:

${conversationText}

Analyze this sales conversation and provide a JSON response with exactly this structure:
{
  "score": <number 0-100 representing overall performance>,
  "strengths": [<3 specific strengths demonstrated>, <strength 2>, <strength 3>],
  "improvements": [<3 specific areas to improve>, <improvement 2>, <improvement 3>],
  "talkRatio": ${estimatedTalkRatio},
  "summary": "<2-3 sentence summary of the call performance>",
  "followUpEmail": "<a professional follow-up email the salesperson could send after this call, with Subject line, greeting, body, and signature. Use \\n for line breaks.>"
}

Scoring criteria:
- Opening and rapport building (0-20 pts)
- Discovery and questioning (0-20 pts)
- Value proposition delivery (0-20 pts)
- Objection handling (0-20 pts)
- Closing and next steps (0-20 pts)

Be honest and specific. Provide actionable, specific feedback.

Return ONLY the JSON object, no other text.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(analysisPrompt);
    const rawText = result.response.text();

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in response');
    }

    const analysis: SessionAnalysis = JSON.parse(jsonMatch[0]);

    const sanitized: SessionAnalysis = {
      score: Math.max(0, Math.min(100, Number(analysis.score) || 50)),
      strengths: Array.isArray(analysis.strengths)
        ? analysis.strengths.slice(0, 3)
        : ['Engaged with the prospect', 'Communicated clearly', 'Maintained professionalism'],
      improvements: Array.isArray(analysis.improvements)
        ? analysis.improvements.slice(0, 3)
        : ['Practice more discovery questions', 'Work on handling objections', 'Be more concise'],
      talkRatio: estimatedTalkRatio,
      summary: analysis.summary || 'Good practice session. Keep working on your skills.',
      followUpEmail: analysis.followUpEmail || `Subject: Great speaking with you today\n\nHi,\n\nThank you for your time today.\n\nBest regards,\n${settings.userName}`,
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
