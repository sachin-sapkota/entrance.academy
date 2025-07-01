import { configureStore } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import quizSlice from './slices/quizSlice'
import questionsSlice from './slices/questionsSlice'
import enhancedQuizSlice from './slices/enhancedQuizSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    quiz: quizSlice,
    questions: questionsSlice,
    enhancedQuiz: enhancedQuizSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
}) 