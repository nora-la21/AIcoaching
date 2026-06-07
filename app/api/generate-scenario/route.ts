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
      easy: 'Receptive and open. Budget exists, need is clear, minor objections only. Will agree if the salesperson covers the basics.',
      medium: 'Has real concerns. Needs convincing on ROI, evaluating 1-2 alternatives, will buy if objections are handled well.',
      hard: 'Skeptical and guarded. Tight budget, strong loyalty to a competitor or status quo. Interrupts, challenges every claim, will only move if the salesperson is exceptional.',
    };

    const prompt = `You are building a rich sales training persona. Generate a realistic prospect profile in the exact XML format below.

Input:
- Name: ${prospectName || 'Generate a realistic first + last name'}
- Title: ${prospectTitle || 'Infer from description'}
- Company: ${company || 'Infer a realistic company name'}
- Industry: ${industry === 'Any' ? 'Infer from context' : industry}
- Description: ${description || 'A typical decision-maker in this industry'}
- Difficulty: ${difficulty} — ${difficultyGuide[difficulty]}

Product being sold: ${settings.productDescription} by ${settings.companyName}.
Value proposition: ${settings.valueProposition}.

Generate the persona in this EXACT format — fill every section with specific, realistic detail:

<role>
[Who they are: full name, title, company size/scale, 2-sentence backstory. Core personality — what drives them, what they fear, what past vendor experience shapes how they behave. Write in third person.]
</role>

<voice_communication_style>
[How they sound on a call: pace, directness, emotional tone. Do they interrupt? Ask a lot of questions or stay guarded? Include 2-3 actual phrases they say. Make it feel like a real person, not a description. 4-5 sentences.]
</voice_communication_style>

<proactive_questions>
- [Sharp early question they ask the salesperson]
- [Question probing proof, metrics, or evidence]
- [Question about implementation risk or timeline]
- [Question that tests the salesperson's product knowledge]
- [Question that reveals their underlying real concern]
</proactive_questions>

<common_objections>
- [First-person objection in their voice, specific to THIS product being sold]
- [Budget or ROI objection]
- [Risk, change-management, or integration objection]
- [Status-quo or competitor loyalty objection]
</common_objections>

<enter_conversation_mode>
[Their mental state at the start of this call. What they say in their very first sentence. What the salesperson must do in the first 30 seconds to keep them engaged. 2-3 sentences.]
</enter_conversation_mode>

Write ONLY the XML structure. No preamble, no explanations, no extra text.`;

    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    });

    const characterBlock = response.choices[0]?.message?.content?.trim() || '';

    // Append invariant behavioral rules so the prospect never breaks character
    const generatedProfile = `${characterBlock}

ROLE: You are playing the BUYER / PROSPECT above. You are NOT the salesperson. You are NOT selling anything.
The person talking to you (${settings.userName}) is trying to sell you ${settings.productDescription} from ${settings.companyName}. Your job is to evaluate whether to buy — respond authentically based on your character above.

Keep all responses 2-4 sentences. Stay fully in character. Never break the fourth wall. Never offer to sell anything.

After EVERY response, on a completely new line write:
COACHING_TIP: [one specific, actionable tip for the salesperson about what they just said or did — 1-2 sentences]`;

    // Extract name from the <role> block
    const roleMatch = characterBlock.match(/<role>([\s\S]*?)<\/role>/i);
    const roleText = roleMatch ? roleMatch[1] : characterBlock;
    const nameMatch = roleText.match(/\b([A-Z][a-z]+ [A-Z][a-z]+)\b/);
    const resolvedName = nameMatch ? nameMatch[1] : (prospectName || 'Custom Prospect');

    const resolvedTitle = prospectTitle || (() => {
      const titleMatch = roleText.match(/,\s*([A-Z][^,\n.]{3,40}?)(?:\s+at\s|\s+of\s|\.|,)/);
      return titleMatch ? titleMatch[1].trim() : 'Decision Maker';
    })();

    const prospect: CustomProspect = {
      name: resolvedName,
      title: resolvedTitle,
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
