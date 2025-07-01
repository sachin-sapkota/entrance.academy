'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import ProtectedRoute from '../components/ProtectedRoute';
import SolutionsView from '../components/SolutionsView';
import { makeAuthenticatedRequest } from '../../lib/api-client';

export default function SolutionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const testId = searchParams.get('testId');
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [practiceSetInfo, setPracticeSetInfo] = useState(null);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  // Get results from Redux if available
  const reduxResults = useSelector(state => state.quiz);
  // Get user from Redux auth state
  const user = useSelector(state => state.auth.user);

  useEffect(() => {
    const fetchResults = async () => {
      if (!testId) {
        console.log('No testId provided, checking Redux state...');
        if (reduxResults && Object.keys(reduxResults).length > 0) {
          console.log('Using results from Redux state:', reduxResults);
          setResults(reduxResults);
        } else {
          console.log('No results found, redirecting to dashboard');
          setError('No test ID provided and no Redux results available');
          // Don't redirect immediately, let user see the error
        }
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Fetching solution data for testId:', testId);
        
        // First, get debug information
        const debugResponse = await makeAuthenticatedRequest(`/api/debug/solution-debug?testId=${testId}`);
        if (debugResponse.ok) {
          const debugData = await debugResponse.json();
          setDebugInfo(debugData.debug);
          console.log('🐛 Debug info:', debugData.debug);
        }

        // Fetch test info with attempts and questions using authenticated request
        const testResponse = await makeAuthenticatedRequest(`/api/tests/${testId}`);
        
        if (!testResponse.ok) {
          const errorText = await testResponse.text();
          throw new Error(`Failed to fetch test data: ${testResponse.status} ${errorText}`);
        }
        
        const testData = await testResponse.json();
        console.log('📋 Raw test response:', testData);
        
        if (testData.success && testData.test) {
          console.log('✅ Test data fetched successfully:', {
            testId: testData.test.id,
            attemptsCount: testData.attempts?.length || 0,
            hasQuestionData: testData.attempts?.some(a => a.question) || false,
            attemptsWithQuestions: testData.attempts?.filter(a => a.question).length || 0,
            sampleAttempt: testData.attempts?.[0] ? {
              questionId: testData.attempts[0].question_id,
              hasQuestion: !!testData.attempts[0].question,
              selectedAnswer: testData.attempts[0].selected_answer,
              isCorrect: testData.attempts[0].is_correct
            } : null
          });
          
          // Set the practice set info
          setPracticeSetInfo(testData.test);
          
          // Set results with the test data and attempts
          setResults({
            ...testData.test,
            attempts: testData.attempts || []
          });
        } else {
          console.error('❌ Test not found or invalid response:', testData);
          setError(`Test not found: ${testData.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('💥 Error fetching results:', error);
        setError(`Failed to fetch test data: ${error.message}`);
        
        // If fetching fails, try to use stored results from localStorage
        const storedResults = localStorage.getItem(`testResults_${testId}`);
        if (storedResults) {
          console.log('📦 Using stored results from localStorage');
          try {
            const parsedResults = JSON.parse(storedResults);
            setResults(parsedResults);
            setPracticeSetInfo(parsedResults);
            setError(null); // Clear error if we found stored results
          } catch (parseError) {
            console.error('Failed to parse stored results:', parseError);
          }
        } else if (reduxResults && Object.keys(reduxResults).length > 0) {
          // Fallback to Redux state
          console.log('🔄 Using results from Redux state:', reduxResults);
          setResults(reduxResults);
          setError(null); // Clear error if we found Redux results
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [testId, reduxResults, router]);

  const handleBack = () => {
    if (testId) {
      router.push(`/results?testId=${testId}`);
    } else {
      router.push('/results');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Loading solutions...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Show error state with debug information
  if (error && !results) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
          <div className="text-center max-w-2xl">
            <div className="bg-red-100 border border-red-300 rounded-lg p-6 mb-6">
              <h1 className="text-2xl font-bold text-red-900 mb-2">Unable to Load Solutions</h1>
              <p className="text-red-700 mb-4">{error}</p>
              
              {debugInfo && (
                <details className="text-left bg-white rounded p-4 mt-4">
                  <summary className="font-semibold cursor-pointer">Debug Information</summary>
                  <pre className="text-xs mt-2 overflow-auto">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </details>
              )}
            </div>
            
            <div className="space-y-4">
              <button
                onClick={handleBack}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 mr-4"
              >
                Back to Results
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SolutionsView 
        results={results} 
        onBack={handleBack} 
        practiceSetInfo={practiceSetInfo} 
      />
    </ProtectedRoute>
  );
} 