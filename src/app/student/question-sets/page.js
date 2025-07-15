'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import {
  Play,
  Clock,
  Target,
  BarChart3,
  Users,
  CheckCircle,
  Star,
  Calendar,
  BookOpen,
  Award,
  TrendingUp,
  Filter,
  Search
} from 'lucide-react';

export default function StudentQuestionSetsPage() {
  const [questionSets, setQuestionSets] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchQuestionSets(),
        fetchUserStats()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionSets = async () => {
    const { data, error } = await supabase
      .from('generated_question_sets')
      .select(`
        *,
        template:question_set_templates(name, type, description)
      `)
      .eq('is_published', true)
      .order('generated_at', { ascending: false });

    if (error) throw error;
    setQuestionSets(data || []);
  };

  const fetchUserStats = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('user_performance_analytics')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;
    
    // Calculate overall stats
    const stats = {
      totalTests: 0,
      averageScore: 0,
      bestScore: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      domains: data || []
    };

    data?.forEach(domain => {
      stats.totalTests += domain.completed_tests || 0;
      stats.totalQuestions += domain.total_questions_attempted || 0;
      stats.correctAnswers += domain.total_questions_correct || 0;
      if (domain.best_score > stats.bestScore) {
        stats.bestScore = domain.best_score;
      }
    });

    if (stats.totalQuestions > 0) {
      stats.averageScore = (stats.correctAnswers / stats.totalQuestions * 100).toFixed(1);
    }

    setUserStats(stats);
  };

  const getSetTypeInfo = (type) => {
    const typeMap = {
      'full_mock_practice': {
        icon: <Award className="w-5 h-5" />,
        color: 'bg-red-500',
        label: 'Full Mock Test',
        description: 'Complete curriculum practice'
      },
      'weekly_full_practice': {
        icon: <Calendar className="w-5 h-5" />,
        color: 'bg-blue-500',
        label: 'Weekly Practice',
        description: 'Balanced weekly review'
      },
      'weekly_domain_practice': {
        icon: <Target className="w-5 h-5" />,
        color: 'bg-green-500',
        label: 'Domain Focus',
        description: 'Targeted domain practice'
      },
      'daily_mixed_practice': {
        icon: <Clock className="w-5 h-5" />,
        color: 'bg-yellow-500',
        label: 'Daily Practice',
        description: 'Quick daily review'
      },
      'daily_question_set': {
        icon: <BookOpen className="w-5 h-5" />,
        color: 'bg-purple-500',
        label: 'Question Set',
        description: 'Focused question practice'
      },
      'custom_practice': {
        icon: <Star className="w-5 h-5" />,
        color: 'bg-indigo-500',
        label: 'Custom Practice',
        description: 'Customized practice set'
      }
    };

    return typeMap[type] || typeMap['custom_practice'];
  };

  const getDifficultyLevel = (avgImportance) => {
    if (avgImportance >= 4) return { label: 'High', color: 'text-red-600 bg-red-100' };
    if (avgImportance >= 2.5) return { label: 'Medium', color: 'text-yellow-600 bg-yellow-100' };
    return { label: 'Easy', color: 'text-green-600 bg-green-100' };
  };

  const getEstimatedTime = (totalQuestions) => {
    // Assume 1.5 minutes per question on average
    const minutes = Math.round(totalQuestions * 1.5);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const filteredSets = questionSets.filter(set => {
    const matchesSearch = set.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         set.template?.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    return matchesSearch && set.template?.type === selectedFilter;
  });

  const startTest = (questionSet) => {
    router.push(`/student/test?setId=${questionSet.id}&setName=${encodeURIComponent(questionSet.name)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Question Sets</h1>
              <p className="text-gray-600">Choose from curriculum-based practice sets to enhance your preparation</p>
            </div>
            
            {userStats && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 min-w-80">
                <h3 className="font-semibold text-gray-900 mb-3">Your Progress</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{userStats.totalTests}</div>
                    <div className="text-gray-600">Tests Taken</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{userStats.averageScore}%</div>
                    <div className="text-gray-600">Avg Score</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{userStats.bestScore}%</div>
                    <div className="text-gray-600">Best Score</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{userStats.correctAnswers}</div>
                    <div className="text-gray-600">Correct Answers</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search question sets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Sets
            </button>
            <button
              onClick={() => setSelectedFilter('full_mock_practice')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === 'full_mock_practice'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Mock Tests
            </button>
            <button
              onClick={() => setSelectedFilter('weekly_full_practice')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === 'weekly_full_practice'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Weekly Practice
            </button>
            <button
              onClick={() => setSelectedFilter('daily_mixed_practice')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === 'daily_mixed_practice'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Daily Practice
            </button>
          </div>
        </div>

        {/* Question Sets Grid */}
        {filteredSets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Question Sets Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'No published question sets are available yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSets.map((set) => {
              const typeInfo = getSetTypeInfo(set.template?.type);
              const difficulty = getDifficultyLevel(set.average_importance_score || 1);
              const estimatedTime = getEstimatedTime(set.total_questions);

              return (
                <motion.div
                  key={set.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg ${typeInfo.color} text-white`}>
                        {typeInfo.icon}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficulty.color}`}>
                        {difficulty.label}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {set.name}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {set.template?.description || 'Custom practice set'}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="px-6 pb-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{set.total_questions} questions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{estimatedTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          Avg: {set.average_importance_score ? set.average_importance_score.toFixed(1) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{set.times_used || 0} attempts</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        {typeInfo.label} • {new Date(set.generated_at).toLocaleDateString()}
                      </div>
                      <button
                        onClick={() => startTest(set)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
                      >
                        <Play className="w-4 h-4" />
                        Start Test
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 