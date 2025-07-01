'use client';

import { useState, useEffect } from 'react';

export default function TestSessionPage() {
  const [sessionData, setSessionData] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testSessionPersistence = async () => {
    setLoading(true);
    setError(null);
    setTestResults(null);

    try {
      console.log('🧪 Starting session persistence test...');

      // Step 1: Create a test session
      const testSessionData = {
        testId: 'test-exam-123',
        userId: 'test-user-456',
        answers: { 1: 'A', 2: 'B', 3: 'C' },
        currentPage: 2,
        flaggedQuestions: [1, 3],
        timeLeft: 6000,
        startedAt: new Date().toISOString(),
        totalDuration: 7200,
        isActive: true
      };

      console.log('📝 Creating session...');
      const createResponse = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: testSessionData.testId,
          userId: testSessionData.userId,
          action: 'start',
          duration: testSessionData.totalDuration
        })
      });

      const createResult = await createResponse.json();
      console.log('✅ Session created:', createResult);

      if (!createResult.success) {
        throw new Error('Failed to create session: ' + createResult.error);
      }

      // Step 2: Add some answers
      console.log('📤 Adding test answers...');
      for (const [questionId, answer] of Object.entries(testSessionData.answers)) {
        const answerResponse = await fetch('/api/sessions/answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testId: testSessionData.testId,
            userId: testSessionData.userId,
            questionId: parseInt(questionId),
            selectedAnswer: answer,
            currentPage: testSessionData.currentPage,
            flaggedQuestions: testSessionData.flaggedQuestions
          })
        });

        const answerResult = await answerResponse.json();
        if (!answerResult.success) {
          console.warn('⚠️ Failed to save answer:', questionId, answerResult.error);
        }
      }

      // Step 3: Retrieve the session
      console.log('📋 Retrieving session...');
      const retrieveResponse = await fetch(`/api/sessions?testId=${testSessionData.testId}&userId=${testSessionData.userId}`);
      const retrieveResult = await retrieveResponse.json();
      console.log('📥 Session retrieved:', retrieveResult);

      if (!retrieveResult.success) {
        throw new Error('Failed to retrieve session: ' + retrieveResult.error);
      }

      // Step 4: Verify data integrity
      const session = retrieveResult.session;
      const results = {
        sessionCreated: !!createResult.session,
        sessionRetrieved: !!session,
        answersPreserved: Object.keys(session.answers || {}).length === Object.keys(testSessionData.answers).length,
        pagePreserved: session.currentPage === testSessionData.currentPage,
        flaggedPreserved: (session.flaggedQuestions || []).length === testSessionData.flaggedQuestions.length,
        sessionActive: session.isActive,
        timeLeftPreserved: session.timeLeft > 0,
        originalAnswers: testSessionData.answers,
        retrievedAnswers: session.answers,
        originalPage: testSessionData.currentPage,
        retrievedPage: session.currentPage,
        originalFlagged: testSessionData.flaggedQuestions,
        retrievedFlagged: session.flaggedQuestions
      };

      setTestResults(results);
      setSessionData(session);

      // Step 5: Clean up
      console.log('🧹 Cleaning up test session...');
      await fetch('/api/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: testSessionData.testId,
          userId: testSessionData.userId
        })
      });

      console.log('✅ Session persistence test completed!');

    } catch (err) {
      console.error('💥 Test failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testTableStructure = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Checking table structure...');
      const response = await fetch('/api/debug/check-table-structure');
      const result = await response.json();
      console.log('📊 Table structure:', result);
      
      setTestResults({
        tableCheck: true,
        ...result
      });
    } catch (err) {
      console.error('💥 Table check failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Session Persistence Test
          </h1>
          
          <div className="space-y-4 mb-6">
            <button
              onClick={testTableStructure}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check Table Structure'}
            </button>
            
            <button
              onClick={testSessionPersistence}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md disabled:opacity-50 ml-4"
            >
              {loading ? 'Testing...' : 'Test Session Persistence'}
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Error:</strong> {error}
            </div>
          )}

          {testResults && (
            <div className="bg-gray-100 rounded-md p-4">
              <h2 className="text-lg font-semibold mb-4">Test Results</h2>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          )}

          {sessionData && (
            <div className="bg-blue-100 rounded-md p-4 mt-4">
              <h2 className="text-lg font-semibold mb-4">Retrieved Session Data</h2>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(sessionData, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-6 p-4 bg-yellow-50 rounded-md">
            <h3 className="font-semibold text-yellow-800">Instructions:</h3>
            <ol className="list-decimal list-inside text-yellow-700 mt-2 space-y-1">
              <li>First click "Check Table Structure" to verify database compatibility</li>
              <li>Then click "Test Session Persistence" to test the functionality</li>
              <li>If successful, try refreshing this page - the test shows data persists in database</li>
              <li>Check browser console for detailed logs</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
} 