import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST - Submit issue report
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      title,
      email,
      issue_type,
      description,
      steps_to_reproduce,
      expected_behavior,
      actual_behavior,
      user_id,
      page_url,
      error_message 
    } = body;

    // Validate required fields
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Title is required' 
      }, { status: 400 });
    }

    if (!issue_type || !['bug_report', 'performance_issue', 'security_concern', 'other'].includes(issue_type)) {
      return NextResponse.json({ 
        error: 'Valid issue type is required' 
      }, { status: 400 });
    }

    if (!description || description.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Description is required' 
      }, { status: 400 });
    }

    // Get user agent and other request info
    const userAgent = request.headers.get('user-agent') || '';
    
    // Extract browser and OS info from user agent
    const getBrowserInfo = (userAgent) => {
      let browser = 'Unknown';
      let os = 'Unknown';
      
      // Simple browser detection
      if (userAgent.includes('Chrome')) browser = 'Chrome';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Safari')) browser = 'Safari';
      else if (userAgent.includes('Edge')) browser = 'Edge';
      
      // Simple OS detection
      if (userAgent.includes('Windows')) os = 'Windows';
      else if (userAgent.includes('Mac')) os = 'macOS';
      else if (userAgent.includes('Linux')) os = 'Linux';
      else if (userAgent.includes('Android')) os = 'Android';
      else if (userAgent.includes('iOS')) os = 'iOS';
      
      return { browser, os };
    };

    const { browser, os } = getBrowserInfo(userAgent);
    
    // Prepare issue report data
    const issueData = {
      title: title.trim(),
      issue_type,
      description: description.trim(),
      browser,
      operating_system: os,
      page_url,
      error_message,
      created_at: new Date().toISOString()
    };

    // Add user info if authenticated
    if (user_id) {
      issueData.user_id = user_id;
    } else {
      // For anonymous reports, email is required
      if (!email || !email.includes('@')) {
        return NextResponse.json({ 
          error: 'Valid email is required for anonymous reports' 
        }, { status: 400 });
      }
      issueData.email = email.trim();
    }

    // Add optional fields
    if (steps_to_reproduce) {
      issueData.steps_to_reproduce = steps_to_reproduce.trim();
    }
    
    if (expected_behavior) {
      issueData.expected_behavior = expected_behavior.trim();
    }
    
    if (actual_behavior) {
      issueData.actual_behavior = actual_behavior.trim();
    }

    // Determine device type
    if (userAgent.includes('Mobile')) {
      issueData.device_type = 'mobile';
    } else if (userAgent.includes('Tablet')) {
      issueData.device_type = 'tablet';
    } else {
      issueData.device_type = 'desktop';
    }

    // Insert issue report into database
    const { data: issue, error } = await supabase
      .from('issue_reports')
      .insert(issueData)
      .select('id, title, status, severity, created_at')
      .single();

    if (error) {
      console.error('Error inserting issue report:', error);
      return NextResponse.json({ 
        error: 'Failed to submit issue report' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Issue report submitted successfully',
      issue: {
        id: issue.id,
        title: issue.title,
        status: issue.status,
        severity: issue.severity,
        submitted_at: issue.created_at
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/issues:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// GET - Get issue reports (for admins or user's own issues)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const status = searchParams.get('status');
    const issue_type = searchParams.get('issue_type');
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit')) || 20;
    const offset = parseInt(searchParams.get('offset')) || 0;

    let query = supabase
      .from('issue_reports')
      .select(`
        id,
        title,
        email,
        issue_type,
        description,
        status,
        severity,
        category,
        page_url,
        browser,
        operating_system,
        device_type,
        created_at,
        resolved_at,
        user:users(full_name, email)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (issue_type) {
      query = query.eq('issue_type', issue_type);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data: issues, error } = await query;

    if (error) {
      console.error('Error fetching issue reports:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch issue reports' 
      }, { status: 500 });
    }

    return NextResponse.json({
      issues,
      hasMore: issues.length === limit
    });

  } catch (error) {
    console.error('Error in GET /api/issues:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 