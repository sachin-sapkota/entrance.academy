import { NextResponse } from 'next/server'
// import { prisma } from '@/lib/prisma' // Temporarily disabled for fallback

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const domainIds = searchParams.get('domainIds')?.split(',').map(Number).filter(Boolean)
    const limit = parseInt(searchParams.get('limit')) || 100
    const shuffle = searchParams.get('shuffle') === 'true'

    // Temporary fallback: return mock question data
    const mockQuestions = Array.from({ length: Math.min(limit, 20) }, (_, i) => ({
      id: i + 1,
      domainId: domainIds?.[0] || 1,
      categoryId: 1,
      questionType: 'single_choice',
      difficultyLevel: 'medium',
      text: `For any three sets A, B, C if A ∪ B = A ∪ C and A ∩ B = A ∩ C, then`,
      options: [
        { text: 'A = B', key: 'A' },
        { text: 'B = C', key: 'B' },
        { text: 'A = C', key: 'C' },
        { text: 'A = B = C', key: 'D' }
      ],
      correctAnswer: { correct_keys: ['B'] },
      explanation: 'When both union and intersection conditions are satisfied, it implies B = C.',
      points: 4,
      negativePoints: 1,
      estimatedTime: 90,
      isActive: true,
      domain: {
        id: domainIds?.[0] || 1,
        name: 'Mathematics',
        code: 'MATH',
        negativeMarkingRatio: 0.25
      },
      category: {
        id: 1,
        name: 'Algebra'
      }
    }))

    const questions = mockQuestions

    return NextResponse.json({
      questions,
      pagination: {
        page: 1,
        limit,
        totalCount: questions.length,
        totalPages: 1
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const data = await request.json()
    
    const question = await prisma.question.create({
      data: {
        domainId: data.domainId,
        categoryId: data.categoryId,
        questionType: data.questionType || 'single_choice',
        difficultyLevel: data.difficultyLevel || 'medium',
        text: data.text,
        options: data.options,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
        hint: data.hint,
        points: data.points || 4.0,
        negativePoints: data.negativePoints || 1.0,
        estimatedTime: data.estimatedTime || 60,
        tags: data.tags || [],
        createdBy: data.createdBy
      },
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
    })

    return NextResponse.json({ question }, { status: 201 })
  } catch (error) {
    console.error('Error creating question:', error)
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    )
  }
} 