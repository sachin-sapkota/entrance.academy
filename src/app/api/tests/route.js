import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    // Get auth header
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Authorization header missing or invalid' 
      }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Invalid token',
        details: authError?.message 
      }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit')) || 100
    const page = parseInt(searchParams.get('page')) || 1
    const offset = (page - 1) * limit

    // Build query
    let query = supabaseAdmin
      .from('tests')
      .select(`
        id,
        user_id,
        test_name,
        status,
        started_at,
        submitted_at,
        evaluated_at,
        total_questions,
        attempted_questions,
        unattempted_questions,
        correct_answers,
        wrong_answers,
        total_marks,
        obtained_marks,
        negative_marks,
        final_score,
        percentage,
        time_spent_seconds,
        created_at,
        updated_at,
        meta_data,
        test_configurations (
          id,
          name,
          description,
          test_type,
          test_category,
          duration_minutes
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: tests, error: testsError, count } = await query

    if (testsError) {
      logger.error('Error fetching tests', { 
        error: testsError, 
        userId: user.id,
        status,
        limit,
        page 
      })
      return NextResponse.json({ 
        error: 'Failed to fetch tests',
        details: testsError.message 
      }, { status: 500 })
    }

    logger.info('Tests fetched successfully', { 
      userId: user.id, 
      testCount: tests?.length || 0,
      status,
      limit,
      page
    })

    return NextResponse.json({
      success: true,
      tests: tests || [],
      pagination: {
        page,
        limit,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    logger.error('Error in tests API', { error: error.message, stack: error.stack })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    // Get auth header
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Authorization header missing or invalid' 
      }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Invalid token',
        details: authError?.message 
      }, { status: 401 })
    }

    const data = await request.json()
    
    // Validate required fields
    if (!data.testConfigId && !data.practiceSetId) {
      return NextResponse.json(
        { error: 'Either testConfigId or practiceSetId is required' },
        { status: 400 }
      )
    }

    let testConfig
    let questions = []

    if (data.practiceSetId) {
      // Get practice set
      const { data: practiceSet, error: practiceSetError } = await supabaseAdmin
        .from('practice_sets')
        .select('*')
        .eq('id', data.practiceSetId)
        .single()

      if (practiceSetError || !practiceSet) {
        return NextResponse.json(
          { error: 'Practice set not found' },
          { status: 404 }
        )
      }

      // Get questions from practice set
      if (practiceSet.questions && Array.isArray(practiceSet.questions)) {
        const questionIds = practiceSet.questions.map(q => typeof q === 'object' ? q.id : q)
        
        const { data: practiceQuestions, error: questionsError } = await supabaseAdmin
          .from('questions')
          .select(`
            *,
            domains (
              id,
              name,
              code,
              negative_marking_ratio
            )
          `)
          .in('id', questionIds)

        if (questionsError) {
          logger.error('Error fetching practice set questions', { error: questionsError })
        } else {
          questions = practiceQuestions || []
        }
      }

      // Create a mock test config from practice set
      testConfig = {
        id: practiceSet.id,
        name: practiceSet.title,
        description: practiceSet.description,
        duration_minutes: practiceSet.estimated_time_minutes || 60,
        total_questions: practiceSet.questions_count || questions.length,
        enable_negative_marking: true,
        negative_marking_ratio: 0.25
      }
    } else {
      // Get test configuration
      const { data: configData, error: configError } = await supabaseAdmin
        .from('test_configurations')
        .select('*')
        .eq('id', data.testConfigId)
        .single()

      if (configError || !configData) {
        return NextResponse.json(
          { error: 'Test configuration not found' },
          { status: 404 }
        )
      }

      testConfig = configData

      // Get questions based on test configuration
      // This would involve more complex logic to select questions based on domain distribution, etc.
      // For now, we'll keep it simple
      const { data: configQuestions, error: questionsError } = await supabaseAdmin
        .from('questions')
        .select(`
          *,
          domains (
            id,
            name,
            code,
            negative_marking_ratio
          )
        `)
        .eq('is_active', true)
        .limit(testConfig.total_questions)

      if (questionsError) {
        logger.error('Error fetching questions', { error: questionsError })
        questions = []
      } else {
        questions = configQuestions || []
      }
    }

    // Create test record
    const testData = {
      user_id: user.id,
      test_config_id: data.testConfigId || null,
      test_name: data.testName || testConfig.name,
      status: 'not_started',
      total_questions: questions.length,
      questions_order: questions.map(q => q.id),
      expires_at: new Date(Date.now() + (testConfig.duration_minutes * 60 * 1000)).toISOString(),
      meta_data: {
        practice_set_id: data.practiceSetId || null,
        test_type: data.practiceSetId ? 'practice' : 'test'
      }
    }

    const { data: newTest, error: testError } = await supabaseAdmin
      .from('tests')
      .insert(testData)
      .select()
      .single()

    if (testError) {
      logger.error('Error creating test', { error: testError, testData })
      return NextResponse.json(
        { error: 'Failed to create test', details: testError.message },
        { status: 500 }
      )
    }

    logger.info('Test created successfully', { 
      testId: newTest.id, 
      userId: user.id,
      questionCount: questions.length
    })

    return NextResponse.json({
      success: true,
      test: newTest,
      questions: questions,
      config: testConfig
    }, { status: 201 })

  } catch (error) {
    logger.error('Error in test creation API', { error: error.message, stack: error.stack })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 