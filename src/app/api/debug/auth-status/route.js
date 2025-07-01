import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helpers';

export async function GET(request) {
  try {
    console.log('🔍 Debug: Checking authentication status...');
    
    const { user, error } = await getAuthenticatedUser(request);
    
    const response = {
      authenticated: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.profile?.role || 'unknown'
      } : null,
      error: error || null,
      timestamp: new Date().toISOString(),
      headers: {
        authorization: request.headers.get('Authorization') ? 'present' : 'missing',
        customAuth: request.headers.get('X-Supabase-Auth') ? 'present' : 'missing',
        cookies: request.headers.get('cookie') ? 'present' : 'missing'
      }
    };
    
    console.log('🔍 Debug auth status:', response);
    
    return NextResponse.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Debug auth status error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 