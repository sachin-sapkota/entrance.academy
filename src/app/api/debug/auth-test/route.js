import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helpers';

export async function GET(request) {
  console.log('🧪 Auth test endpoint called');
  
  try {
    // Log all headers
    const headers = Object.fromEntries(request.headers.entries());
    console.log('📋 All request headers:', headers);
    
    // Try to authenticate
    const { user, error } = await getAuthenticatedUser(request);
    
    const response = {
      timestamp: new Date().toISOString(),
      success: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'free_user'
      } : null,
      error: error || null,
      headers: {
        authorization: headers.authorization || null,
        'x-supabase-auth': headers['x-supabase-auth'] || null,
        cookie: headers.cookie ? 'Present (length: ' + headers.cookie.length + ')' : null
      },
      cookieDetails: headers.cookie ? 
        headers.cookie.split(';').map(c => c.trim().split('=')[0]).filter(name => 
          name.includes('supabase') || name.includes('sb-')
        ) : []
    };
    
    console.log('🔍 Auth test result:', response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('💥 Auth test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request) {
  console.log('🧪 Auth test POST endpoint called');
  
  try {
    const body = await request.json();
    console.log('📋 Request body:', body);
    
    // Try to authenticate
    const { user, error } = await getAuthenticatedUser(request);
    
    const response = {
      timestamp: new Date().toISOString(),
      success: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'free_user'
      } : null,
      error: error || null,
      receivedBody: body
    };
    
    console.log('🔍 Auth test POST result:', response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('💥 Auth test POST error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 