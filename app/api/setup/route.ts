import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const serviceRoleKey = body?.serviceRoleKey;

    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Please provide serviceRoleKey in request body' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_SUPABASE_URL not configured' },
        { status: 500 }
      );
    }

    // Execute the RLS policy setup via Supabase SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql_exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
      body: JSON.stringify({
        sql: `
          DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON concepts;
          DROP POLICY IF EXISTS "Enable select for authenticated users only" ON concepts;
          DROP POLICY IF EXISTS "Enable update for authenticated users only" ON concepts;
          DROP POLICY IF EXISTS "Allow public insert" ON concepts;
          DROP POLICY IF EXISTS "Allow public select" ON concepts;
          DROP POLICY IF EXISTS "Allow public update" ON concepts;
          
          CREATE POLICY "Allow all insert" ON concepts FOR INSERT WITH CHECK (true);
          CREATE POLICY "Allow all select" ON concepts FOR SELECT USING (true);
          CREATE POLICY "Allow all update" ON concepts FOR UPDATE USING (true) WITH CHECK (true);
          CREATE POLICY "Allow all delete" ON concepts FOR DELETE USING (true);
          
          ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Supabase setup failed: ${error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Database policies configured successfully' });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Setup failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Study Agent Database Setup',
    instructions: 'POST your service role key to configure the database',
    example: {
      method: 'POST',
      url: '/api/setup',
      body: { serviceRoleKey: 'your-service-role-key-here' },
    },
  });
}
