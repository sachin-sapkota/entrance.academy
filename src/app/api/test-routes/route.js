import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'Routes are working!', 
    timestamp: new Date().toISOString() 
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    return NextResponse.json({ 
      message: 'POST route working!', 
      receivedData: body,
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Error parsing JSON',
      message: error.message 
    }, { status: 400 });
  }
} 