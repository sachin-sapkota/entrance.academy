'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { 
  AlertTriangle, 
  Bug, 
  Send, 
  ArrowLeft,
  CheckCircle,
  User,
  FileText,
  AlertCircle
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ReportIssuePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    email: '',
    issueType: '',
    description: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
    errorMessage: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [error, setError] = useState('');

  const issueTypes = [
    { value: 'bug_report', label: 'Bug Report', color: 'red' },
    { value: 'performance_issue', label: 'Performance Issue', color: 'yellow' },
    { value: 'security_concern', label: 'Security Concern', color: 'purple' },
    { value: 'other', label: 'Other', color: 'gray' }
  ];

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      
      // Pre-fill email if user is logged in
      if (session?.user) {
        setFormData(prev => ({
          ...prev,
          email: session.user.email || ''
        }));
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      
      // Pre-fill email if user logs in
      if (session?.user) {
        setFormData(prev => ({
          ...prev,
          email: session.user.email || ''
        }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      setError('Issue title is required');
      return;
    }

    if (!formData.issueType) {
      setError('Please select an issue type');
      return;
    }

    if (!formData.description.trim()) {
      setError('Issue description is required');
      return;
    }

    // For anonymous users, require email
    if (!user && !formData.email.trim()) {
      setError('Email is required for anonymous reports');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      const requestData = {
        title: formData.title,
        issue_type: formData.issueType,
        description: formData.description,
        page_url: window.location.href
      };

      // Add user ID if authenticated
      if (user) {
        requestData.user_id = user.id;
      } else {
        requestData.email = formData.email;
      }

      // Add optional fields
      if (formData.stepsToReproduce.trim()) {
        requestData.steps_to_reproduce = formData.stepsToReproduce;
      }
      
      if (formData.expectedBehavior.trim()) {
        requestData.expected_behavior = formData.expectedBehavior;
      }
      
      if (formData.actualBehavior.trim()) {
        requestData.actual_behavior = formData.actualBehavior;
      }
      
      if (formData.errorMessage.trim()) {
        requestData.error_message = formData.errorMessage;
      }

      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const data = await response.json();
        setSubmitStatus('success');
        
        // Reset form (but keep user email if logged in)
        setFormData({
          title: '',
          email: user?.email || '',
          issueType: '',
          description: '',
          stepsToReproduce: '',
          expectedBehavior: '',
          actualBehavior: '',
          errorMessage: ''
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit issue report');
      }
    } catch (error) {
      console.error('Error submitting issue report:', error);
      setError('An error occurred while submitting your issue report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </motion.button>
            
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Report an Issue</h1>
                <p className="text-sm text-slate-600">Help us improve by reporting problems</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/help')}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Help Center
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Report a Technical Issue
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Encountered a problem? Help us fix it by providing detailed information about the issue.
            {user && <span className="block mt-2 text-green-600 font-medium">✓ Signed in as {user.email}</span>}
          </p>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm"
        >
          {submitStatus === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3"
            >
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <h4 className="font-semibold text-green-900">Issue Reported Successfully!</h4>
                <p className="text-green-700 text-sm">We've received your report and will investigate promptly.</p>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <h4 className="font-semibold text-red-900">Error</h4>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Issue Title *
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                    placeholder="Brief description of the issue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Your Email *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                    placeholder="For follow-up communication"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                Issue Type *
              </label>
              <div className="grid md:grid-cols-2 gap-4">
                {issueTypes.map((type) => (
                  <label key={type.value} className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="issueType"
                      value={type.value}
                      checked={formData.issueType === type.value}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                      formData.issueType === type.value
                        ? 'border-red-500 bg-red-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <Bug className="w-5 h-5 text-red-500" />
                        <span className="font-semibold text-slate-900">{type.label}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Detailed Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={6}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors resize-none"
                placeholder="Please describe the issue in detail, including what you were trying to do, what happened, and any error messages you saw..."
              />
            </div>

            {/* Additional optional fields for bug reports */}
            {formData.issueType === 'bug_report' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Steps to Reproduce (Optional)
                  </label>
                  <textarea
                    name="stepsToReproduce"
                    value={formData.stepsToReproduce}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors resize-none"
                    placeholder="1. Go to...\n2. Click on...\n3. See the error..."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Expected Behavior (Optional)
                    </label>
                    <textarea
                      name="expectedBehavior"
                      value={formData.expectedBehavior}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors resize-none"
                      placeholder="What should have happened?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Actual Behavior (Optional)
                    </label>
                    <textarea
                      name="actualBehavior"
                      value={formData.actualBehavior}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors resize-none"
                      placeholder="What actually happened?"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Error Message (Optional)
                  </label>
                  <textarea
                    name="errorMessage"
                    value={formData.errorMessage}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors resize-none"
                    placeholder="Copy and paste any error messages you received..."
                  />
                </div>
              </>
            )}

            <div className="flex justify-end">
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Submit Issue Report</span>
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
} 