import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase, signUp, signIn, signOut, getCurrentUser } from '../../lib/supabase'

// Helper function to safely log Supabase errors
const logSupabaseError = (context, error) => {
  // Don't log empty objects or null/undefined errors
  if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
    console.log(`${context}: No error details available`);
    return { message: 'No error details' };
  }
  
  console.error(`${context}:`, error);
  
  if (error && typeof error === 'object') {
    const errorDetails = {
      message: error.message || 'Unknown error',
      code: error.code || 'NO_CODE',
      details: error.details || 'No details',
      hint: error.hint || 'No hint',
      statusCode: error.statusCode || 'NO_STATUS'
    };
    console.error(`${context} details:`, errorDetails);
    return errorDetails;
  }
  
  return { message: String(error) };
};

// Helper function to create user profile with fallback
const createUserProfile = async (user) => {
  try {
    const profileData = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      role: user.user_metadata?.role || 'free_user',
      is_active: true
    };

    console.log('Creating user profile with data:', profileData);

    const { data: newProfile, error: createError } = await supabase
      .from('users')
      .insert([profileData])
      .select()
      .single();
    
    if (createError) {
      logSupabaseError('Error creating user profile', createError);
      return null;
    }
    
    console.log('User profile created successfully:', newProfile);
    return newProfile;
  } catch (error) {
    logSupabaseError('Failed to create user profile', error);
    return null;
  }
};

// Helper function to create a basic profile without database calls
const createBasicProfile = (user) => {
  return {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    role: user.email === 'admin@entrance.academy' ? 'admin' : (user.user_metadata?.role || 'free_user'),
    profile_image_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

// Helper function to fetch user profile with fallback creation
const fetchOrCreateUserProfile = async (user) => {
  try {
    // Create a basic profile without database calls to avoid RLS issues
    // The database trigger will handle creating the actual profile record
    const basicProfile = createBasicProfile(user);
    console.log('Created basic profile for:', user.email, 'with role:', basicProfile.role);
    return basicProfile;
    
  } catch (error) {
    console.log('Error in fetchOrCreateUserProfile, using basic profile:', error.message);
    // Always return a basic profile as fallback
    return createBasicProfile(user);
  }
};

// Async thunks for authentication
export const signUpUser = createAsyncThunk(
  'auth/signUpUser',
  async ({ email, password, fullName, phone }, { rejectWithValue }) => {
    try {
      // Include user metadata that will be picked up by the database trigger
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email?.split('@')[0] || 'User',
            phone: phone || '',
            role: 'free_user'
          }
        }
      })
      
      if (error) {
        logSupabaseError('Sign up error', error);
        throw error;
      }
      
      console.log('User signed up successfully:', data);
      
      // The database trigger should automatically create the user profile
      // Let's wait a bit and then try to fetch it
      if (data.user && data.user.email_confirmed_at) {
        // User is already confirmed, try to get profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        const profile = await fetchOrCreateUserProfile(data.user);
        return { ...data, profile };
      }
      
      // User needs to confirm email first
      return data;
      
    } catch (error) {
      const errorDetails = logSupabaseError('Sign up failed', error);
      return rejectWithValue(errorDetails.message);
    }
  }
)

export const signInUser = createAsyncThunk(
  'auth/signInUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data, error } = await signIn(email, password)
      if (error) {
        logSupabaseError('Sign in error', error);
        throw error;
      }
      
      console.log('User signed in successfully:', data);
      
      // Fetch or create user profile
      const profile = await fetchOrCreateUserProfile(data.user);
      
      return { user: data.user, profile };
      
    } catch (error) {
      const errorDetails = logSupabaseError('Sign in failed', error);
      return rejectWithValue(errorDetails.message);
    }
  }
)

