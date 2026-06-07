import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const isGroq = !!process.env.GROQ_API_KEY;
const client = new OpenAI(
  isGroq
    ? { apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' }
    : { apiKey: 'ollama', baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1' }
);
const MODEL = isGroq
  ? (process.env.GROQ_MODEL || 'llama-3.3-70b-versatile')
  : (process.env.OLLAMA_MODEL || 'llama3.2');

interface GenerateProfileRequest {
  description: string;
}

export async function POST(req: NextRequest) {
  try {
    const { description }: GenerateProfileRequest = await req.json();
    if (!description?.trim()) {
      return NextResponse.json({ error: 'Description is required.' }, { status: 400 });
    }

    const prompt = `You are a sales training expert. Based on the description below, generate a complete sales coaching profile.

Description: ${description}

Generate a structured profile with these fields:
- suggestedName: A short (2-4 word) label for this profile (e.g. "WeTravel B2B", "Enterprise SaaS")
- companyName: The company name (infer from description or make a plausible one)
- productDescription: 2-3 sentences describing what they sell and for whom
- targetCustomer: The ideal buyer — include their role, company size, and industry
- valueProposition: 2-3 specific, ideally quantitative outcomes the product delivers
- commonObjections: Array of exactly 5 realistic objections this type of buyer would raise in their own words (1-2 sentences each, first person)

Return ONLY valid JSON, no other text:
{
  "suggestedName": "...",
  "companyName": "...",
  "productDescription": "...",
  "targetCustomer": "...",
  "valueProposition": "...",
  "commonObjections": ["...", "...", "...", "...", "..."]
}`;

    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 900,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = response.choices[0]?.message?.content || '{}';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No valid JSON in response');

    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Generate profile error:', error);
    return NextResponse.json({ error: 'Failed to generate profile.' }, { status: 500 });
  }
}
