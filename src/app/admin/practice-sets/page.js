'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  Trash2,
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
  Calendar,
  Users,
  FileText,
  Globe,
  Archive,
  AlertTriangle
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function PracticeSetsPage() {
  const router = useRouter();
  const [practiceSets, setPracticeSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, live, draft
  const [domainFilter, setDomainFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent'); // recent, title, questions
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchPracticeSets();
  }, []);

  const fetchPracticeSets = async () => {
    try {
      const response = await apiGet('/api/admin/practice-sets');
      const data = await response.json();
      
      if (data.success) {
        setPracticeSets(data.practiceSets || []);
      }
    } catch (error) {
      console.error('Error fetching practice sets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePracticeSet = async (id) => {
    setActionLoading(id);
    
    try {
      const response = await apiDelete(`/api/admin/practice-sets?id=${id}`);
      const data = await response.json();
      
      if (data.success) {
        setPracticeSets(prev => prev.filter(set => set.id !== id));
        setShowDeleteConfirm(null);
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting practice set:', error);
      alert('Failed to delete practice set');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (practiceSet) => {
    setActionLoading(practiceSet.id);
    
    try {
      const response = await apiPut('/api/admin/practice-sets', {
        ...practiceSet,
        isLive: !practiceSet.isLive
      });

      const data = await response.json();
      
      if (data.success) {
        setPracticeSets(prev => 
          prev.map(set => 
            set.id === practiceSet.id 
              ? { ...set, isLive: !set.isLive, updatedAt: new Date().toISOString() }
              : set
          )
        );
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update practice set status');
    } finally {
      setActionLoading(null);
    }
  };

  // Get unique domains for filter
  const uniqueDomains = [...new Set(practiceSets.flatMap(set => set.domains || []))];

  // Filter and sort practice sets
  const filteredPracticeSets = practiceSets
    .filter(set => {
      // Search filter
      if (searchQuery && !set.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !set.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (statusFilter === 'live' && !set.isLive) return false;
      if (statusFilter === 'draft' && set.isLive) return false;
      
      // Domain filter
      if (domainFilter !== 'all' && !set.domains?.includes(domainFilter)) return false;
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'questions':
          return (b.questionsCount || 0) - (a.questionsCount || 0);
        case 'recent':
        default:
          return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
      }
    });

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading practice sets...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
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
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Practice Sets</h1>
                  <p className="text-gray-600">Manage your question sets and mock tests</p>
                </div>
              </div>
              
              <button
                onClick={() => router.push('/admin/practice-sets/create')}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Create Practice Set</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{practiceSets.length}</div>
                  <div className="text-sm text-gray-600">Total Sets</div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {practiceSets.filter(set => set.isLive).length}
                  </div>
                  <div className="text-sm text-gray-600">Live Sets</div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Globe className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {practiceSets.filter(set => !set.isLive).length}
                  </div>
                  <div className="text-sm text-gray-600">Draft Sets</div>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Archive className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {practiceSets.reduce((sum, set) => sum + (set.questionsCount || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Questions</div>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search practice sets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="live">Live</option>
                  <option value="draft">Draft</option>
                </select>

                <select
                  value={domainFilter}
                  onChange={(e) => setDomainFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Domains</option>
                  {uniqueDomains.map(domain => (
                    <option key={domain} value={domain}>{domain}</option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="recent">Recently Updated</option>
                  <option value="title">Title A-Z</option>
                  <option value="questions">Most Questions</option>
                </select>
              </div>
            </div>
          </div>

          {/* Practice Sets List */}
          {filteredPracticeSets.length > 0 ? (
            <div className="space-y-4">
              {filteredPracticeSets.map((practiceSet, index) => (
                <motion.div
                  key={practiceSet.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            practiceSet.isLive ? 'bg-green-100' : 'bg-orange-100'
                          }`}>
                            <BookOpen className={`w-6 h-6 ${
                              practiceSet.isLive ? 'text-green-600' : 'text-orange-600'
                            }`} />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer"
                                onClick={() => router.push(`/admin/practice-sets/create?edit=${practiceSet.id}`)}>
                              {practiceSet.title}
                            </h3>
                            {practiceSet.description && (
                              <p className="text-gray-600 text-sm mt-1">{practiceSet.description}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {/* Status Badge */}
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            practiceSet.isLive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {practiceSet.isLive ? 'Live' : 'Draft'}
                          </div>
                        </div>
                      </div>

                      {/* Meta Info */}
                      <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                        <div className="flex items-center space-x-1">
                          <FileText className="w-4 h-4" />
                          <span>{practiceSet.questionsCount || 0} questions</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <BookOpen className="w-4 h-4" />
                          <span>{practiceSet.domains?.length || 0} domain(s)</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Updated {new Date(practiceSet.updatedAt || practiceSet.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Domains */}
                      {practiceSet.domains && practiceSet.domains.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {practiceSet.domains.map((domain, domainIndex) => (
                            <span
                              key={domainIndex}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {domain}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={async () => {
                          try {
                            // Start editing session and redirect to preview
                            const response = await apiPost('/api/admin/practice-sets/draft', {
                              practiceSetId: practiceSet.id
                            });

                            const data = await response.json();
                            if (data.success) {
                              router.push(`/admin/practice-sets/preview?sessionId=${data.sessionId}`);
                            } else if (response.status === 409) {
                              alert('This practice set is being edited by someone else.');
                            } else {
                              alert('Failed to start preview session');
                            }
                          } catch (error) {
                            console.error('Error starting preview:', error);
                            alert('Failed to start preview session');
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => router.push(`/admin/practice-sets/create?edit=${practiceSet.id}`)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleToggleStatus(practiceSet)}
                        disabled={actionLoading === practiceSet.id}
                        className={`p-2 rounded-lg transition-colors ${
                          practiceSet.isLive
                            ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                        }`}
                        title={practiceSet.isLive ? 'Make Draft' : 'Publish Live'}
                      >
                        {practiceSet.isLive ? <Archive className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                      </button>
                      
                      <button
                        onClick={() => setShowDeleteConfirm(practiceSet.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery || statusFilter !== 'all' || domainFilter !== 'all' 
                  ? 'No practice sets found' 
                  : 'No practice sets created yet'
                }
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || statusFilter !== 'all' || domainFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first practice set to get started'
                }
              </p>
              <button
                onClick={() => router.push('/admin/practice-sets/create')}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Create Practice Set</span>
              </button>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 max-w-md mx-4"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Practice Set</h3>
                  <p className="text-gray-600 text-sm">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this practice set? All associated questions and data will be permanently removed.
              </p>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeletePracticeSet(showDeleteConfirm)}
                  disabled={actionLoading === showDeleteConfirm}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {actionLoading === showDeleteConfirm ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 