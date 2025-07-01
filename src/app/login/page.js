'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInUser, clearError, setError } from '../../store/slices/authSlice';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Fingerprint } from 'lucide-react';
import { signInWithOAuth, authenticateWithPasskey, isWebAuthnSupported } from '@/lib/auth-service';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasskey, setShowPasskey] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  
  const { isLoading, error, isAuthenticated, profile } = useSelector((state) => state.auth);



  useEffect(() => {
    if (isAuthenticated && profile) {
      if (profile.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, profile, router]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  useEffect(() => {
    // Check if WebAuthn is supported
    const supported = isWebAuthnSupported();
    console.log('🔍 WebAuthn supported:', supported);
    setShowPasskey(supported);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email && password) {
      dispatch(signInUser({ email, password }));
    }
  };

  const handleOAuthSignIn = async (provider) => {
    setLoading(true);
    dispatch(clearError());
    
    try {
      const { data, error } = await signInWithOAuth(provider);
      
      if (error) {
        dispatch(setError(error));
      }
    } catch (error) {
      console.error(`${provider} sign in error:`, error);
      dispatch(setError(`Failed to sign in with ${provider}: ${error.message}`));
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeySignIn = async () => {
    console.log('🎯 Passkey button clicked!'); // Debug log
    setLoading(true);
    dispatch(clearError());
    
    try {
      console.log('🚀 Starting passkey authentication...');
      const result = await authenticateWithPasskey();
      
      console.log('📊 Passkey result:', result);
      
      if (result.success && result.user) {
        if (result.session) {
          // Session created successfully, redirect to dashboard
          console.log('✅ Passkey login successful, redirecting...');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1000);
        } else if (result.requiresRefresh) {
          // Need to refresh the page to complete login
          console.log('🔄 Refreshing page to complete login...');
          window.location.reload();
        } else {
          // Success but no session, redirect anyway
          console.log('✅ Passkey verified, redirecting...');
          router.push('/dashboard');
        }
      } else {
        const errorMessage = result.error || 'Passkey authentication failed';
        console.error('❌ Passkey authentication failed:', errorMessage);
        dispatch(setError(errorMessage));
      }
    } catch (error) {
      console.error('💥 Passkey sign in error:', error);
      dispatch(setError(`Failed to sign in with passkey: ${error.message}`));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-violet-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Entrance Academy
              </h1>
            </motion.div>
            
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Link 
                href="/signup"
                className="text-slate-600 hover:text-blue-600 font-medium transition-colors text-sm sm:text-base"
              >
                <span className="hidden sm:inline">Don't have an account? </span>Sign up
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent"></div>
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute top-1/2 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
      
      <div className="flex items-center justify-center p-6 min-h-[calc(100vh-80px)]">
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-sm w-full relative z-10"
        >
          <div className="bg-white/90 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/30 p-10 relative overflow-hidden">
            {/* Enhanced background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white/30 to-violet-50/50 rounded-3xl"></div>
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-400/10 to-violet-400/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-violet-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
            
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-center mb-10 relative z-10"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl relative shadow-blue-500/20">
                <span className="text-white font-bold text-3xl">E</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-3">
                Welcome back
              </h1>
              <p className="text-slate-600">Sign in to continue your journey</p>
            </motion.div>

            {error && (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-8 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200/60 rounded-2xl relative z-10"
              >
                <p className="text-red-700 text-center font-medium">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors z-10" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white/70 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 placeholder:text-slate-400 text-slate-900 font-medium backdrop-blur-sm shadow-sm hover:shadow-md"
                    placeholder="Enter your email"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors z-10" />
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white/70 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 placeholder:text-slate-400 text-slate-900 font-medium backdrop-blur-sm shadow-sm hover:shadow-md"
                    placeholder="Enter your password"
                  />
                </div>
              </motion.div>

              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                type="submit"
                disabled={isLoading || loading}
                className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-violet-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-xl hover:shadow-blue-500/30 transform hover:-translate-y-1 flex items-center justify-center gap-2 group mt-6"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="relative my-6"
            >
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white/90 text-gray-500">Or continue with</span>
              </div>
            </motion.div>



            {/* Social Sign In */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="space-y-3"
            >
              {/* Google Sign In */}
              <button
                type="button"
                onClick={() => handleOAuthSignIn('google')}
                disabled={loading}
                style={{ zIndex: 10, position: 'relative' }}
                className={`w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/80 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 group ${
                  loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md cursor-pointer'
                }`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-medium text-gray-700 group-hover:text-gray-900">
                  Sign in with Google
                </span>
              </button>



              {/* Passkey Sign In */}
              {showPasskey && (
                <motion.button
                  type="button"
                  onClick={handlePasskeySignIn}
                  onMouseEnter={() => console.log('🖱️ Passkey button hover')}
                  disabled={loading}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ 
                    zIndex: 20, 
                    position: 'relative',
                    pointerEvents: loading ? 'none' : 'auto'
                  }}
                  className={`w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 group ${
                    loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md cursor-pointer'
                  }`}
                >
                  <Fingerprint className="w-5 h-5" />
                  <span className="font-medium">
                    {loading ? 'Authenticating...' : 'Sign in with Passkey'}
                  </span>
                </motion.button>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 