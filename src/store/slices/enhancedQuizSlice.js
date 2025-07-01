import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// Enhanced async thunks for advanced quiz operations
export const startEnhancedTest = createAsyncThunk(
  'enhancedQuiz/startTest',
  async ({ domainFilter, userId }, { rejectWithValue }) => {
    try {
      // Create test with questions
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
      
      // Fetch full question details
      const questionIds = data.questions.map(q => q.id).join(',')
      const questionsResponse = await fetch(`/api/questions?domainIds=${domainFilter?.join(',') || ''}&limit=100`)
      
      if (!questionsResponse.ok) {
        throw new Error('Failed to fetch questions')
      }

      const questionsData = await questionsResponse.json()
      const questions = questionsData.questions.filter(q => data.questions.some(tq => tq.id === q.id))

      return {
        test: data.test,
        questions: questions
      }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const submitEnhancedAnswer = createAsyncThunk(
  'enhancedQuiz/submitAnswer',
  async ({ testId, questionId, selectedAnswer, timeSpent, questionOrder, userId }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/tests/${testId}/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          questionId,
          selectedAnswer,
          timeSpent,
          questionOrder
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit answer')
      }

      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const calculateEnhancedScore = createAsyncThunk(
  'enhancedQuiz/calculateScore',
  async ({ testId, userId, timeSpentSeconds }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/tests/${testId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          timeSpentSeconds
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to calculate score')
      }

      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const predictFinalScore = createAsyncThunk(
  'enhancedQuiz/predictFinalScore',
  async ({ testId, currentAttempts, userId }, { rejectWithValue }) => {
    try {
      if (currentAttempts < 10) {
        return null // Not enough data for prediction
      }

      // Simple prediction based on current performance
      // This can be enhanced with a dedicated ML API endpoint later
      const response = await fetch(`/api/tests/${testId}/attempts?userId=${userId}`)
      
      if (!response.ok) {
        throw new Error('Failed to get attempts for prediction')
      }

      const { attempts } = await response.json()
      
      if (attempts.length < 10) return null

      const correctAnswers = attempts.filter(a => a.isCorrect).length
      const currentAccuracy = (correctAnswers / attempts.length) * 100
      const avgTimePerQuestion = attempts.reduce((sum, a) => sum + a.timeSpentSeconds, 0) / attempts.length

      // Simple prediction algorithm
      const predictedScore = Math.min(100, Math.max(0, currentAccuracy))
      const confidence = Math.min(0.95, 0.5 + (currentAttempts / 100) * 0.45)

      return {
        predictedScore: Math.round(predictedScore * 100) / 100,
        confidence: Math.round(confidence * 100) / 100,
        currentAccuracy: Math.round(currentAccuracy * 100) / 100
      }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const initialState = {
  currentTest: null,
  questions: [],
  answers: {},
  timeLeft: 7200,
  isSubmitted: false,
  detailedResults: null,
  currentPage: 1,
  questionsPerPage: 20,
  isLoading: false,
  error: null,
  showExplanations: false,
  flaggedQuestions: [],
  negativeMarkingEnabled: true
}

const enhancedQuizSlice = createSlice({
  name: 'enhancedQuiz',
  initialState,
  reducers: {
    setAnswer: (state, action) => {
      const { questionId, answer } = action.payload
      state.answers[questionId] = answer
    },
    decrementTimer: (state) => {
      if (state.timeLeft > 0 && !state.isSubmitted) {
        state.timeLeft--
      }
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload
    },
    toggleExplanations: (state) => {
      state.showExplanations = !state.showExplanations
    },
    resetQuiz: (state) => {
      Object.assign(state, initialState)
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
    addFlaggedQuestion: (state, action) => {
      const questionId = action.payload
      if (!state.flaggedQuestions.includes(questionId)) {
        state.flaggedQuestions.push(questionId)
      }
    },
    removeFlaggedQuestion: (state, action) => {
      const questionId = action.payload
      const index = state.flaggedQuestions.indexOf(questionId)
      if (index > -1) {
        state.flaggedQuestions.splice(index, 1)
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(startEnhancedTest.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(startEnhancedTest.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentTest = action.payload.test
        state.questions = action.payload.questions
        state.timeLeft = 7200
        state.answers = {}
        state.isSubmitted = false
      })
      .addCase(startEnhancedTest.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(calculateEnhancedScore.pending, (state) => {
        state.isLoading = true
      })
      .addCase(calculateEnhancedScore.fulfilled, (state, action) => {
        state.isLoading = false
        state.isSubmitted = true
        state.detailedResults = action.payload
      })
      .addCase(calculateEnhancedScore.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  },
})

export const {
  setAnswer,
  decrementTimer,
  setCurrentPage,
  toggleExplanations,
  resetQuiz,
  clearError,
  toggleFlaggedQuestion,
  addFlaggedQuestion,
  removeFlaggedQuestion,
} = enhancedQuizSlice.actions

export default enhancedQuizSlice.reducer 