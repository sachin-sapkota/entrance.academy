import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// PATCH - Update question importance points
export async function PATCH(request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { questionId, importancePoints } = body;

    if (!questionId || importancePoints === undefined) {
      return NextResponse.json(
        { success: false, message: 'Missing questionId or importancePoints' },
        { status: 400 }
      );
    }

    // Validate importance points (should be between 1 and 10)
    if (importancePoints < 1 || importancePoints > 10) {
      return NextResponse.json(
        { success: false, message: 'Importance points must be between 1 and 10' },
        { status: 400 }
      );
    }

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Update question importance using the database function
    const { data, error } = await supabase
      .rpc('update_question_importance', {
        question_id: parseInt(questionId),
        new_importance: parseInt(importancePoints)
      });

    if (error) {
      console.error('Error updating question importance:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to update importance points' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Question importance updated successfully'
    });

  } catch (error) {
    console.error('Error in importance update API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 