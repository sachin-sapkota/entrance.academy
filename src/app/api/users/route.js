import { NextResponse } from 'next/server'
// import { prisma } from '@/lib/prisma' // Temporarily disabled for fallback

export async function POST(request) {
  try {
    const data = await request.json()

    if (!data.id || !data.email) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
        { status: 400 }
      )
    }

    // Temporary fallback: return mock user
    const mockUser = {
      id: data.id,
      email: data.email,
      fullName: data.fullName || data.email,
      role: data.role || 'student',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({ user: mockUser }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const id = searchParams.get('id')

    if (!id && !email) {
      return NextResponse.json(
        { error: 'User ID or email is required' },
        { status: 400 }
      )
    }

    // Temporary fallback: return mock user
    const mockUser = {
      id: id || 'mock-user-id',
      email: email || 'user@example.com',
      fullName: 'Test User',
      role: 'student',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({ user: mockUser }, { status: 200 })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
} 