import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Transcription always uses Groq (Whisper). Ollama has no equivalent.
const GROQ_KEY = process.env.GROQ_API_KEY;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  if (!GROQ_KEY) {
    return NextResponse.json(
      { error: 'Transcription requires a GROQ_API_KEY. Add it to your .env.local file.' },
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided.' }, { status: 400, headers: corsHeaders });
    }

    const client = new OpenAI({ apiKey: GROQ_KEY, baseURL: 'https://api.groq.com/openai/v1' });

    const transcription = await client.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3-turbo',
      response_format: 'text',
    });

    return NextResponse.json({ transcript: transcription }, { headers: corsHeaders });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: 'Transcription failed. Check your GROQ_API_KEY.' }, { status: 500, headers: corsHeaders });
  }
}
