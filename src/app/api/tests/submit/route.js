import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '../../../../lib/auth-helpers';
import { logger } from '../../../../lib/logger';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  const startTime = Date.now();
  
  try {
    logger.timeStart('test-submission');
    
    // Get authenticated user from request
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      logger.warn('Test submission authentication failed', { error: authError });
      return NextResponse.json({ 
        error: 'Authentication required',
        details: authError 
      }, { status: 401 });
    }

    const { testId } = await request.json();
    const userId = user.id;

    if (!testId) {
      logger.warn('Test submission missing testId', { userId });
      return NextResponse.json({ error: 'Missing testId' }, { status: 400 });
    }

    logger.testEvent('submission_started', testId, userId);

    // Get session data from database
    let sessionData = null;
    
    const { data: allSessions, error: allSessionsError } = await supabaseAdmin
      .from('test_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (!allSessionsError && allSessions) {
      sessionData = allSessions.find(s => 
        s.browser_state?.practiceSetId === testId || s.test_id === testId
      );
    }
    
    // Fallback session lookup
    if (!sessionData) {
      const { data: directSession, error: directError } = await supabaseAdmin
        .from('test_sessions')
        .select('*')
        .eq('test_id', testId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();
      
      sessionData = directSession;
      if (directError) {
        logger.error('Session not found for test submission', { 
          testId, 
          userId: userId.substring(0, 8) + '...',
          error: directError.message 
        });
        return NextResponse.json({ error: 'Session not found. Please restart the test.' }, { status: 404 });
      }
    }

    logger.debug('Session found', { 
      sessionId: sessionData.id,
      answersCount: Object.keys(sessionData.answers || {}).length
    });

    // Get practice set data
    const practiceSetId = sessionData.browser_state?.practiceSetId || testId;
    
    const { data: practiceSet, error: practiceSetError } = await supabaseAdmin
      .from('practice_sets')
      .select('*')
      .eq('id', practiceSetId)
      .single();

    let questions = [];
    let testName = 'Unknown Test';

    if (practiceSet && !practiceSetError) {
      questions = practiceSet.questions || [];
      testName = practiceSet.title;
      logger.debug('Loaded practice set', { 
        practiceSetId,
        questionsCount: questions.length,
        testName 
      });
    } else {
      logger.warn('Practice set not found, using fallback', { practiceSetId, error: practiceSetError?.message });
      
      // Fallback to sample data
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'
        : `http://${request.headers.get('host') || 'localhost:3001'}`;
        
      const questionsResponse = await fetch(`${baseUrl}/api/sample-data?type=questions`);
      if (questionsResponse.ok) {
        const questionsData = await questionsResponse.json();
        if (questionsData.success) {
          questions = questionsData.questions;
          testName = 'Sample Test';
        }
      }
    }

    if (questions.length === 0) {
      logger.error('No questions found for test', { testId, practiceSetId });
      throw new Error('No questions found for this test');
    }

    const submissionTime = new Date().toISOString();
    const startTime = new Date(sessionData.created_at).getTime();
    const endTime = new Date().getTime();
    const totalTimeSpent = Math.floor((endTime - startTime) / 1000);

    // Calculate results
    const userAnswers = sessionData.answers || {};
    const results = calculateTestResults(questions, userAnswers, submissionTime, totalTimeSpent);
    
    logger.debug('Test results calculated', {
      totalQuestions: results.totalQuestions,
      attemptedQuestions: results.attemptedQuestions,
      correctAnswers: results.correctAnswers,
      percentage: results.percentage
    });

    // Create questions in database and get mapping
    logger.debug('Creating questions in database');
    const questionIdMapping = {};
    
    for (let i = 0; i < questions.length; i++) {
      const questionData = questions[i];
      
      try {
        const { data: insertedQuestion, error: questionError } = await supabaseAdmin
          .from('questions')
          .insert({
            text: questionData.text || `Question ${i + 1}`,
            options: questionData.options || [
              { text: "Option A" },
              { text: "Option B" },
              { text: "Option C" },
              { text: "Option D" }
            ],
            correct_answer: JSON.stringify(questionData.correctAnswer || questionData.correct_answer || 'A'),
            explanation: questionData.explanation || 'No explanation available',
            difficulty_level: questionData.difficulty || 'medium',
            domain_id: 1,
            created_by: userId,
            is_active: true
          })
          .select('id')
          .single();
          
        if (questionError) {
          logger.warn(`Failed to create question ${i + 1}`, { error: questionError.message });
          questionIdMapping[i + 1] = i + 1; // Fallback
        } else {
          questionIdMapping[i + 1] = insertedQuestion.id;
        }
      } catch (error) {
        logger.error(`Exception creating question ${i + 1}`, { error: error.message });
        questionIdMapping[i + 1] = i + 1; // Fallback
      }
    }

    // Create test record
    const testRecord = {
      user_id: userId,
      test_name: testName,
      total_questions: results.totalQuestions,
      questions_order: questions.map((q, idx) => questionIdMapping[idx + 1] || (idx + 1)),
      status: 'submitted',
      started_at: sessionData.created_at,
      submitted_at: submissionTime,
      time_spent_seconds: totalTimeSpent,
      attempted_questions: results.attemptedQuestions,
      unattempted_questions: results.unattemptedQuestions,
      correct_answers: results.correctAnswers,
      wrong_answers: results.wrongAnswers,
      total_marks: results.maxPossibleScore,
      obtained_marks: results.rawScore,
      negative_marks: results.negativeMarks,
      final_score: results.finalScore,
      percentage: results.percentage,
      performance_category: results.performanceCategory,
      domain_scores: results.domainScores,
      meta_data: { practice_set_id: practiceSetId }
    };

    // Delete temporary test record if exists
    if (sessionData.browser_state?.practiceSetId) {
      await supabaseAdmin
        .from('tests')
        .delete()
        .eq('id', sessionData.test_id)
        .eq('user_id', userId);
    }

    const { data: createdTest, error: testError } = await supabaseAdmin
      .from('tests')
      .insert(testRecord)
      .select()
      .single();

    if (testError) {
      logger.error('Failed to create test record', { error: testError.message });
      throw new Error(`Failed to create test record: ${testError.message}`);
    }

    // Create attempt records
    const attempts = [];
    
    for (let index = 0; index < results.detailedResults.length; index++) {
      const result = results.detailedResults[index];
      const actualQuestionId = questionIdMapping[index + 1] || (index + 1);
      
      attempts.push({
        test_id: createdTest.id,
        question_id: actualQuestionId,
        selected_answer: result.userAnswer ? JSON.stringify(result.userAnswer) : null,
        is_correct: result.isCorrect,
        is_partially_correct: false,
        marks_obtained: result.pointsEarned,
        marks_deducted: result.pointsDeducted,
        time_spent_seconds: Math.floor(totalTimeSpent / results.totalQuestions),
        submitted_at: submissionTime
      });
    }

    // Force create attempts if none from detailed results
    if (attempts.length === 0) {
      logger.warn('Creating fallback attempts from raw data');
      
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const practiceSetQuestionId = question.id || (i + 1);
        const actualQuestionId = questionIdMapping[i + 1] || practiceSetQuestionId;
        const userAnswer = userAnswers[practiceSetQuestionId];
        const correctAnswer = question.correctAnswer || question.correct_answer;
        const isCorrect = userAnswer && userAnswer === correctAnswer;
        
        attempts.push({
          test_id: createdTest.id,
          question_id: actualQuestionId,
          selected_answer: userAnswer ? JSON.stringify(userAnswer) : null,
          is_correct: !!isCorrect,
          is_partially_correct: false,
          marks_obtained: isCorrect ? 4 : 0,
          marks_deducted: userAnswer && !isCorrect ? 1 : 0,
          time_spent_seconds: Math.floor(totalTimeSpent / questions.length),
          submitted_at: submissionTime
        });
      }
    }

    // Insert attempts
    const { data: insertedAttempts, error: attemptsError } = await supabaseAdmin
      .from('attempts')
      .upsert(attempts, { onConflict: 'test_id,question_id' })
      .select();

    if (attemptsError) {
      logger.error('Failed to create attempt records', { 
        error: attemptsError.message,
        attemptsCount: attempts.length 
      });
    } else {
      logger.debug('Attempt records created', { count: insertedAttempts?.length || 0 });
    }

    // Mark session as inactive
    await supabaseAdmin
      .from('test_sessions')
      .update({ 
        is_active: false,
        last_activity_at: submissionTime
      })
      .eq('id', sessionData.id);

    const processingTime = Date.now() - startTime;
    
    logger.testEvent('submission_completed', testId, userId, {
      newTestId: createdTest.id,
      correctAnswers: results.correctAnswers,
      totalQuestions: results.totalQuestions,
      percentage: results.percentage,
      processingTimeMs: processingTime
    });

    logger.timeEnd('test-submission');

    return NextResponse.json({
      success: true,
      testId: createdTest.id,
      practiceSetId: practiceSetId,
      testName,
      ...results,
      submissionTime,
      totalTimeSpent
    });

  } catch (error) {
    logger.error('Test submission failed', { 
      error: error.message,
      stack: error.stack 
    });
    
    return NextResponse.json({ 
      error: `Failed to submit test: ${error.message}`,
      details: error.stack 
    }, { status: 500 });
  }
}