export const signOutUser = createAsyncThunk(
  'auth/signOutUser',
  async (_, { rejectWithValue }) => {
    try {
      const { error } = await signOut()
      if (error) {
        logSupabaseError('Sign out error', error);
        throw error;
      }
      console.log('User signed out successfully');
      return true;
    } catch (error) {
      const errorDetails = logSupabaseError('Sign out failed', error);
      return rejectWithValue(errorDetails.message);
    }
  }
)

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      console.log('fetchCurrentUser: Starting...');
      
      const { user, error } = await getCurrentUser();
      
      if (error || !user) {
        console.log('No authenticated user found');
        return null;
      }
      
      console.log('Current user found:', user.email);
      
      // Try to fetch complete profile from database first
      try {
        const { data: dbProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (!profileError && dbProfile) {
          console.log('fetchCurrentUser: Database profile found with image:', !!dbProfile.profile_image_url);
          return { user, profile: dbProfile };
        }
      } catch (profileError) {
        console.log('fetchCurrentUser: Could not fetch database profile, using basic profile');
      }
      
      // Fallback to basic profile
      const profile = createBasicProfile(user);
      
      console.log('fetchCurrentUser: Profile created:', { email: profile.email, role: profile.role });
      
      return { user, profile };
      
    } catch (error) {
      console.log('fetchCurrentUser: Caught error:', error.message);
      return null;
    }
  }
)

// Add a new thunk to refresh user profile
export const refreshUserProfile = createAsyncThunk(
  'auth/refreshUserProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const userId = auth.user?.id;
      
      if (!userId) {
        return rejectWithValue('No user ID available');
      }
      
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        throw error;
      }
      
      return profile;
    } catch (error) {
      console.error('Error refreshing profile:', error);
      return rejectWithValue(error.message);
    }
  }
)

const initialState = {
  user: null,
  profile: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setError: (state, action) => {
      state.error = action.payload
    },
    setUser: (state, action) => {
      state.user = action.payload.user
      state.profile = action.payload.profile
      state.isAuthenticated = !!action.payload.user
      state.isLoading = false
      state.error = null
      
      // Store auth state in localStorage as backup
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_backup', JSON.stringify({
          user: action.payload.user,
          profile: action.payload.profile,
          isAuthenticated: !!action.payload.user
        }));
      }
    },
    updateProfile: (state, action) => {
      state.profile = { ...state.profile, ...action.payload };
    },
    clearUser: (state) => {
      state.user = null
      state.profile = null
      state.isAuthenticated = false
      state.isLoading = false
      state.error = null
      
      // Clear auth backup from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_backup');
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Sign Up
      .addCase(signUpUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(signUpUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.profile = action.payload.profile || null
        state.isAuthenticated = !!action.payload.user
        
        if (action.payload.user && !action.payload.profile) {
          console.log('User signed up but profile will be created after email confirmation');
        }
      })
      .addCase(signUpUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Sign In
      .addCase(signInUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(signInUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.profile = action.payload.profile || null
        state.isAuthenticated = true
        
        if (!action.payload.profile) {
          console.log('User signed in but no profile available');
        }
      })
      .addCase(signInUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Sign Out
      .addCase(signOutUser.pending, (state) => {
        state.isLoading = true
      })
      .addCase(signOutUser.fulfilled, (state) => {
        state.isLoading = false
        state.user = null
        state.profile = null
        state.isAuthenticated = false
      })
      .addCase(signOutUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Fetch Current User
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false
        if (action.payload) {
          state.user = action.payload.user
          state.profile = action.payload.profile || null
          state.isAuthenticated = true
          
          if (!action.payload.profile) {
            console.log('User authenticated but no profile available');
          }
        } else {
          state.user = null
          state.profile = null
          state.isAuthenticated = false
        }
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Refresh Profile
      .addCase(refreshUserProfile.fulfilled, (state, action) => {
        if (action.payload) {
          state.profile = action.payload;
        }
      })
  },
})

export const { clearError, setError, setUser, clearUser, updateProfile } = authSlice.actions
export default authSlice.reducer 