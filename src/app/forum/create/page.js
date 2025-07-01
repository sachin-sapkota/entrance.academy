'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { 
  ArrowLeft, 
  Send, 
  MessageSquare, 
  CheckCircle,
  Tag,
  Users,
  BookOpen,
  HelpCircle,
  Lightbulb,
  GraduationCap,
  AlertTriangle
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { authenticatedFetch } from '../../../lib/supabase';

export default function CreateTopicPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    content: '',
    tags: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [error, setError] = useState('');

  const categories = [
    { 
      value: 'general', 
      label: 'General Discussion', 
      icon: MessageSquare, 
      color: 'blue',
      description: 'General platform discussions'
    },
    { 
      value: 'help', 
      label: 'Help & Support', 
      icon: HelpCircle, 
      color: 'orange',
      description: 'Get help from the community'
    },
    { 
      value: 'study', 
      label: 'Study Tips', 
      icon: GraduationCap, 
      color: 'purple',
      description: 'Share study strategies and tips'
    },
    { 
      value: 'suggestions', 
      label: 'Feature Requests', 
      icon: Lightbulb, 
      color: 'yellow',
      description: 'Suggest new features'
    },
    { 
      value: 'technical', 
      label: 'Technical Issues', 
      icon: AlertTriangle, 
      color: 'red',
      description: 'Report bugs and technical problems'
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to create a topic');
      return;
    }

    if (!formData.title.trim() || !formData.content.trim() || !formData.category) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0);

      const response = await authenticatedFetch('/api/forum/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          tags,
          author_id: user.id
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSubmitStatus('success');
        setTimeout(() => {
          router.push(`/forum/${data.topic.id}`);
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create topic');
      }
    } catch (error) {
      console.error('Error creating topic:', error);
      setError('An error occurred while creating the topic');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="flex items-center space-x-1 sm:space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Back</span>
            </motion.button>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-slate-900">Create New Topic</h1>
                <p className="text-sm text-slate-600">Start a new discussion</p>
              </div>
              <div className="block sm:hidden">
                <h1 className="text-base font-bold text-slate-900">New Topic</h1>
              </div>
            </div>

            <div className="w-12 sm:w-20"></div> {/* Spacer for alignment */}
          </div>
        </div>
      </header>

      {/* Mobile Layout */}
      <div className="block lg:hidden">
        <main className="px-3 py-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Mobile Title Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-4"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Start a Discussion
              </h2>
              <p className="text-sm text-slate-600">
                Share thoughts, ask questions, or help others
              </p>
            </motion.section>

            {/* Mobile Form */}
            <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
              {submitStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div>
                    <h4 className="font-semibold text-green-900 text-sm">Success!</h4>
                    <p className="text-green-700 text-xs">Topic created. Redirecting...</p>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2"
                >
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <div>
                    <h4 className="font-semibold text-red-900 text-sm">Error</h4>
                    <p className="text-red-700 text-xs">{error}</p>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Mobile Topic Title */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Topic Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-600 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-sm"
                    placeholder="Enter a descriptive title..."
                  />
                </div>

                {/* Mobile Category Selection */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Category *
                  </label>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <label key={category.value} className="relative cursor-pointer block">
                        <input
                          type="radio"
                          name="category"
                          value={category.value}
                          checked={formData.category === category.value}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className={`p-3 border-2 rounded-lg transition-all duration-200 ${
                          formData.category === category.value
                            ? 'border-green-500 bg-green-50'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}>
                          <div className="flex items-center space-x-3">
                            <div className={`w-6 h-6 bg-gradient-to-br from-${category.color}-500 to-${category.color}-600 rounded-lg flex items-center justify-center flex-shrink-0`}>
                              <category.icon className="w-3 h-3 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 text-sm">{category.label}</h4>
                              <p className="text-slate-600 text-xs">{category.description}</p>
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Mobile Content */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Your Message *
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-600 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors resize-none text-sm"
                    placeholder="Write your message here..."
                  />
                </div>

                {/* Mobile Tags */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Tags (Optional)
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-600 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-sm"
                      placeholder="math, physics, tips..."
                    />
                  </div>
                </div>

                {/* Mobile Guidelines */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center text-sm">
                    <BookOpen className="w-3 h-3 mr-2" />
                    Guidelines
                  </h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• Be respectful and courteous</li>
                    <li>• Use clear, descriptive titles</li>
                    <li>• Stay on topic and be helpful</li>
                  </ul>
                </div>

                {/* Mobile Submit Buttons */}
                <div className="flex flex-col space-y-3 pt-4 border-t border-slate-200">
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Create Topic</span>
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.back()}
                    className="w-full py-3 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Start a New Discussion
            </h2>
            <p className="text-lg text-slate-600">
              Share your thoughts, ask questions, or help others in the community
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
                  <h4 className="font-semibold text-green-900">Topic Created Successfully!</h4>
                  <p className="text-green-700 text-sm">Your discussion topic has been posted. Redirecting...</p>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3"
              >
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <h4 className="font-semibold text-red-900">Error</h4>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Topic Title */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Topic Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-600 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="Enter a descriptive title for your topic..."
                />
                <p className="text-xs text-slate-500 mt-1">
                  Choose a clear, descriptive title that summarizes your topic
                </p>
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3">
                  Category *
                </label>
                <div className="grid md:grid-cols-2 gap-4">
                  {categories.map((category) => (
                    <label key={category.value} className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        value={category.value}
                        checked={formData.category === category.value}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                        formData.category === category.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}>
                        <div className="flex items-start space-x-3">
                          <div className={`w-8 h-8 bg-gradient-to-br from-${category.color}-500 to-${category.color}-600 rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <category.icon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900 text-sm">{category.label}</h4>
                            <p className="text-slate-600 text-xs mt-1">{category.description}</p>
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Topic Content */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Your Message *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  rows={8}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-600 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors resize-none"
                  placeholder="Write your message here... Be clear and detailed to help others understand your topic or question."
                />
                <p className="text-xs text-slate-500 mt-1">
                  Provide details about your topic, question, or discussion point
                </p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Tags (Optional)
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-600 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                    placeholder="e.g., math, physics, study-tips (separate with commas)"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Add relevant tags to help others find your topic (separate multiple tags with commas)
                </p>
              </div>

              {/* Guidelines */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Community Guidelines
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Be respectful and courteous to other community members</li>
                  <li>• Use clear, descriptive titles for your topics</li>
                  <li>• Search existing topics before creating a new one</li>
                  <li>• Stay on topic and provide helpful, constructive content</li>
                  <li>• No spam, advertising, or inappropriate content</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.back()}
                  className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </motion.button>

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Topic...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Create Topic</span>
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>

          {/* Tips Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white"
          >
            <h3 className="text-lg font-bold mb-3 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Tips for Great Discussions
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-green-100">
              <div>
                <h4 className="font-semibold text-white mb-1">For Questions:</h4>
                <ul className="space-y-1">
                  <li>• Describe what you've already tried</li>
                  <li>• Include specific details or examples</li>
                  <li>• Mention your learning goals</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">For Discussions:</h4>
                <ul className="space-y-1">
                  <li>• Share your experiences and insights</li>
                  <li>• Ask engaging questions</li>
                  <li>• Encourage community participation</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
      </div>
    </ProtectedRoute>
  );
} 