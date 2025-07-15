'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { apiGet, apiDelete } from '@/lib/api-client';
import {
  ArrowLeft,
  Plus,
  Eye,
  Trash2,
  Calendar,
  BookOpen,
  Users,
  BarChart3,
  Search,
  Filter
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';
import AdminNavbar from '../../components/AdminNavbar';

export default function QuestionSetsPage() {
  const router = useRouter();
  const [questionSets, setQuestionSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');

  useEffect(() => {
    fetchQuestionSets();
  }, []);

  const fetchQuestionSets = async () => {
    try {
      const response = await apiGet('/api/admin/question-sets');
      const data = await response.json();
      
      if (data.success) {
        setQuestionSets(data.questionSets);
      } else {
        console.error('Failed to fetch question sets:', data.message);
      }
    } catch (error) {
      console.error('Error fetching question sets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await apiDelete(`/api/admin/question-sets?id=${id}`);
      const data = await response.json();
      
      if (data.success) {
        alert('Question set deleted successfully');
        fetchQuestionSets(); // Refresh the list
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting question set:', error);
      alert('Failed to delete question set');
    }
  };

  const getDomainCounts = (domainDistribution) => {
    if (!domainDistribution || typeof domainDistribution !== 'object') {
      return [];
    }
    return Object.entries(domainDistribution).map(([domain, count]) => ({
      domain,
      count
    }));
  };

  const getAllDomains = () => {
    const domains = new Set();
    questionSets.forEach(set => {
      if (set.domain_distribution) {
        Object.keys(set.domain_distribution).forEach(domain => domains.add(domain));
      }
    });
    return Array.from(domains);
  };

  const filteredQuestionSets = questionSets.filter(set => {
    const matchesSearch = set.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (set.description && set.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDomain = !selectedDomain || 
                         (set.domain_distribution && Object.keys(set.domain_distribution).includes(selectedDomain));
    
    return matchesSearch && matchesDomain;
  });

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading question sets...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute adminOnly={true}>
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar />
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/admin')}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Admin</span>
                </button>
                <div className="text-gray-400">/</div>
                <h1 className="text-2xl font-bold text-gray-900">Question Sets</h1>
              </div>
              
              <button
                onClick={() => router.push('/admin/practice-sets/create')}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Create New</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search question sets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">All Domains</option>
                {getAllDomains().map(domain => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Question Sets Grid */}
          {filteredQuestionSets.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No question sets found</h3>
              <p className="text-gray-500 mb-6">
                {questionSets.length === 0 
                  ? "Get started by creating your first question set."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
              <button
                onClick={() => router.push('/admin/practice-sets/create')}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Create Question Set</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuestionSets.map((questionSet, index) => (
                <motion.div
                  key={questionSet.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {questionSet.name}
                        </h3>
                        {questionSet.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {questionSet.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          questionSet.is_published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {questionSet.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-600">
                          {questionSet.total_questions || 0} Questions
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-600">
                          {questionSet.domain_distribution ? Object.keys(questionSet.domain_distribution).length : 0} Domains
                        </span>
                      </div>
                    </div>

                    {/* Domain Distribution */}
                    {questionSet.domain_distribution && (
                      <div className="mb-4">
                        <h4 className="text-xs font-medium text-gray-700 mb-2">Domain Distribution:</h4>
                        <div className="space-y-1">
                          {getDomainCounts(questionSet.domain_distribution).map(({ domain, count }) => (
                            <div key={domain} className="flex justify-between items-center text-xs">
                              <span className="text-gray-600">{domain}</span>
                              <span className="font-medium text-gray-900">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(questionSet.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => router.push(`/admin/question-sets/${questionSet.id}`)}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                        
                        <button
                          onClick={() => handleDelete(questionSet.id, questionSet.name)}
                          className="flex items-center space-x-1 text-red-600 hover:text-red-700 text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 