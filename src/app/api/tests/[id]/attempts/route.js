import { NextResponse } from 'next/server'
// import { prisma } from '@/lib/prisma' // Temporarily disabled for fallback

export async function POST(request, { params }) {
  try {
    const { id: testId } = await params
    const data = await request.json()
    
    // Temporary fallback: simulate answer submission
    // Get question details (mock)
    const mockQuestion = {
      id: data.questionId,
      text: 'Sample question',
      correctAnswer: { correct_keys: ['A'] },
      points: 4,
      negativePoints: 1,
      domain: {
        negativeMarkingRatio: 0.25
      }
    }

    // Determine if answer is correct
    const isCorrect = mockQuestion.correctAnswer.correct_keys?.includes(data.selectedAnswer)

    // Calculate points
    const pointsEarned = isCorrect ? mockQuestion.points : 0
    const pointsDeducted = !isCorrect && data.selectedAnswer ? mockQuestion.negativePoints : 0

    // Create mock attempt
    const mockAttempt = {
      id: `attempt-${testId}-${data.questionId}`,
      testId: testId,
      questionId: data.questionId,
      selectedAnswer: { key: data.selectedAnswer },
      isCorrect: isCorrect,
      pointsEarned: pointsEarned,
      pointsDeducted: pointsDeducted,
      timeSpentSeconds: data.timeSpent || 0,
      createdAt: new Date().toISOString()
    }

    return NextResponse.json({
      attempt: mockAttempt,
      question: mockQuestion,
      isCorrect,
      pointsEarned,
      pointsDeducted
    }, { status: 200 })
  } catch (error) {
    console.error('Error creating attempt:', error)
    return NextResponse.json(
      { error: 'Failed to create attempt' },
      { status: 500 }
    )
  }
}

export async function GET(request, { params }) {
  try {
    const { id: testId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Verify test belongs to user
    const test = await prisma.test.findFirst({
      where: {
        id: testId,
        userId: userId
      }
    })

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found or unauthorized' },
        { status: 404 }
      )
    }

    // Get all attempts for this test
    const attempts = await prisma.attempt.findMany({
      where: {
        testId: testId
      },
      include: {
        question: {
          include: {
            domain: {
              select: {
                id: true,
                name: true,
                code: true
              }
            },
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        questionOrder: 'asc'
      }
    })

    return NextResponse.json({ attempts }, { status: 200 })
  } catch (error) {
    console.error('Error fetching attempts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attempts' },
      { status: 500 }
    )
  }
} 