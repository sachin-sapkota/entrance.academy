'use client';

import { useState } from 'react';

export default function DebugSessionPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const testSessionPersistence = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log('🧪 Testing session persistence...');
      
      // Step 1: Create a test session
      const testData = {
        testId: 'debug-test-' + Date.now(),
        answers: {
          'temp_1751174425453_16': 'B',
          'temp_1751174425453_17': 'A', 
          'temp_1751174425453_18': 'C'
        },
        flaggedQuestions: [2],
        currentPage: 1,
        timeLeft: 7200
      };

      console.log('📝 Step 1: Creating session...');
      const createResponse = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: testData.testId,
          action: 'start',
          duration: 7200
        })
      });

      const createResult = await createResponse.json();
      console.log('📋 Create session result:', createResult);

      if (!createResult.success) {
        throw new Error('Failed to create session: ' + createResult.error);
      }

      // Step 2: Save some answers
      console.log('📝 Step 2: Saving answers...');
      for (const [questionId, answer] of Object.entries(testData.answers)) {
        const answerResponse = await fetch('/api/sessions/answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testId: testData.testId,
            questionId: questionId,
            selectedAnswer: answer,
            flaggedQuestions: testData.flaggedQuestions
          })
        });

        const answerResult = await answerResponse.json();
        if (!answerResult.success) {
          console.warn('⚠️ Failed to save answer:', questionId, answerResult.error);
        }
      }

      // Step 3: Retrieve the session
      console.log('📝 Step 3: Retrieving session...');
      const retrieveResponse = await fetch(`/api/sessions?testId=${testData.testId}`);
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
        answersPreserved: Object.keys(session.answers || {}).length === Object.keys(testData.answers).length,
        flaggedPreserved: (session.flaggedQuestions || []).length === testData.flaggedQuestions.length,
        sessionActive: session.isActive,
        timeLeftPreserved: session.timeLeft > 0,
        originalAnswers: testData.answers,
        retrievedAnswers: session.answers,
        originalFlagged: testData.flaggedQuestions,
        retrievedFlagged: session.flaggedQuestions,
        sessionDetails: {
          id: session.id,
          testId: session.testId,
          timeLeft: session.timeLeft,
          currentPage: session.currentPage
        },
        // Check answer key formats
        answerKeyFormats: {
          original: Object.keys(testData.answers).map(k => ({ key: k, type: typeof k })),
          retrieved: Object.keys(session.answers || {}).map(k => ({ key: k, type: typeof k }))
        }
      };

      setResults(results);

      // Step 5: Clean up
      console.log('📝 Step 5: Cleaning up...');
      await fetch('/api/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: testData.testId
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Session Persistence Debug</h1>
          
          <div className="space-y-4">
            <button
              onClick={testSessionPersistence}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Session Persistence'}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-semibold">Error</h3>
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {results && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-gray-800 font-semibold mb-4">Test Results</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className={`p-3 rounded ${results.sessionCreated ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                    <span className="font-medium">Session Created: </span>
                    <span className={results.sessionCreated ? 'text-green-600' : 'text-red-600'}>
                      {results.sessionCreated ? '✅ Pass' : '❌ Fail'}
                    </span>
                  </div>
                  
                  <div className={`p-3 rounded ${results.sessionRetrieved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                    <span className="font-medium">Session Retrieved: </span>
                    <span className={results.sessionRetrieved ? 'text-green-600' : 'text-red-600'}>
                      {results.sessionRetrieved ? '✅ Pass' : '❌ Fail'}
                    </span>
                  </div>
                  
                  <div className={`p-3 rounded ${results.answersPreserved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                    <span className="font-medium">Answers Preserved: </span>
                    <span className={results.answersPreserved ? 'text-green-600' : 'text-red-600'}>
                      {results.answersPreserved ? '✅ Pass' : '❌ Fail'}
                    </span>
                  </div>
                  
                  <div className={`p-3 rounded ${results.flaggedPreserved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                    <span className="font-medium">Flagged Preserved: </span>
                    <span className={results.flaggedPreserved ? 'text-green-600' : 'text-red-600'}>
                      {results.flaggedPreserved ? '✅ Pass' : '❌ Fail'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gray-100 p-3 rounded">
                    <h4 className="font-medium mb-2">Original Answers:</h4>
                    <pre className="text-sm text-gray-600">{JSON.stringify(results.originalAnswers, null, 2)}</pre>
                  </div>
                  
                  <div className="bg-gray-100 p-3 rounded">
                    <h4 className="font-medium mb-2">Retrieved Answers:</h4>
                    <pre className="text-sm text-gray-600">{JSON.stringify(results.retrievedAnswers, null, 2)}</pre>
                  </div>

                  <div className="bg-gray-100 p-3 rounded">
                    <h4 className="font-medium mb-2">Answer Key Formats:</h4>
                    <pre className="text-sm text-gray-600">{JSON.stringify(results.answerKeyFormats, null, 2)}</pre>
                  </div>

                  <div className="bg-gray-100 p-3 rounded">
                    <h4 className="font-medium mb-2">Session Details:</h4>
                    <pre className="text-sm text-gray-600">{JSON.stringify(results.sessionDetails, null, 2)}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 