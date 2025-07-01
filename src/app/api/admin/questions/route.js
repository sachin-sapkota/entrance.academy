import { NextResponse } from 'next/server';

// Mock questions data
let mockQuestions = [
  {
    id: '1',
    domain: 'Mathematics',
    text: 'What is the derivative of x²?',
    options: [
      { text: '2x', key: 'A' },
      { text: 'x', key: 'B' },
      { text: '2', key: 'C' },
      { text: 'x²', key: 'D' }
    ],
    correctAnswer: 'A',
    explanation: 'The derivative of x² is 2x using the power rule.',
    createdAt: '2024-01-15T10:00:00Z'
  }
];

// GET - Fetch all questions
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      questions: mockQuestions
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

// POST - Create new question
export async function POST(request) {
  try {
    const body = await request.json();
    const { domain, text, options, correctAnswer, explanation } = body;

    if (!domain || !text || !options || !correctAnswer) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newQuestion = {
      id: Date.now().toString(),
      domain,
      text,
      options,
      correctAnswer,
      explanation: explanation || '',
      createdAt: new Date().toISOString()
    };

    mockQuestions.push(newQuestion);

    return NextResponse.json({
      success: true,
      question: newQuestion,
      message: 'Question created successfully'
    });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create question' },
      { status: 500 }
    );
  }
} 