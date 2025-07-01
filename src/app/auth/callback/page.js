'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setUser, refreshUserProfile } from '@/store/slices/authSlice';
import { supabase } from '@/lib/supabase';
import { checkPhoneVerification } from '@/lib/auth-service';
import { motion } from 'framer-motion';

export default function AuthCallbackPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get session from URL hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (!session) {
          throw new Error('No session found');
        }

        // Get or create user profile
        let userProfile;
        
        const { data: existingProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code === 'PGRST116') {
          // User profile doesn't exist, create it
          console.log('Creating new user profile for OAuth user:', {
            userId: session.user.id,
            email: session.user.email,
            provider: session.user.app_metadata?.provider,
            userData: session.user.user_metadata
          });

          // Extract comprehensive user data from Google OAuth
          const userData = session.user.user_metadata || {};
          const isGoogleAuth = session.user.app_metadata?.provider === 'google';
          
          const newProfile = {
            id: session.user.id,
            email: session.user.email,
            full_name: userData.full_name || userData.name || session.user.email?.split('@')[0],
            role: session.user.email === 'admin@entrance.academy' ? 'admin' : 'free_user',
            auth_provider: session.user.app_metadata?.provider || 'google',
            phone_verified: false,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            
            // Google-specific data
            ...(isGoogleAuth && {
              profile_image_url: userData.avatar_url || userData.picture,
              google_id: userData.provider_id || userData.sub,
              bio: userData.bio || null,
              // Store additional Google data in meta_data
              meta_data: {
                google_data: {
                  given_name: userData.given_name,
                  family_name: userData.family_name,
                  locale: userData.locale,
                  verified_email: userData.email_verified,
                  picture_url: userData.picture,
                  provider_id: userData.provider_id,
                  last_sign_in_at: userData.last_sign_in_at
                }
              }
            })
          };

          const { data: createdProfile, error: createError } = await supabase
            .from('users')
            .insert(newProfile)
            .select()
            .single();

          if (createError) {
            console.error('Failed to create user profile:', createError);
            // Continue with basic profile if creation fails
            userProfile = newProfile;
          } else {
            userProfile = createdProfile;
          }
        } else if (profileError) {
          // Use basic profile if fetch fails
          userProfile = {
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            role: 'free_user',
            phone_verified: false
          };
        } else {
          // User profile exists, update with latest Google data if it's a Google auth
          userProfile = existingProfile;
          
          const userData = session.user.user_metadata || {};
          const isGoogleAuth = session.user.app_metadata?.provider === 'google';
          
                      if (isGoogleAuth && userData) {
            
            const updatedData = {
              updated_at: new Date().toISOString(),
              ...(userData.full_name || userData.name) && { 
                full_name: userData.full_name || userData.name 
              },
              ...(userData.avatar_url || userData.picture) && { 
                profile_image_url: userData.avatar_url || userData.picture 
              },
              // Update meta_data with latest Google info
              meta_data: {
                ...existingProfile.meta_data,
                google_data: {
                  given_name: userData.given_name,
                  family_name: userData.family_name,
                  locale: userData.locale,
                  verified_email: userData.email_verified,
                  picture_url: userData.picture,
                  provider_id: userData.provider_id,
                  last_sign_in_at: new Date().toISOString()
                }
              }
            };

            const { data: updatedProfile, error: updateError } = await supabase
              .from('users')
              .update(updatedData)
              .eq('id', session.user.id)
              .select()
              .single();

            if (updateError) {
              console.warn('Failed to update profile with Google data:', updateError);
            } else {
              userProfile = updatedProfile;
            }
          }
        }

        // Update store with user data
        dispatch(setUser({
          user: session.user,
          profile: userProfile
        }));

        // Check if phone verification is required
        // const { required, error: phoneCheckError } = await checkPhoneVerification(session.user.id);
        
        // if (phoneCheckError) {
        //   console.warn('Phone verification check failed:', phoneCheckError);
        // }
        
        // if (required) {
        //   router.push('/phone-verify');
        // } else {
          // Determine redirect based on role
          if (userProfile?.role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/dashboard');
          }
        // }
      } catch (error) {
        console.error('Auth callback error:', error);
        setError(error.message);
        // Redirect to login after showing error
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [router, dispatch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8 max-w-md w-full"
      >
        {loading ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl animate-pulse">
              <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Completing sign in...</h2>
            <p className="text-gray-600">Please wait while we set up your account</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Success!</h2>
            <p className="text-gray-600">Redirecting to your dashboard...</p>
          </div>
        )}
      </motion.div>
    </div>
  );
} 