'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isLoading, profile, user } = useSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    // Add a small delay to prevent immediate redirects on page refresh
    const timer = setTimeout(() => {
      if (!isLoading) {
        if (!isAuthenticated) {
          console.log('ProtectedRoute: Not authenticated, redirecting to login');
          router.push('/login');
          return;
        }

        if (adminOnly && profile?.role !== 'admin') {
          // Non-admin users trying to access admin routes should be redirected to user dashboard
          console.log('ProtectedRoute: Non-admin user, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }
      }
    }, 100); // Small delay to allow auth state to settle

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, profile, adminOnly, router]);

  // Show loading only if we're actually loading and have no user data yet
  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // If we have a user but no profile yet, and we're not loading, still allow access
  // This prevents infinite loading when profile creation is delayed
  if (!isAuthenticated && !isLoading) {
    return null;
  }

  if (adminOnly && profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Unauthorized Access</h1>
          <p className="text-slate-600 mb-6">You don't have permission to access this admin area. Only administrators can view this content.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return children;
} 