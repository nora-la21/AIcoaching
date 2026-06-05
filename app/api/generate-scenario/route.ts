import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Settings, CustomProspect } from '@/lib/types';

const isGroq = !!process.env.GROQ_API_KEY;

const client = new OpenAI(
  isGroq
    ? { apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' }
    : { apiKey: 'ollama', baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1' }
);

const MODEL = isGroq
  ? (process.env.GROQ_MODEL || 'llama-3.3-70b-versatile')
  : (process.env.OLLAMA_MODEL || 'llama3.2');

interface GenerateRequest {
  description: string;
  prospectName: string;
  prospectTitle: string;
  company: string;
  industry: string;
  difficulty: 'easy' | 'medium' | 'hard';
  settings: Settings;
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json();
    const { description, prospectName, prospectTitle, company, industry, difficulty, settings } = body;

    const difficultyGuide = {
      easy: 'The prospect is receptive and open. They have budget, a clear need, and are genuinely interested. Minor objections only. They will agree fairly quickly if the salesperson covers the basics.',
      medium: 'The prospect has some real concerns. They need convincing on ROI, have 2-3 meaningful objections, and are evaluating alternatives. They will buy if the salesperson handles objections well.',
      hard: 'The prospect is skeptical and guarded. Tight budget, strong loyalty to a competitor, multiple blockers. They interrupt, challenge claims, and will only move forward if the salesperson is exceptional.',
    };

    const prompt = `You are generating a realistic sales training persona. Create a detailed system prompt for an AI that will roleplay as this prospect in a 1-on-1 sales call practice session.

Input details:
- Prospect name: ${prospectName || 'Generate a realistic first name'}
- Title / Role: ${prospectTitle || 'Unspecified — infer from description'}
- Company: ${company || 'Unspecified — infer a realistic company'}
- Industry: ${industry === 'Any' ? 'Infer from context' : industry}
- Description: ${description || 'A typical decision-maker in this industry'}
- Difficulty: ${difficulty} — ${difficultyGuide[difficulty]}

The salesperson is ${settings.userName} from ${settings.companyName}, selling: ${settings.productDescription}.
Their value proposition: ${settings.valueProposition}.

Write a system prompt in second person ("You are...") for the AI prospect. Include:
1. Full name, title, company, and a brief realistic backstory (2–3 sentences)
2. Personality and communication style (e.g. direct, analytical, skeptical, warm)
3. Current business challenges and pain points relevant to what's being sold
4. Decision-making style (who else is involved, what matters most: price / ROI / ease / risk)
5. 3–5 specific objections they will raise, calibrated to the ${difficulty} difficulty
6. Subtle behavioral cues (e.g. often checks the time, asks about competitors, mentions budget constraints)
7. What they'd need to hear to move forward (their "win condition")

End the prompt with this exact line:
"After every response, on a new line write: COACHING_TIP: [one specific, actionable coaching tip for the salesperson based on what they just said]"

Write ONLY the system prompt text. No preamble, no metadata, no JSON.`;

    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const generatedProfile = response.choices[0]?.message?.content?.trim() || '';

    // Extract name and title from generated profile for display
    const nameMatch = generatedProfile.match(/You are ([A-Z][a-z]+ [A-Z][a-z]+)/);
    const resolvedName = nameMatch ? nameMatch[1] : (prospectName || 'Custom Prospect');

    const prospect: CustomProspect = {
      name: resolvedName,
      title: prospectTitle || 'Decision Maker',
      company: company || 'Prospect Company',
      industry,
      difficulty,
      description,
      generatedProfile,
    };

    return NextResponse.json({ prospect });
  } catch (error) {
    console.error('Generate scenario error:', error);
    return NextResponse.json({ error: 'Failed to generate prospect profile. Please try again.' }, { status: 500 });
  }
}
