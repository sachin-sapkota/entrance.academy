'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ProtectedRoute from '../../components/ProtectedRoute';
import AdminNavbar from '../../components/AdminNavbar';

export default function AdminSubdomainsPage() {
  const [domains, setDomains] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch domains
      const { data: domainsData, error: domainsError } = await supabase
        .from('domains')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (domainsError) throw domainsError;

      // Fetch categories with question counts
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('question_categories')
        .select(`
          *,
          domains(name, code),
          questions:questions(count)
        `)
        .eq('is_active', true)
        .order('domain_id')
        .order('display_order', { ascending: true });

      if (categoriesError) throw categoriesError;

      setDomains(domainsData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load subdomain data');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionsByCategory = async (categoryId) => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          question_categories(name, code),
          domains(name, code)
        `)
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Failed to load questions');
    }
  };

  const updateQuestion = async (questionId, updates) => {
    try {
      setUpdating(true);
      setError(null);
      
      const { error } = await supabase
        .from('questions')
        .update(updates)
        .eq('id', questionId);

      if (error) throw error;

      // Update local state
      setQuestions(prev => 
        prev.map(q => 
          q.id === questionId 
            ? { ...q, ...updates }
            : q
        )
      );

      setEditingQuestion(null);
    } catch (error) {
      console.error('Error updating question:', error);
      setError('Failed to update question');
    } finally {
      setUpdating(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'very_easy': 'bg-green-100 text-green-800',
      'easy': 'bg-blue-100 text-blue-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'hard': 'bg-orange-100 text-orange-800',
      'very_hard': 'bg-red-100 text-red-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  const formatDifficulty = (difficulty) => {
    return difficulty?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  };

  const filteredCategories = selectedDomain === 'all' 
    ? categories 
    : categories.filter(cat => cat.domain_id === parseInt(selectedDomain));

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar />
        <div className="p-6 max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Question Categories Management</h1>
            <p className="text-gray-600">Manage questions by category and track question distribution across different subject areas</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Domain Filter */}
          <div className="mb-6">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedDomain('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedDomain === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                All Domains
              </button>
              {domains.map(domain => (
                <button
                  key={domain.id}
                  onClick={() => setSelectedDomain(domain.id.toString())}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedDomain === domain.id.toString()
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {domain.name}
                </button>
              ))}
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredCategories.map((category) => {
              const questionCount = category.total_questions || 0;
              const statusColor = questionCount >= 50 
                ? 'bg-green-500' 
                : questionCount >= 20 
                ? 'bg-yellow-500' 
                : 'bg-red-500';

              return (
                <div 
                  key={category.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 cursor-pointer group"
                  onClick={() => {
                    setSelectedCategory(category);
                    fetchQuestionsByCategory(category.id);
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-600 text-sm mb-1">
                        {category.domains?.name || 'Unknown Domain'}
                      </h3>
                      <h4 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                        {category.name}
                      </h4>
                    </div>
                    {category.code && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">
                        {category.code}
                      </span>
                    )}
                  </div>

                  {category.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {category.description}
                    </p>
                  )}

                  {/* Question Count */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${statusColor}`}></div>
                      <span className="text-sm font-medium text-gray-900">
                        {questionCount} Questions
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Weight: {category.weight || 1.0}
                    </div>
                  </div>

                  {/* Category Status */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        questionCount >= 50 
                          ? 'bg-green-100 text-green-700'
                          : questionCount >= 20 
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {questionCount >= 50 ? 'Well Stocked' : questionCount >= 20 ? 'Adequate' : 'Needs Questions'}
                      </span>
                      <span className="text-gray-500">#{category.display_order || 0}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📂</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Categories Found</h3>
              <p className="text-gray-600">
                {selectedDomain === 'all' ? 'No categories are available' : 'No categories found for the selected domain'}
              </p>
            </div>
          )}

          {/* Questions Detail Modal */}
          {selectedCategory && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedCategory.name}
                    </h2>
                    <p className="text-gray-600">{selectedCategory.domains?.name}</p>
                    {selectedCategory.description && (
                      <p className="text-sm text-gray-500 mt-1">{selectedCategory.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setQuestions([]);
                      setEditingQuestion(null);
                      setError(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[70vh]">
                  <div className="mb-6 flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Questions ({questions.length})</h3>
                    <button
                      onClick={() => router.push(`/admin/questions/create?category=${selectedCategory.id}`)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Add Question
                    </button>
                  </div>

                  {questions.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-6xl mb-4">📝</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Questions Yet</h3>
                      <p className="text-gray-600 mb-4">Start by adding questions for this category</p>
                      <button
                        onClick={() => router.push(`/admin/questions/create?category=${selectedCategory.id}`)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Add First Question
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {questions.map((question) => (
                        <div key={question.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-900 font-medium mb-2 break-words">
                                {question.text}
                              </p>
                              <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(question.difficulty_level)}`}>
                                  {formatDifficulty(question.difficulty_level)}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  question.question_type === 'single_choice' ? 'bg-blue-100 text-blue-800' :
                                  question.question_type === 'multiple_choice' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {question.question_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                                <span>Points: {question.points || 1}</span>
                                <span>Attempts: {question.total_attempts || 0}</span>
                                {question.correct_attempts > 0 && (
                                  <span>Accuracy: {((question.correct_attempts / question.total_attempts) * 100).toFixed(1)}%</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingQuestion(question.id);
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                                disabled={updating}
                              >
                                Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/admin/questions?id=${question.id}`);
                                }}
                                className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
                              >
                                View
                              </button>
                            </div>
                          </div>

                          {/* Inline Edit Form */}
                          {editingQuestion === question.id && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Difficulty Level
                                  </label>
                                  <select
                                    defaultValue={question.difficulty_level}
                                    onChange={(e) => updateQuestion(question.id, { difficulty_level: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                                    disabled={updating}
                                  >
                                    <option value="very_easy">Very Easy</option>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                    <option value="very_hard">Very Hard</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Points
                                  </label>
                                  <input
                                    type="number"
                                    min="0.5"
                                    max="10"
                                    step="0.5"
                                    defaultValue={question.points || 1}
                                    onBlur={(e) => updateQuestion(question.id, { points: parseFloat(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                                    disabled={updating}
                                    placeholder="Enter points"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Negative Points
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="5"
                                    step="0.25"
                                    defaultValue={question.negative_points || 0.25}
                                    onBlur={(e) => updateQuestion(question.id, { negative_points: parseFloat(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                                    disabled={updating}
                                    placeholder="Enter negative points"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2 mt-4">
                                <button
                                  onClick={() => setEditingQuestion(null)}
                                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                  disabled={updating}
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => setEditingQuestion(null)}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                  disabled={updating}
                                >
                                  {updating ? 'Saving...' : 'Done'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 