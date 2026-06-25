import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const subject = typeof body?.subject === 'string' ? body.subject.trim() : '';
    const concept = typeof body?.concept === 'string' ? body.concept.trim() : '';
    const masteryLevel = typeof body?.masteryLevel === 'string' ? body.masteryLevel.trim() : '';
    const overviewGist = typeof body?.overviewGist === 'string' ? body.overviewGist.trim() : '';
    const deepDiveGist = Array.isArray(body?.deepDiveGist) ? body.deepDiveGist : [];
    const strongAreas = Array.isArray(body?.strongAreas) ? body.strongAreas : [];
    const weakAreas = Array.isArray(body?.weakAreas) ? body.weakAreas : [];
    const nextSteps = Array.isArray(body?.nextSteps) ? body.nextSteps : [];
    const notes = typeof body?.notes === 'string' ? body.notes.trim() : '';

    if (!subject || !concept) {
      return NextResponse.json({ error: 'subject and concept are required.' }, { status: 400 });
    }

    const supabase = createClient();
    const now = new Date().toISOString();
    const payload = {
      subject,
      concept,
      mastery_level: masteryLevel,
      overview_gist: overviewGist,
      deep_dive_gist: deepDiveGist,
      strong_areas: strongAreas,
      weak_areas: weakAreas,
      next_steps: nextSteps,
      notes,
      last_updated: now,
    };

    const { error } = await supabase
      .from('concepts')
      .upsert(payload, { onConflict: 'subject,concept' });

    if (error) {
      return NextResponse.json({ error: 'Supabase upsert failed.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Request failed.' }, { status: 500 });
  }
}
