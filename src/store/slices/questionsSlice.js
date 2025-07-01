import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../lib/supabase'

// Async thunks for questions operations
export const fetchQuestions = createAsyncThunk(
  'questions/fetchQuestions',
  async ({ domainFilter = null, limit = null }, { rejectWithValue }) => {
    try {
      // Build query parameters
      const params = new URLSearchParams()
      
      if (domainFilter && domainFilter.length > 0) {
        params.append('domainIds', domainFilter.join(','))
      }
      
      if (limit) {
        params.append('limit', limit.toString())
      }
      
// Shuffling disabled to maintain consistent ID mapping
      
      const response = await fetch(`/api/questions?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch questions')
      }
      
      const data = await response.json()
      return data.questions
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchDomains = createAsyncThunk(
  'questions/fetchDomains',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/domains')
      
      if (!response.ok) {
        throw new Error('Failed to fetch domains')
      }
      
      const data = await response.json()
      return data.domains
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const addQuestion = createAsyncThunk(
  'questions/addQuestion',
  async (questionData, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .insert(questionData)
        .select(`
          *,
          domains (
            id,
            name
          )
        `)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateQuestion = createAsyncThunk(
  'questions/updateQuestion',
  async ({ id, questionData }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .update(questionData)
        .eq('id', id)
        .select(`
          *,
          domains (
            id,
            name
          )
        `)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const deleteQuestion = createAsyncThunk(
  'questions/deleteQuestion',
  async (id, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id)

      if (error) throw error
      return id
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const bulkImportQuestions = createAsyncThunk(
  'questions/bulkImportQuestions',
  async (questionsArray, { rejectWithValue }) => {
    try {
      // Process questions to ensure proper format
      const processedQuestions = await Promise.all(
        questionsArray.map(async (q) => {
          // Find or create domain
          let { data: domain, error } = await supabase
            .from('domains')
            .select('id')
            .eq('name', q.domain)
            .single()

          if (error || !domain) {
            // Create domain if it doesn't exist
            const { data: newDomain, error: createError } = await supabase
              .from('domains')
              .insert({ name: q.domain })
              .select('id')
              .single()

            if (createError) throw createError
            domain = newDomain
          }

          return {
            domain_id: domain.id,
            text: q.text,
            options: q.options,
            correct_answer: q.correctAnswer,
            explanation: q.explanation || null,
          }
        })
      )

      const { data, error } = await supabase
        .from('questions')
        .insert(processedQuestions)
        .select(`
          *,
          domains (
            id,
            name
          )
        `)

      if (error) throw error
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const initialState = {
  questions: [],
  domains: [],
  isLoading: false,
  error: null,
  selectedDomains: [],
}

const questionsSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setSelectedDomains: (state, action) => {
      state.selectedDomains = action.payload
    },
    clearQuestions: (state) => {
      state.questions = []
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Questions
      .addCase(fetchQuestions.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.isLoading = false
        state.questions = action.payload
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Fetch Domains
      .addCase(fetchDomains.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchDomains.fulfilled, (state, action) => {
        state.isLoading = false
        state.domains = action.payload
      })
      .addCase(fetchDomains.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Add Question
      .addCase(addQuestion.fulfilled, (state, action) => {
        state.questions.push(action.payload)
      })
      // Update Question
      .addCase(updateQuestion.fulfilled, (state, action) => {
        const index = state.questions.findIndex(q => q.id === action.payload.id)
        if (index !== -1) {
          state.questions[index] = action.payload
        }
      })
      // Delete Question
      .addCase(deleteQuestion.fulfilled, (state, action) => {
        state.questions = state.questions.filter(q => q.id !== action.payload)
      })
      // Bulk Import Questions
      .addCase(bulkImportQuestions.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(bulkImportQuestions.fulfilled, (state, action) => {
        state.isLoading = false
        state.questions = [...state.questions, ...action.payload]
      })
      .addCase(bulkImportQuestions.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  },
})

export const { clearError, setSelectedDomains, clearQuestions } = questionsSlice.actions
export default questionsSlice.reducer 