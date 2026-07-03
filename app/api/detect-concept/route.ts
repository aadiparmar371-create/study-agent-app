import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';

function getAnthropicClient() {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_AUTH_TOKEN;
  if (!anthropicApiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY or ANTHROPIC_AUTH_TOKEN environment variable.');
  }

  return createAnthropic({ apiKey: anthropicApiKey });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userMessage = typeof body?.userMessage === 'string' ? body.userMessage.trim() : '';

    if (!userMessage) {
      return NextResponse.json({ error: 'userMessage is required and must be a string.' }, { status: 400 });
    }

    const prompt = `Extract the subject and concept from the user's message. Return only a JSON object with exactly these two fields: subject and concept. If the message is not about studying a concept, return subject: '' and concept: ''.\n\nMessage: "${userMessage.replace(/"/g, '\\"')}"`;

    const anthropic = getAnthropicClient();
    const result = await generateText({
      model: anthropic.languageModel('claude-haiku-4-5-20251001'),
      system: 'You are a concise extractor. Return valid JSON only.',
      messages: [{ role: 'user', content: prompt }],
      allowSystemInMessages: false,
    });

    const text = await result.text;
    let payload = { subject: '', concept: '' };

    try {
      // Handle markdown code blocks
      let jsonStr = text.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7); // Remove ```json
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3); // Remove ```
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3); // Remove trailing ```
      }
      jsonStr = jsonStr.trim();

      const parsed = JSON.parse(jsonStr);
      if (typeof parsed === 'object' && parsed !== null) {
        payload.subject = typeof parsed.subject === 'string' ? parsed.subject : '';
        payload.concept = typeof parsed.concept === 'string' ? parsed.concept : '';
      }
    } catch (parseError) {
      console.warn('JSON parse error in detect-concept:', parseError, 'Text was:', text);
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Detect-concept error:', error);
    return NextResponse.json({ error: 'Request failed.' }, { status: 500 });
  }
}
