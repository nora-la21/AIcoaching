import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Settings, ChatMessage, SessionAnalysis } from '@/lib/types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
    const aiMessages = messages.filter((m) => m.role === 'assistant');

    const totalWords = messages.reduce((acc, m) => {
      return acc + m.content.split(/\s+/).length;
    }, 0);
    const userWords = userMessages.reduce((acc, m) => {
      return acc + m.content.split(/\s+/).length;
    }, 0);
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

Be honest and specific. If the performance was poor, reflect that in the score. Provide actionable, specific feedback.

Return ONLY the JSON object, no other text.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
    });

    const rawText =
      response.content[0].type === 'text' ? response.content[0].text : '{}';

    // Extract JSON from response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in response');
    }

    const analysis: SessionAnalysis = JSON.parse(jsonMatch[0]);

    // Validate and sanitize
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
      followUpEmail: analysis.followUpEmail || `Subject: Great speaking with you today\n\nHi,\n\nThank you for your time today. I enjoyed learning more about your needs.\n\nI'd love to schedule a follow-up to discuss how ${settings.companyName} can help.\n\nBest regards,\n${settings.userName}`,
    };

    return NextResponse.json(sanitized);
  } catch (error) {
    console.error('Analyze API error:', error);

    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `API error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to analyze session. Please try again.' },
      { status: 500 }
    );
  }
}
