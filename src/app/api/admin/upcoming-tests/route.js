import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { supabase } from '@/lib/supabase';

// Helper function to verify admin access
async function verifyAdminAccess(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return { error: 'Missing authorization header', status: 401 };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token with regular Supabase client
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { error: 'Invalid token', status: 401 };
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseServer
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return { error: 'Admin access required', status: 403 };
    }

    return { user, profile };
  } catch (error) {
    console.error('Error verifying admin access:', error);
    return { error: 'Authentication failed', status: 500 };
  }
}

// GET - Fetch all upcoming tests
export async function GET(request) {
  try {
    // For GET, we'll allow both authenticated users and public access
    // since upcoming tests might be visible to students too
    const { data: tests, error } = await supabaseServer
      .from('test_configurations')
      .select(`
        *,
        domains:domain_distribution
      `)
      .gte('available_from', new Date().toISOString())
      .order('available_from', { ascending: true });

    if (error) {
      console.error('Error fetching upcoming tests:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      upcomingTests: tests || [],
      message: 'Upcoming tests loaded successfully'
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to load upcoming tests' 
    }, { status: 500 });
  }
}

// POST - Create new upcoming test
export async function POST(request) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const testData = await request.json();

    // Validate required fields
    if (!testData.name || !testData.available_from) {
      return NextResponse.json({ 
        error: 'Missing required fields: name and available_from' 
      }, { status: 400 });
    }

    // Set default values and add creator
    const defaultTestData = {
      test_type: 'scheduled',
      shuffle_questions: true,
      shuffle_options: true,
      show_result_immediately: true,
      show_correct_answers: true,
      show_explanations: true,
      is_active: true,
      enable_negative_marking: true,
      negative_marking_ratio: 0.25,
      allow_question_navigation: true,
      allow_question_review: true,
      allow_answer_change: true,
      auto_submit: true,
      created_by: authResult.user.id,
      ...testData
    };

    const { data: newTest, error } = await supabaseServer
      .from('test_configurations')
      .insert(defaultTestData)
      .select()
      .single();

    if (error) {
      console.error('Error creating test:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      test: newTest,
      message: 'Test scheduled successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to create test' 
    }, { status: 500 });
  }
}

// PUT - Update existing test
export async function PUT(request) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id, ...updateData } = await request.json();

    if (!id) {
      return NextResponse.json({ 
        error: 'Test ID is required' 
      }, { status: 400 });
    }

    const { data: updatedTest, error } = await supabaseServer
      .from('test_configurations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating test:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      test: updatedTest,
      message: 'Test updated successfully'
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to update test' 
    }, { status: 500 });
  }
}

// DELETE - Delete test
export async function DELETE(request) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(request);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        error: 'Test ID is required' 
      }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from('test_configurations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting test:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Test deleted successfully'
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete test' 
    }, { status: 500 });
  }
} 