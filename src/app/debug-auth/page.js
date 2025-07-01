'use client';

import { useState, useEffect } from 'react';
import { supabase, authenticatedFetch } from '../../lib/supabase';
import { useSelector } from 'react-redux';

export default function DebugAuthPage() {
  const [authStatus, setAuthStatus] = useState(null);
  const [apiTest, setApiTest] = useState(null);
  const [loading, setLoading] = useState(false);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      // Check current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      setAuthStatus({
        hasSession: !!session,
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email,
          role: session.user.user_metadata?.role
        } : null,
        error: error?.message || null,
        reduxUser: user ? {
          id: user.id,
          email: user.email,
          role: user.profile?.role
        } : null
      });
    } catch (error) {
      setAuthStatus({
        error: error.message,
        hasSession: false
      });
    } finally {
      setLoading(false);
    }
  };

  const testApiCall = async () => {
    setLoading(true);
    try {
      // Test authenticated API call
      const response = await authenticatedFetch('/api/debug/auth-test');
      const result = await response.json();
      
      setApiTest({
        status: response.status,
        success: response.ok,
        data: result
      });
    } catch (error) {
      setApiTest({
        error: error.message,
        success: false
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const email = prompt('Enter email:');
      const password = prompt('Enter password:');
      
      if (!email || !password) return;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        alert('Login failed: ' + error.message);
      } else {
        alert('Login successful!');
        checkAuthStatus();
      }
    } catch (error) {
      alert('Login error: ' + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      alert('Logged out successfully!');
      checkAuthStatus();
    } catch (error) {
      alert('Logout error: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Auth Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
            
            <div className="space-y-4">
              <button
                onClick={checkAuthStatus}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Checking...' : 'Check Auth Status'}
              </button>
              
              {authStatus && (
                <div className="bg-gray-50 p-4 rounded">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(authStatus, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* API Test */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">API Authentication Test</h2>
            
            <div className="space-y-4">
              <button
                onClick={testApiCall}
                disabled={loading}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test API Call'}
              </button>
              
              {apiTest && (
                <div className="bg-gray-50 p-4 rounded">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(apiTest, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Login/Logout */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Auth Actions</h2>
            
            <div className="space-y-4">
              <button
                onClick={handleLogin}
                className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 mr-2"
              >
                Login
              </button>
              
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
            
            <div className="space-y-2">
              <a href="/login" className="block text-blue-600 hover:underline">
                Go to Login Page
              </a>
              <a href="/dashboard" className="block text-blue-600 hover:underline">
                Go to Dashboard
              </a>
              <a href="/quiz" className="block text-blue-600 hover:underline">
                Go to Quiz (will fail if not authenticated)
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 