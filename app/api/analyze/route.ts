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

    // Separately list only the salesperson's messages so the model can't confuse them with the prospect's
    const salespersonLines = messages
      .filter((m) => m.role === 'user')
      .map((m, i) => `[${i + 1}] ${m.content}`)
      .join('\n');

    const frameworkObj = framework ? getFrameworkById(framework) : null;
    const frameworkContext = frameworkObj && frameworkObj.id !== 'none'
      ? `\nSales framework being evaluated: ${frameworkObj.name} (${frameworkObj.description})\n${frameworkObj.coachingInstructions}`
      : '';

    const analysisPrompt = `You are an expert sales coach doing a post-call debrief. Analyze this sales practice conversation and give brutally honest, specific feedback.

Scenario: ${scenario}
Salesperson: ${settings.userName} from ${settings.companyName}
Product: ${settings.productDescription}
${frameworkContext}

FULL CONVERSATION (for context):
${conversationText}

${settings.userName.toUpperCase()}'S MESSAGES ONLY — the lines you must analyze for mistakes:
${salespersonLines}

Return ONLY a valid JSON object with this exact structure (no markdown, no preamble, ONLY double quotes " inside the JSON — never single quotes '):
{
  "score": <overall 0-100>,
  "strengths": ["specific strength 1 with example from the conversation", "strength 2", "strength 3"],
  "improvements": ["specific area to improve 1", "area 2", "area 3"],
  "mistakes": [
    {
      "whatWasSaid": "<exact short quote or paraphrase — MUST be from ${settings.userName}'s messages listed above, NEVER from the Prospect>",
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

CRITICAL RULES for "mistakes" array:
- ONLY quote ${settings.userName}'s messages — NEVER quote anything the Prospect said
- Each "whatWasSaid" must match one of the numbered lines in the ${settings.userName.toUpperCase()}'S MESSAGES section above
- "whatToSayInstead" must be a complete, natural-sounding sentence ${settings.userName} could say verbatim
- Find 3-5 mistakes focused on: missed discovery, pitching before listening, weak objection handling, no next-step ask
${frameworkObj && frameworkObj.id !== 'none' ? `- Also flag violations of ${frameworkObj.name} principles` : ''}

Scoring: Opening/rapport (0-20), Discovery/questions (0-20), Value proposition (0-20), Objection handling (0-20), Closing/next steps (0-20).
Be honest — a mediocre call should score 40-60, not 70+.`;

    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 1500,
      messages: [{ role: 'user', content: analysisPrompt }],
    });

    const rawText = response.choices[0]?.message?.content || '{}';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No valid JSON in response');

    // LLMs sometimes use single quotes — try standard parse first, then repair
    let analysis: Record<string, unknown>;
    try {
      analysis = JSON.parse(jsonMatch[0]);
    } catch {
      const repaired = jsonMatch[0]
        .replace(/:\s*'((?:[^'\\]|\\.)*)'/g, ': "$1"') // 'value' → "value"
        .replace(/,\s*([}\]])/g, '$1');                 // trailing commas
      analysis = JSON.parse(repaired);
    }

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
      summary: String(analysis.summary || 'Good practice session. Review the mistakes section for specific improvements.'),
      followUpEmail: String(analysis.followUpEmail || `Subject: Great speaking with you today\n\nHi,\n\nThank you for your time.\n\nBest,\n${settings.userName}`),
      frameworkScore: analysis.frameworkScore ? Math.max(0, Math.min(100, Number(analysis.frameworkScore))) : undefined,
      frameworkFeedback: analysis.frameworkFeedback ? String(analysis.frameworkFeedback) : undefined,
    };

    return NextResponse.json(sanitized);
  } catch (error) {
    console.error('Analyze API error:', error);
    return NextResponse.json({ error: 'Failed to analyze session. Please try again.' }, { status: 500 });
  }
}
