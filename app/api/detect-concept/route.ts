import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';

const anthropicApiKey = process.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_AUTH_TOKEN;
if (!anthropicApiKey) {
  throw new Error('Missing ANTHROPIC_API_KEY or ANTHROPIC_AUTH_TOKEN environment variable.');
}

const anthropic = createAnthropic({ apiKey: anthropicApiKey });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userMessage = typeof body?.userMessage === 'string' ? body.userMessage.trim() : '';

    if (!userMessage) {
      return NextResponse.json({ error: 'userMessage is required and must be a string.' }, { status: 400 });
    }

    const prompt = `Extract the subject and concept from the user's message. Return only a JSON object with exactly these two fields: subject and concept. If the message is not about studying a concept, return subject: '' and concept: ''.\n\nMessage: "${userMessage.replace(/"/g, '\\"')}"`;

    const result = await generateText({
      model: anthropic.languageModel('-haiku-4-5-20251001'),
      system: 'You are a concise extractor. Return valid JSON only.',
      messages: [{ role: 'user', content: prompt }],
      allowSystemInMessages: false,
    });

    const text = await result.text;
    let payload = { subject: '', concept: '' };

    try {
      const parsed = JSON.parse(text.trim());
      if (typeof parsed === 'object' && parsed !== null) {
        payload.subject = typeof parsed.subject === 'string' ? parsed.subject : '';
        payload.concept = typeof parsed.concept === 'string' ? parsed.concept : '';
      }
    } catch {
      // Keep fallback payload if JSON parsing fails.
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json({ error: 'Request failed.' }, { status: 500 });
  }
}
