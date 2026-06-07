import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SessionAnalysis } from '@/lib/types';

const isGroq = !!process.env.GROQ_API_KEY;
const client = new OpenAI(
  isGroq
    ? { apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' }
    : { apiKey: 'ollama', baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1' }
);
const MODEL = isGroq
  ? (process.env.GROQ_MODEL || 'llama-3.3-70b-versatile')
  : (process.env.OLLAMA_MODEL || 'llama3.2');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

interface AnalyzeCallRequest {
  transcript: string;
  salespersonName?: string;
  productDescription?: string;
  scenario?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeCallRequest = await req.json();
    const { transcript, salespersonName = 'the salesperson', productDescription = 'the product', scenario = 'sales call' } = body;

    if (!transcript?.trim()) {
      return NextResponse.json({ error: 'Transcript is required.' }, { status: 400, headers: corsHeaders });
    }

    const prompt = `You are an expert sales coach analyzing a real recorded ${scenario}.
The salesperson is ${salespersonName}, selling ${productDescription}.

TRANSCRIPT:
${transcript.slice(0, 6000)}

Analyze this call and return a JSON object with this exact structure:
{
  "score": <integer 0-100>,
  "summary": "<2-3 sentence summary of how the call went overall>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "mistakes": [
    {
      "whatWasSaid": "<exact or paraphrased quote from the salesperson>",
      "whyItMissed": "<why this was ineffective — 1 sentence>",
      "whatToSayInstead": "<better alternative — specific, ready to use>"
    }
  ],
  "talkRatio": <estimated percentage 0-100 of how much the salesperson talked vs the prospect>,
  "followUpEmail": "<a ready-to-send follow-up email based on the call>"
}

Rules:
- mistakes array: 3-5 specific moments, focus on the biggest misses
- talkRatio: estimate from transcript length — if salesperson talked a lot, higher number
- followUpEmail: reference specific things discussed in the call
- Return ONLY the JSON, no other text`;

    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = response.choices[0]?.message?.content || '{}';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No valid JSON in response');

    const analysis: SessionAnalysis = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ analysis }, { headers: corsHeaders });
  } catch (error) {
    console.error('Analyze call error:', error);
    return NextResponse.json({ error: 'Analysis failed.' }, { status: 500, headers: corsHeaders });
  }
}
