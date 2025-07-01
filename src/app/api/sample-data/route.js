import { NextResponse } from 'next/server';

// Sample practice set data
const samplePracticeSet = {
  id: 'ioe-model-exam-27-june',
  name: 'IOE Model Exam (27th June, 2024)',
  category: 'BE/ BArch Entrance Preparation',
  fullMarks: 140,
  passMarks: 56,
  durationMinutes: 120,
  negativeMarkingEnabled: true,
  negativeMarkingFactor: 0.25,
  totalQuestions: 20,
  description: 'Practice set for IOE entrance examination with mixed subjects including Mathematics, Physics, Chemistry, and English.'
};

// Sample questions with LaTeX expressions and images
const sampleQuestions = [
  {
    id: 1,
    text: 'Find the value of $\\lim_{x \\to 0} \\frac{\\sin x}{x}$',
    options: [
      { text: '0', image: null },
      { text: '1', image: null },
      { text: '$\\infty$', image: null },
      { text: 'Does not exist', image: null }
    ],
    correctAnswer: 'B',
    explanation: 'This is a fundamental limit. As $x$ approaches 0, $\\frac{\\sin x}{x}$ approaches 1.',
    domain: 'Mathematics',
    difficulty: 'medium'
  },
  {
    id: 2,
    text: 'The derivative of $f(x) = x^3 + 2x^2 - 5x + 3$ is:',
    options: [
      { text: '$3x^2 + 4x - 5$', image: null },
      { text: '$x^2 + 4x - 5$', image: null },
      { text: '$3x^2 + 2x - 5$', image: null },
      { text: '$3x^3 + 4x^2 - 5x$', image: null }
    ],
    correctAnswer: 'A',
    explanation: 'Using the power rule: $\\frac{d}{dx}[x^n] = nx^{n-1}$, we get $f\'(x) = 3x^2 + 4x - 5$.',
    domain: 'Mathematics',
    difficulty: 'easy'
  },
  {
    id: 3,
    text: 'The equation of motion for a particle under constant acceleration is given by $s = ut + \\frac{1}{2}at^2$. If $u = 10$ m/s, $a = 2$ m/s², find the displacement after 5 seconds.',
    options: [
      { text: '75 m', image: null },
      { text: '50 m', image: null },
      { text: '25 m', image: null },
      { text: '100 m', image: null }
    ],
    correctAnswer: 'A',
    explanation: 'Substituting values: $s = 10(5) + \\frac{1}{2}(2)(5^2) = 50 + 25 = 75$ m.',
    domain: 'Physics',
    difficulty: 'medium'
  },
  {
    id: 4,
    text: 'For the quadratic equation $ax^2 + bx + c = 0$, the discriminant is:',
    options: [
      { text: '$b^2 - 4ac$', image: null },
      { text: '$b^2 + 4ac$', image: null },
      { text: '$4ac - b^2$', image: null },
      { text: '$a^2 - 4bc$', image: null }
    ],
    correctAnswer: 'A',
    explanation: 'The discriminant $\\Delta = b^2 - 4ac$ determines the nature of roots of a quadratic equation.',
    domain: 'Mathematics',
    difficulty: 'easy'
  },
  {
    id: 5,
    text: 'The molecular formula of water is:',
    options: [
      { text: '$H_2O$', image: null },
      { text: '$H_2O_2$', image: null },
      { text: '$HO_2$', image: null },
      { text: '$H_3O$', image: null }
    ],
    correctAnswer: 'A',
    explanation: 'Water consists of 2 hydrogen atoms and 1 oxygen atom, hence $H_2O$.',
    domain: 'Chemistry',
    difficulty: 'easy'
  },
  {
    id: 6,
    text: 'The integral $\\int_0^{\\pi} \\sin x \\, dx$ equals:',
    options: [
      { text: '0', image: null },
      { text: '1', image: null },
      { text: '2', image: null },
      { text: '$\\pi$', image: null }
    ],
    correctAnswer: 'C',
    explanation: '$\\int_0^{\\pi} \\sin x \\, dx = [-\\cos x]_0^{\\pi} = -\\cos(\\pi) - (-\\cos(0)) = -(-1) - (-1) = 2$.',
    domain: 'Mathematics',
    difficulty: 'medium'
  },
  {
    id: 7,
    text: 'Newton\'s second law of motion is expressed as:',
    options: [
      { text: '$F = ma$', image: null },
      { text: '$F = \\frac{mv^2}{r}$', image: null },
      { text: '$F = \\frac{1}{2}mv^2$', image: null },
      { text: '$F = mg$', image: null }
    ],
    correctAnswer: 'A',
    explanation: 'Newton\'s second law states that force equals mass times acceleration: $F = ma$.',
    domain: 'Physics',
    difficulty: 'easy'
  },
  {
    id: 8,
    text: 'The pH of a neutral solution at 25°C is:',
    options: [
      { text: '0', image: null },
      { text: '7', image: null },
      { text: '14', image: null },
      { text: '1', image: null }
    ],
    correctAnswer: 'B',
    explanation: 'A neutral solution has equal concentrations of $H^+$ and $OH^-$ ions, resulting in pH = 7.',
    domain: 'Chemistry',
    difficulty: 'easy'
  },
  {
    id: 9,
    text: 'Which word is an antonym of "abundant"?',
    options: [
      { text: 'Plentiful', image: null },
      { text: 'Scarce', image: null },
      { text: 'Ample', image: null },
      { text: 'Copious', image: null }
    ],
    correctAnswer: 'B',
    explanation: '"Scarce" means existing in small quantities, which is the opposite of "abundant".',
    domain: 'English',
    difficulty: 'easy'
  },
  {
    id: 10,
    text: 'The matrix $A = \\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}$ has determinant:',
    options: [
      { text: '-2', image: null },
      { text: '2', image: null },
      { text: '10', image: null },
      { text: '0', image: null }
    ],
    correctAnswer: 'A',
    explanation: 'For a 2×2 matrix $\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$, determinant = $ad - bc = 1(4) - 2(3) = -2$.',
    domain: 'Mathematics',
    difficulty: 'medium'
  },
  {
    id: 11,
    text: 'The acceleration due to gravity on Earth is approximately:',
    options: [
      { text: '$9.8$ m/s²', image: null },
      { text: '$8.9$ m/s²', image: null },
      { text: '$10.8$ m/s²', image: null },
      { text: '$6.8$ m/s²', image: null }
    ],
    correctAnswer: 'A',
    explanation: 'The standard acceleration due to gravity on Earth is approximately $g = 9.8$ m/s².',
    domain: 'Physics',
    difficulty: 'easy'
  },
  {
    id: 12,
    text: 'The chemical symbol for gold is:',
    options: [
      { text: 'Go', image: null },
      { text: 'Gd', image: null },
      { text: 'Au', image: null },
      { text: 'Ag', image: null }
    ],
    correctAnswer: 'C',
    explanation: 'Gold\'s chemical symbol is Au, derived from the Latin word "aurum".',
    domain: 'Chemistry',
    difficulty: 'easy'
  },
  {
    id: 13,
    text: 'Complete the sentence: "The meeting was postponed _____ the heavy rain."',
    options: [
      { text: 'because', image: null },
      { text: 'due to', image: null },
      { text: 'since', image: null },
      { text: 'as', image: null }
    ],
    correctAnswer: 'B',
    explanation: '"Due to" is the correct preposition to use when indicating a cause.',
    domain: 'English',
    difficulty: 'easy'
  },
  {
    id: 14,
    text: 'The solution to the equation $2^x = 8$ is:',
    options: [
      { text: '$x = 2$', image: null },
      { text: '$x = 3$', image: null },
      { text: '$x = 4$', image: null },
      { text: '$x = 8$', image: null }
    ],
    correctAnswer: 'B',
    explanation: 'Since $8 = 2^3$, we have $2^x = 2^3$, therefore $x = 3$.',
    domain: 'Mathematics',
    difficulty: 'easy'
  },
  {
    id: 15,
    text: 'The unit of electric current is:',
    options: [
      { text: 'Volt', image: null },
      { text: 'Ampere', image: null },
      { text: 'Ohm', image: null },
      { text: 'Watt', image: null }
    ],
    correctAnswer: 'B',
    explanation: 'The ampere (A) is the SI unit of electric current.',
    domain: 'Physics',
    difficulty: 'easy'
  },
  {
    id: 16,
    text: 'Avogadro\'s number is approximately:',
    options: [
      { text: '$6.02 \\times 10^{23}$', image: null },
      { text: '$3.14 \\times 10^{8}$', image: null },
      { text: '$9.8 \\times 10^{2}$', image: null },
      { text: '$1.6 \\times 10^{-19}$', image: null }
    ],
    correctAnswer: 'A',
    explanation: 'Avogadro\'s number is $6.02 \\times 10^{23}$ particles per mole.',
    domain: 'Chemistry',
    difficulty: 'medium'
  },
  {
    id: 17,
    text: 'Which sentence is grammatically correct?',
    options: [
      { text: 'Neither of the students were present.', image: null },
      { text: 'Neither of the students was present.', image: null },
      { text: 'Neither of the student was present.', image: null },
      { text: 'Neither of the student were present.', image: null }
    ],
    correctAnswer: 'B',
    explanation: '"Neither" is singular, so it takes a singular verb "was".',
    domain: 'English',
    difficulty: 'medium'
  },
  {
    id: 18,
    text: 'The area of a circle with radius $r$ is:',
    options: [
      { text: '$\\pi r$', image: null },
      { text: '$2\\pi r$', image: null },
      { text: '$\\pi r^2$', image: null },
      { text: '$2\\pi r^2$', image: null }
    ],
    correctAnswer: 'C',
    explanation: 'The area of a circle is given by the formula $A = \\pi r^2$.',
    domain: 'Mathematics',
    difficulty: 'easy'
  },
  {
    id: 19,
    text: 'Ohm\'s law relates voltage, current, and resistance as:',
    options: [
      { text: '$V = IR$', image: null },
      { text: '$V = \\frac{I}{R}$', image: null },
      { text: '$V = I + R$', image: null },
      { text: '$V = I - R$', image: null }
    ],
    correctAnswer: 'A',
    explanation: 'Ohm\'s law states that voltage equals current times resistance: $V = IR$.',
    domain: 'Physics',
    difficulty: 'easy'
  },
  {
    id: 20,
    text: 'The most abundant gas in Earth\'s atmosphere is:',
    options: [
      { text: 'Oxygen ($O_2$)', image: null },
      { text: 'Carbon dioxide ($CO_2$)', image: null },
      { text: 'Nitrogen ($N_2$)', image: null },
      { text: 'Argon (Ar)', image: null }
    ],
    correctAnswer: 'C',
    explanation: 'Nitrogen ($N_2$) makes up about 78% of Earth\'s atmosphere.',
    domain: 'Chemistry',
    difficulty: 'easy'
  }
];

export async function GET(request) {
  // Prevent sample data access in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      success: false,
      error: 'Sample data access is not allowed in production environment'
    }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'practiceSet') {
      return NextResponse.json({
        success: true,
        practiceSet: samplePracticeSet
      });
    } else if (type === 'questions') {
      return NextResponse.json({
        success: true,
        questions: sampleQuestions
      });
    } else {
      return NextResponse.json({
        success: true,
        practiceSet: samplePracticeSet,
        questions: sampleQuestions
      });
    }
  } catch (error) {
    console.error('Sample data API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  // Prevent sample data creation in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      success: false,
      error: 'Sample data creation is not allowed in production environment'
    }, { status: 403 });
  }

  try {
    const { action } = await request.json();

    if (action === 'createSampleData') {
      // In a real app, this would insert into database
      console.log('Sample data created:', {
        practiceSet: samplePracticeSet,
        questionCount: sampleQuestions.length
      });

      return NextResponse.json({
        success: true,
        message: 'Sample data created successfully',
        practiceSet: samplePracticeSet,
        questionCount: sampleQuestions.length
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Sample data creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 