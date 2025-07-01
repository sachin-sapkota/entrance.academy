import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../lib/supabase'

// Async thunks for quiz operations
export const startTest = createAsyncThunk(
  'quiz/startTest',
  async ({ domainFilter, userId, testId, duration }, { rejectWithValue }) => {
    try {
      // If testId and duration are provided, this is a simple timer start
      if (testId && duration !== undefined) {
        return {
          id: testId,
          duration,
          name: 'Practice Test'
        }
      }

      // Use the new API route to create test
      const response = await fetch('/api/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          domainFilter,
          testName: 'MCQ Practice Test',
          testType: 'practice',
          totalQuestions: 100,
          durationMinutes: 120
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start test')
      }

      const data = await response.json()
      return data.test
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const submitTest = createAsyncThunk(
  'quiz/submitTest',
  async ({ testId, answers, timeSpent, userId }, { rejectWithValue }) => {
    try {
      // Submit answers via API
      const submitPromises = Object.entries(answers).map(([questionId, selectedAnswer]) => 
        fetch(`/api/tests/${testId}/attempts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            questionId: parseInt(questionId),
            selectedAnswer,
            timeSpent: timeSpent[questionId] || 0
          })
        })
      )

      await Promise.all(submitPromises)

      // Calculate final score
      const totalTimeSpent = Object.values(timeSpent).reduce((sum, time) => sum + time, 0)
      
      const scoreResponse = await fetch(`/api/tests/${testId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          timeSpentSeconds: totalTimeSpent
        })
      })

      if (!scoreResponse.ok) {
        throw new Error('Failed to submit test')
      }

      return await scoreResponse.json()
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const calculateScore = createAsyncThunk(
  'quiz/calculateScore',
  async ({ testId, userId }, { rejectWithValue }) => {
    try {
      // Use the submit API route which handles scoring
      const response = await fetch(`/api/tests/${testId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          timeSpentSeconds: 0 // Default if not provided
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to calculate score')
      }

      const data = await response.json()
      
      return {
        totalCorrect: data.correctAnswers,
        totalQuestions: data.totalQuestions,
        scoreByDomain: data.domainScores,
        attempts: data.attempts,
        finalScore: data.finalScore,
        percentage: data.percentage
      }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const initialState = {
  currentTest: null,
  answers: {},
  timeSpent: {},
  timeLeft: 7200, // 2 hours in seconds
  isSubmitted: false,
  isLoading: false,
  error: null,
  results: null,
  currentPage: 1,
  questionsPerPage: 20,
  flaggedQuestions: [], // Array of flagged question IDs
}

const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    setAnswer: (state, action) => {
      const { questionId, answer } = action.payload
      state.answers[questionId] = answer
    },
    setTimeSpent: (state, action) => {
      const { questionId, time } = action.payload
      state.timeSpent[questionId] = time
    },
    decrementTimer: (state) => {
      if (state.timeLeft > 0) {
        state.timeLeft--
      }
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload
    },
    resetQuiz: (state) => {
      state.currentTest = null
      state.answers = {}
      state.timeSpent = {}
      state.timeLeft = 7200
      state.isSubmitted = false
      state.results = null
      state.currentPage = 1
      state.flaggedQuestions = []
    },
    clearError: (state) => {
      state.error = null
    },
    toggleFlaggedQuestion: (state, action) => {
      const questionId = action.payload
      const index = state.flaggedQuestions.indexOf(questionId)
      if (index > -1) {
        state.flaggedQuestions.splice(index, 1)
      } else {
        state.flaggedQuestions.push(questionId)
      }
    },
    restoreSession: (state, action) => {
      const { answers, currentPage, flaggedQuestions, timeLeft, testId } = action.payload
      
      console.log('🔄 Redux restoreSession called with:', {
        answersCount: Object.keys(answers || {}).length,
        sampleAnswers: Object.entries(answers || {}).slice(0, 3),
        currentPage,
        flaggedCount: (flaggedQuestions || []).length,
        timeLeft,
        testId
      });
      
      // Directly set the answers without complex normalization
      state.answers = answers || {}
      state.currentPage = currentPage || 1
      state.flaggedQuestions = flaggedQuestions || []
      state.timeLeft = timeLeft || 7200
      state.currentTest = { id: testId, name: 'Practice Test' }
      state.isSubmitted = false
      
      console.log('🔄 Redux state after restoreSession:', {
        answersCount: Object.keys(state.answers).length,
        sampleAnswers: Object.entries(state.answers).slice(0, 3),
        currentPage: state.currentPage,
        flaggedCount: state.flaggedQuestions.length
      });
    },
    setTimer: (state, action) => {
      state.timeLeft = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Start Test
      .addCase(startTest.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(startTest.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentTest = action.payload
        // Only reset if this is a new test (not a session restoration)
        if (!action.meta.arg.testId) {
          state.answers = {}
          state.timeSpent = {}
          state.flaggedQuestions = []
          state.currentPage = 1
        }
        // Set timer duration
        state.timeLeft = action.meta.arg.duration || action.payload.duration || 7200
        state.isSubmitted = false
      })
      .addCase(startTest.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Submit Test
      .addCase(submitTest.pending, (state) => {
        state.isLoading = true
      })
      .addCase(submitTest.fulfilled, (state) => {
        state.isLoading = false
        state.isSubmitted = true
      })
      .addCase(submitTest.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Calculate Score
      .addCase(calculateScore.pending, (state) => {
        state.isLoading = true
      })
      .addCase(calculateScore.fulfilled, (state, action) => {
        state.isLoading = false
        state.results = action.payload
      })
      .addCase(calculateScore.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  },
})

export const {
  setAnswer,
  setTimeSpent,
  decrementTimer,
  setCurrentPage,
  resetQuiz,
  clearError,
  toggleFlaggedQuestion,
  restoreSession,
  setTimer,
} = quizSlice.actions

export default quizSlice.reducer 