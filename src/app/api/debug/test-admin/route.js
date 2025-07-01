import { NextResponse } from 'next/server';

// GET - Simple test endpoint to verify API is working
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Test admin endpoint is working',
    timestamp: new Date().toISOString()
  });
}

// POST - Test the admin practice sets endpoints without auth
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, testSecret } = body;

    if (testSecret !== 'test-admin-2024') {
      return NextResponse.json(
        { success: false, message: 'Invalid test secret' },
        { status: 403 }
      );
    }

    if (action === 'list-practice-sets') {
      // Test the practice sets listing
      const host = request.headers.get('host') || 'localhost:3002';
      const baseUrl = `http://${host}`;
      const response = await fetch(`${baseUrl}/api/admin/practice-sets`, {
        headers: {
          'Authorization': 'Bearer fake-token-for-testing'
        }
      });
      
      const data = await response.text();
      
      return NextResponse.json({
        success: true,
        message: 'Practice sets API test',
        status: response.status,
        response: data
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Unknown action'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error: ' + error.message
    });
  }
} 