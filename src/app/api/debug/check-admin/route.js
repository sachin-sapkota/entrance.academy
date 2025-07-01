import { NextResponse } from 'next/server';
import { getAuthenticatedUser, isAdmin } from '@/lib/auth-helpers';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  try {
    console.log('=== DEBUG: Checking admin authentication ===');
    
    // Get authenticated user
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    console.log('Auth error:', authError);
    console.log('User:', user);
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        message: 'Not authenticated',
        authError,
        user: null
      });
    }
    
    // Check if user is admin
    const adminStatus = isAdmin(user);
    console.log('Is admin:', adminStatus);
    
    // Try to query the users table to see the actual role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
      
    console.log('Profile error:', profileError);
    console.log('User profile:', userProfile);
    
    // Test if we can insert into practice_sets (this will fail if RLS is blocking)
    const testInsert = await supabase
      .from('practice_sets')
      .insert([{
        title: 'TEST - DELETE ME',
        description: 'This is a test practice set',
        domains: [],
        questions: [],
        questions_count: 0,
        status: 'draft',
        is_live: false,
        code: 'test_debug',
        created_by: user.id
      }])
      .select()
      .single();
      
    console.log('Test insert result:', testInsert);
    
    // If successful, delete the test record
    if (testInsert.data) {
      await supabase
        .from('practice_sets')
        .delete()
        .eq('id', testInsert.data.id);
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      userProfile,
      isAdmin: adminStatus,
      testInsert: {
        success: !testInsert.error,
        error: testInsert.error?.message,
        data: testInsert.data ? 'Test record created and deleted' : null
      }
    });
  } catch (error) {
    console.error('Debug check error:', error);
    return NextResponse.json({
      success: false,
      message: 'Debug check failed',
      error: error.message
    }, { status: 500 });
  }
} 