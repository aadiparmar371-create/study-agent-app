import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Try to call a procedure that initializes RLS policies
    // If the policies already exist, this will error (which is fine)
    const { error: policyError } = await supabase.rpc('setup_rls_policies');
    
    if (policyError && !policyError.message.includes('already exists')) {
      console.warn('RLS policy setup warning:', policyError);
    }

    return NextResponse.json({ 
      message: 'Database initialization attempted',
      error: policyError?.message || null 
    });
  } catch (error) {
    console.error('Init DB error:', error);
    return NextResponse.json({ error: 'Init failed' }, { status: 500 });
  }
}