function calculateTestResults(questions, userAnswers, submissionTime, totalTimeSpent) {
  logger.debug('Calculating test results', {
    questionsCount: questions.length,
    userAnswersCount: Object.keys(userAnswers).length
  });
  
  const totalQuestions = questions.length;
  let correctAnswers = 0;
  let wrongAnswers = 0;
  let attemptedQuestions = 0;
  let rawScore = 0;
  let negativeMarks = 0;

  // Domain-wise scoring
  const domainScores = {};
  
  // Process each question
  const detailedResults = questions.map((question, index) => {
    const questionId = question.id || (index + 1);
    const userAnswer = userAnswers[questionId];
    const isAttempted = userAnswer !== undefined && userAnswer !== null;
    
    const correctAnswer = question.correctAnswer || question.correct_answer;
    const isCorrect = isAttempted && userAnswer === correctAnswer;
    
    if (isAttempted) {
      attemptedQuestions++;
      
      if (isCorrect) {
        correctAnswers++;
        rawScore += 4;
      } else {
        wrongAnswers++;
        negativeMarks += 1;
      }
    }

    // Domain-wise calculation
    const domainName = question.domain || 'General';
    const domainId = domainName;
    
    if (!domainScores[domainId]) {
      domainScores[domainId] = {
        id: domainId,
        name: domainName,
        code: domainName.substring(0, 3).toUpperCase(),
        totalQuestions: 0,
        attemptedQuestions: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        unattemptedQuestions: 0,
        rawScore: 0,
        negativeMarks: 0,
        finalScore: 0,
        percentage: 0
      };
    }

    domainScores[domainId].totalQuestions++;
    
    if (isAttempted) {
      domainScores[domainId].attemptedQuestions++;
      if (isCorrect) {
        domainScores[domainId].correctAnswers++;
        domainScores[domainId].rawScore += 4;
      } else {
        domainScores[domainId].wrongAnswers++;
        domainScores[domainId].negativeMarks += 1;
      }
    } else {
      domainScores[domainId].unattemptedQuestions++;
    }

    return {
      questionId: questionId,
      questionText: question.text,
      userAnswer: userAnswer,
      correctAnswer: correctAnswer,
      isAttempted,
      isCorrect,
      pointsEarned: isCorrect ? 4 : 0,
      pointsDeducted: isAttempted && !isCorrect ? 1 : 0,
      domain: domainName,
      explanation: question.explanation
    };
  });

  // Calculate domain percentages and final scores
  Object.values(domainScores).forEach(domain => {
    domain.finalScore = domain.rawScore - domain.negativeMarks;
    domain.percentage = domain.totalQuestions > 0 
      ? Math.round((domain.correctAnswers / domain.totalQuestions) * 100 * 100) / 100
      : 0;
  });

  const unattemptedQuestions = totalQuestions - attemptedQuestions;
  const finalScore = rawScore - negativeMarks;
  const maxPossibleScore = totalQuestions * 4;
  const percentage = Math.round((finalScore / maxPossibleScore) * 100 * 100) / 100;
  
  // Determine performance category
  let performanceCategory = 'poor';
  if (percentage >= 90) performanceCategory = 'excellent';
  else if (percentage >= 75) performanceCategory = 'good';
  else if (percentage >= 60) performanceCategory = 'average';
  else if (percentage >= 40) performanceCategory = 'below_average';

  logger.debug('Test results calculated', {
    totalQuestions,
    attemptedQuestions,
    correctAnswers,
    wrongAnswers,
    finalScore,
    percentage,
    performanceCategory
  });

  return {
    totalQuestions,
    attemptedQuestions,
    unattemptedQuestions,
    correctAnswers,
    wrongAnswers,
    rawScore,
    negativeMarks,
    finalScore,
    maxPossibleScore,
    percentage,
    performanceCategory,
    domainScores,
    detailedResults,
    submissionTime,
    totalTimeSpent,
    marksObtained: rawScore,
    unattemptedMarks: unattemptedQuestions * 4,
    negativeMarksDeducted: negativeMarks,
    totalMarksObtained: finalScore
  };
} 