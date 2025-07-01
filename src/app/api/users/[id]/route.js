import { NextResponse } from 'next/server'
// import { prisma } from '@/lib/prisma' // Temporarily disabled for fallback

export async function GET(request, { params }) {
  try {
    const { id: userId } = await params

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Temporary fallback: return mock user
    const mockUser = {
      id: userId,
      email: 'user@example.com',
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

export async function PUT(request, { params }) {
  try {
    const { id: userId } = await params
    const data = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Update user profile
    const user = await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        fullName: data.fullName,
        studentId: data.studentId,
        institution: data.institution,
        gradeLevel: data.gradeLevel,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        profileImageUrl: data.profileImageUrl,
        preferredLanguage: data.preferredLanguage,
        timezone: data.timezone,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ user }, { status: 200 })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
} 