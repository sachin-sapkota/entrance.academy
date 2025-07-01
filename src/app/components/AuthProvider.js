'use client';

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from '../../lib/supabase';
import { setUser, clearUser, fetchCurrentUser } from '../../store/slices/authSlice';

export default function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('AuthProvider: Initializing auth...');
        
        // Add a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.log('AuthProvider: Timeout reached, forcing initialization');
          dispatch(clearUser());
          setIsInitialized(true);
        }, 10000); // 10 second timeout
        
        // Check for existing session first
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('Session check result:', { 
          hasSession: !!session, 
          userEmail: session?.user?.email,
          error: sessionError 
        });
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          clearTimeout(timeoutId);
          dispatch(clearUser());
          setIsInitialized(true);
          return;
        }
        
        if (session && session.user) {
          // There's an active session, set basic user info immediately
          console.log('Found existing session for user:', session.user.email);
          
          // Set role based on email for admin user to avoid database call during init
          let userRole = session.user.user_metadata?.role || 'free_user';
          
          // For admin users, set role directly to avoid RLS issues during initialization
          if (session.user.email === 'admin@entrance.academy') {
            userRole = 'admin';
            console.log('Setting admin role for admin user');
          }
          
          // Set basic user info immediately to prevent loading
          dispatch(setUser({ 
            user: session.user, 
            profile: { 
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name || session.user.email,
              role: userRole
            }
          }));
          
          clearTimeout(timeoutId);
        } else {
          // No session found, clear user state
          console.log('No existing session found, user needs to log in');
          dispatch(clearUser());
          clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        dispatch(clearUser());
      } finally {
        console.log('AuthProvider: Auth initialization complete');
        setIsInitialized(true);
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session) {
        // User signed in - set user immediately
        console.log('User signed in:', session.user.email);
        dispatch(setUser({ 
          user: session.user, 
          profile: { 
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.email,
            role: session.user.email === 'admin@entrance.academy' ? 'admin' : (session.user.user_metadata?.role || 'free_user')
          }
        }));
      } else if (event === 'SIGNED_OUT') {
        // User signed out
        console.log('User signed out');
        dispatch(clearUser());
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);


  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return children;
} 