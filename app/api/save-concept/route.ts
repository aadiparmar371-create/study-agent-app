import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Use service role key for admin access (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase credentials');
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
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

    const { error: upsertError } = await supabase
      .from('concepts')
      .upsert(payload, { onConflict: 'subject,concept' });

    if (upsertError) {
      console.error('Supabase upsert error:', upsertError);
      return NextResponse.json({ error: `Save failed: ${upsertError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save concept error:', error);
    return NextResponse.json({ 
      error: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}
