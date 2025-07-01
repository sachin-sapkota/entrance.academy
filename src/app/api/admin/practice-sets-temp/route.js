import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Mock admin user for testing
const mockAdmin = {
  id: '12345678-1234-4567-8901-123456789012',
  email: 'admin@mcqtest.com',
  profile: {
    role: 'admin',
    full_name: 'Admin User'
  }
};

// GET - Fetch all practice sets (without auth)
export async function GET() {
  try {
    const { data: practiceSets, error } = await supabaseAdmin
      .from('practice_sets')
      .select(`
        id,
        title,
        description,
        domains,
        questions,
        is_live,
        created_at,
        updated_at,
        created_by
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Practice sets fetch error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch practice sets: ' + error.message },
        { status: 500 }
      );
    }

    // Get domain names for each practice set
    const practiceSetWithDomains = await Promise.all(
      (practiceSets || []).map(async (set) => {
        const domainNames = [];
        if (set.domains && set.domains.length > 0) {
          const { data: domains } = await supabaseAdmin
            .from('domains')
            .select('name')
            .in('id', set.domains);
          
          domainNames.push(...(domains || []).map(d => d.name));
        }
        
        return {
          ...set,
          domainNames,
          questionCount: Array.isArray(set.questions) ? set.questions.length : 0
        };
      })
    );

    return NextResponse.json({
      success: true,
      practiceSets: practiceSetWithDomains
    });
  } catch (error) {
    console.error('Error fetching practice sets:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch practice sets' },
      { status: 500 }
    );
  }
}

// POST - Create new practice set (without auth)
export async function POST(request) {
  try {
    const body = await request.json();
    const { title, description, domains, questions, isLive } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, message: 'Title is required' },
        { status: 400 }
      );
    }

    const practiceSetData = {
      title,
      description: description || '',
      domains: domains || [],
      questions: questions || [],
      is_live: isLive || false,
      created_by: mockAdmin.id,
      updated_by: mockAdmin.id
    };

    const { data: practiceSet, error } = await supabaseAdmin
      .from('practice_sets')
      .insert([practiceSetData])
      .select()
      .single();

    if (error) {
      console.error('Practice set creation error:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create practice set: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Practice set created successfully',
      practiceSet
    });
  } catch (error) {
    console.error('Error creating practice set:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create practice set' },
      { status: 500 }
    );
  }
} 