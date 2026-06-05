import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Settings, ChatMessage, SessionAnalysis } from '@/lib/types';
import { getFrameworkById } from '@/lib/scenarios';

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
  framework?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeRequest = await req.json();
    const { messages, scenario, settings, framework } = body;

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

    const frameworkObj = framework ? getFrameworkById(framework) : null;
    const frameworkContext = frameworkObj && frameworkObj.id !== 'none'
      ? `\nSales framework being evaluated: ${frameworkObj.name} (${frameworkObj.description})\n${frameworkObj.coachingInstructions}`
      : '';

    const analysisPrompt = `You are an expert sales coach doing a post-call debrief. Analyze this sales practice conversation and give brutally honest, specific feedback.

Scenario: ${scenario}
Salesperson: ${settings.userName} from ${settings.companyName}
Product: ${settings.productDescription}
${frameworkContext}

FULL CONVERSATION:
${conversationText}

Return ONLY a valid JSON object with this exact structure (no markdown, no preamble):
{
  "score": <overall 0-100>,
  "strengths": ["specific strength 1 with example from the conversation", "strength 2", "strength 3"],
  "improvements": ["specific area to improve 1", "area 2", "area 3"],
  "mistakes": [
    {
      "whatWasSaid": "<exact short quote or paraphrase from the salesperson's message — use their actual words>",
      "whyItMissed": "<1 sentence explaining why this was ineffective or wrong>",
      "whatToSayInstead": "<a better word-for-word alternative they could have said>"
    }
  ],
  "talkRatio": ${estimatedTalkRatio},
  "summary": "<2-3 sentence overall assessment>",
  "followUpEmail": "Subject: ...\\n\\nHi [Name],\\n\\n...\\n\\nBest,\\n${settings.userName}"${frameworkObj && frameworkObj.id !== 'none' ? `,
  "frameworkScore": <0-100 score for ${frameworkObj.name} adherence>,
  "frameworkFeedback": "<2-3 sentences specifically evaluating their use of ${frameworkObj.name} — which elements they hit, which they missed>"` : ''}
}

IMPORTANT RULES for "mistakes" array:
- Find 3-5 real mistakes from the actual conversation — things the salesperson actually said
- "whatWasSaid" must be a real quote or close paraphrase from ${settings.userName}'s messages
- "whatToSayInstead" must be a complete, natural-sounding alternative sentence they could say verbatim
- Focus on the most impactful mistakes: missed discovery, weak objection handling, pitching too early, not asking for commitment, etc.
${frameworkObj && frameworkObj.id !== 'none' ? `- Also flag violations of ${frameworkObj.name} principles specifically` : ''}
- If the conversation was very short (1-2 exchanges), still find what went wrong

Scoring criteria: Opening/rapport (0-20), Discovery/questions (0-20), Value proposition (0-20), Objection handling (0-20), Closing/next steps (0-20).
Be honest. A mediocre call should score 40-60, not 70+.`;

    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 1500,
      messages: [{ role: 'user', content: analysisPrompt }],
    });

    const rawText = response.choices[0]?.message?.content || '{}';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No valid JSON in response');

    const analysis = JSON.parse(jsonMatch[0]);

    const sanitized: SessionAnalysis = {
      score: Math.max(0, Math.min(100, Number(analysis.score) || 50)),
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths.slice(0, 3) : ['Engaged with the prospect', 'Communicated clearly', 'Stayed professional'],
      improvements: Array.isArray(analysis.improvements) ? analysis.improvements.slice(0, 3) : ['Ask more discovery questions', 'Handle objections more confidently', 'Be more concise'],
      mistakes: Array.isArray(analysis.mistakes)
        ? analysis.mistakes.slice(0, 5).map((m: { whatWasSaid?: string; whyItMissed?: string; whatToSayInstead?: string }) => ({
            whatWasSaid: m.whatWasSaid || '',
            whyItMissed: m.whyItMissed || '',
            whatToSayInstead: m.whatToSayInstead || '',
          }))
        : [],
      talkRatio: estimatedTalkRatio,
      summary: analysis.summary || 'Good practice session. Review the mistakes section for specific improvements.',
      followUpEmail: analysis.followUpEmail || `Subject: Great speaking with you today\n\nHi,\n\nThank you for your time.\n\nBest,\n${settings.userName}`,
      frameworkScore: analysis.frameworkScore ? Math.max(0, Math.min(100, Number(analysis.frameworkScore))) : undefined,
      frameworkFeedback: analysis.frameworkFeedback || undefined,
    };

    return NextResponse.json(sanitized);
  } catch (error) {
    console.error('Analyze API error:', error);
    return NextResponse.json({ error: 'Failed to analyze session. Please try again.' }, { status: 500 });
  }
}
