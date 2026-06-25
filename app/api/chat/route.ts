import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const anthropicApiKey = process.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_AUTH_TOKEN;
if (!anthropicApiKey) {
  throw new Error('Missing ANTHROPIC_API_KEY or ANTHROPIC_AUTH_TOKEN environment variable.');
}

const anthropic = createAnthropic({ apiKey: anthropicApiKey });

function buildSystemPrompt(row: {
  mastery_level?: string | null;
  weak_areas?: string | null;
  strong_areas?: string | null;
} | null): string {
  const weakAreas = row?.weak_areas?.trim() || 'None specified';
  const strongAreas = row?.strong_areas?.trim() || 'None specified';

  if (!row?.mastery_level) {
    return `You are an educational assistant. Teach in a beginner-friendly way, using analogies first and defining all terms clearly.\n\nKnown weak areas: ${weakAreas}.\nKnown strong areas: ${strongAreas}.\n\nAnswer the user's question with clear examples and plain explanations.`;
  }

  const mastery = row.mastery_level.toLowerCase();
  if (mastery === 'introduced' || mastery === 'developing') {
    return `You are an educational coach for a learner who has some prior exposure but is still building skill. Reference prior knowledge, mention likely weak areas, and teach at a moderate pace.\n\nKnown weak areas: ${weakAreas}.\nKnown strong areas: ${strongAreas}.\n\nFocus on helping the learner understand concepts clearly without rushing through important steps.`;
  }

  if (mastery === 'proficient' || mastery === 'strong') {
    return `You are a technical explainer for an experienced learner. Skip basic definitions, focus on nuance, edge cases, and deeper understanding.\n\nKnown weak areas: ${weakAreas}.\nKnown strong areas: ${strongAreas}.\n\nAssume the learner is comfortable with fundamentals and provide precise, advanced guidance.`;
  }

  return `You are an educational assistant. Teach in a beginner-friendly way, using analogies first and defining all terms clearly.\n\nKnown weak areas: ${weakAreas}.\nKnown strong areas: ${strongAreas}.\n\nAnswer the user's question with clear examples and plain explanations.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userMessage = typeof body?.userMessage === 'string' ? body.userMessage.trim() : '';
    const subject = typeof body?.subject === 'string' ? body.subject.trim() : '';
    const concept = typeof body?.concept === 'string' ? body.concept.trim() : '';

    if (!userMessage) {
      return NextResponse.json({ error: 'userMessage is required and must be a string.' }, { status: 400 });
    }

    let conceptRow: { mastery_level?: string | null; weak_areas?: string | null; strong_areas?: string | null } | null = null;

    if (subject && concept) {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('concepts')
        .select('mastery_level, weak_areas, strong_areas')
        .match({ subject, concept })
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: 'Supabase query failed.' }, { status: 500 });
      }

      conceptRow = data ?? null;
    }

    const systemPrompt = buildSystemPrompt(conceptRow);
    const result = await generateText({
      model: anthropic.languageModel('claude-sonnet-4-20250514'),
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      allowSystemInMessages: false,
    });

    const response = result.toTextStreamResponse({
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    console.error('Chat route error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message || 'Request failed.' }, { status: 500 });
  }
}
