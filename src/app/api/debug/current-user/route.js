import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a client-side equivalent supabase client
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request) {
  console.log('🔍 Current user check called');
  
  try {
    // Check session from client perspective
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    
    const response = {
      timestamp: new Date().toISOString(),
      session: {
        exists: !!session,
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email,
          role: session.user.user_metadata?.role,
          aud: session.user.aud,
          created_at: session.user.created_at
        } : null,
        access_token: session?.access_token ? 'Present (length: ' + session.access_token.length + ')' : null,
        refresh_token: session?.refresh_token ? 'Present (length: ' + session.refresh_token.length + ')' : null,
        expires_at: session?.expires_at,
        expires_in: session?.expires_in
      },
      sessionError: sessionError?.message || null,
      headers: Object.fromEntries(request.headers.entries())
    };
    
    console.log('🔍 Current user result:', response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('💥 Current user check error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 