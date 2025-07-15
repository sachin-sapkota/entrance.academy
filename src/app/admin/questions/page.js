'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Copy,
  Star,
  Clock,
  Target,
  BookOpen,
  MoreVertical,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  Tag,
  Image as ImageIcon,
  FileText,
  Brain,
  Settings,
  Database,
  BarChart3,
  Users,
  TrendingUp,
  Award,
  Download,
  Upload,
  RefreshCw,
  Grid,
  List,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Folder
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';
import AdminNavbar from '../../components/AdminNavbar';

export default function QuestionBankManagementPage() {
  const router = useRouter();
  
  // State management
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [domains, setDomains] = useState([]);
  const [subdomains, setSubdomains] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedSubdomain, setSelectedSubdomain] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedCognitive, setSelectedCognitive] = useState('all');
  const [selectedImportance, setSelectedImportance] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // UI state
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'cards'
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [expandedDomains, setExpandedDomains] = useState(new Set());
  const [expandedSubdomains, setExpandedSubdomains] = useState(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterAndSortQuestions();
  }, [
    questions, searchTerm, selectedDomain, selectedSubdomain,
    selectedDifficulty, selectedCognitive, selectedImportance,
    sortBy, sortOrder
  ]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchQuestions(),
        fetchDomains(),
        fetchSubdomains()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          category:question_categories(
            id, name, code, weight,
            domain:domains(id, name, code, color_code)
          ),
          analytics:question_analytics(
            total_attempts, correct_attempts, overall_accuracy,
            average_time_spent, discrimination_index
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const fetchDomains = async () => {
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setDomains(data || []);
    } catch (error) {
      console.error('Error fetching domains:', error);
    }
  };

  const fetchSubdomains = async () => {
    try {
      const { data, error } = await supabase
        .from('question_categories')
        .select(`
          *,
          domain:domains(name, code, color_code)
        `)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setSubdomains(data || []);
    } catch (error) {
      console.error('Error fetching subdomains:', error);
    }
  };



  const filterAndSortQuestions = () => {
    let filtered = [...questions];

    // Text search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(q => 
        q.text.toLowerCase().includes(term) ||
        q.explanation?.toLowerCase().includes(term) ||
        (q.tags && q.tags.some(tag => tag.toLowerCase().includes(term)))
      );
    }

    // Domain filter
    if (selectedDomain !== 'all') {
      filtered = filtered.filter(q => q.category?.domain?.code === selectedDomain);
    }

    // Subdomain filter
    if (selectedSubdomain !== 'all') {
      filtered = filtered.filter(q => q.category?.code === selectedSubdomain);
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(q => q.difficulty_level === selectedDifficulty);
    }

    // Cognitive level filter
    if (selectedCognitive !== 'all') {
      filtered = filtered.filter(q => q.cognitive_level === selectedCognitive);
    }

    // Importance filter
    if (selectedImportance !== 'all') {
      const ranges = {
        'high': [4, 10],
        'medium': [2, 3],
        'low': [1, 1]
      };
      const [min, max] = ranges[selectedImportance] || [1, 10];
      filtered = filtered.filter(q => 
        q.importance_points >= min && q.importance_points <= max
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'text':
          aVal = a.text.toLowerCase();
          bVal = b.text.toLowerCase();
          break;
        case 'difficulty':
          const difficultyOrder = { very_easy: 1, easy: 2, medium: 3, hard: 4, very_hard: 5 };
          aVal = difficultyOrder[a.difficulty_level] || 3;
          bVal = difficultyOrder[b.difficulty_level] || 3;
          break;
        case 'importance':
          aVal = a.importance_points || 0;
          bVal = b.importance_points || 0;
          break;
        case 'attempts':
          aVal = a.analytics?.[0]?.total_attempts || 0;
          bVal = b.analytics?.[0]?.total_attempts || 0;
          break;
        case 'accuracy':
          aVal = a.analytics?.[0]?.overall_accuracy || 0;
          bVal = b.analytics?.[0]?.overall_accuracy || 0;
          break;
        case 'created_at':
        default:
          aVal = new Date(a.created_at);
          bVal = new Date(b.created_at);
          break;
      }

      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    setFilteredQuestions(filtered);
  };

  // Group questions by domain and subdomain
  const groupQuestionsByDomainAndSubdomain = () => {
    const grouped = {};
    
    filteredQuestions.forEach(question => {
      const domain = question.category?.domain;
      const subdomain = question.category;
      
      if (!domain) return;
      
      const domainKey = domain.code;
      const subdomainKey = subdomain?.code || 'uncategorized';
      
      if (!grouped[domainKey]) {
        grouped[domainKey] = {
          domain: domain,
          subdomains: {},
          totalQuestions: 0
        };
      }
      
      if (!grouped[domainKey].subdomains[subdomainKey]) {
        grouped[domainKey].subdomains[subdomainKey] = {
          subdomain: subdomain,
          questions: []
        };
      }
      
      grouped[domainKey].subdomains[subdomainKey].questions.push(question);
      grouped[domainKey].totalQuestions++;
    });
    
    return grouped;
  };

  const toggleDomainExpansion = (domainCode) => {
    const newExpanded = new Set(expandedDomains);
    if (newExpanded.has(domainCode)) {
      newExpanded.delete(domainCode);
    } else {
      newExpanded.add(domainCode);
    }
    setExpandedDomains(newExpanded);
  };

  const toggleSubdomainExpansion = (subdomainKey) => {
    const newExpanded = new Set(expandedSubdomains);
    if (newExpanded.has(subdomainKey)) {
      newExpanded.delete(subdomainKey);
    } else {
      newExpanded.add(subdomainKey);
    }
    setExpandedSubdomains(newExpanded);
  };

  const handleEdit = (questionId) => {
    router.push(`/admin/questions/create?edit=${questionId}`);
  };

  const handleDuplicate = async (question) => {
    try {
      const duplicateData = {
        ...question,
        text: `${question.text} (Copy)`,
        id: undefined,
        created_at: undefined,
        updated_at: undefined
      };

      const response = await fetch('/api/admin/questions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateData)
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Question duplicated successfully!');
        fetchQuestions();
      } else {
        alert('Error duplicating question: ' + result.message);
      }
    } catch (error) {
      console.error('Error duplicating question:', error);
      alert('Failed to duplicate question');
    }
  };

  const handleDelete = async () => {
    if (!questionToDelete) return;

    try {
      const { error } = await supabase
        .from('questions')
        .update({ is_active: false })
        .eq('id', questionToDelete.id);

      if (error) throw error;

      alert('Question deleted successfully!');
      setQuestions(prev => prev.filter(q => q.id !== questionToDelete.id));
      setShowDeleteModal(false);
      setQuestionToDelete(null);
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedQuestions.length === 0) {
      alert('Please select questions first');
      return;
    }

    try {
      switch (action) {
        case 'delete':
          const { error } = await supabase
            .from('questions')
            .update({ is_active: false })
            .in('id', selectedQuestions);

          if (error) throw error;
          alert(`${selectedQuestions.length} questions deleted successfully!`);
          break;
          
        case 'high_importance':
          const { error: importanceError } = await supabase
            .from('questions')
            .update({ importance_points: 5 })
            .in('id', selectedQuestions);

          if (importanceError) throw importanceError;
          alert(`${selectedQuestions.length} questions marked as high importance!`);
          break;
          
        default:
          break;
      }

      setSelectedQuestions([]);
      fetchQuestions();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      alert('Failed to perform bulk action');
    }
  };

  const toggleQuestionSelection = (questionId) => {
    setSelectedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(filteredQuestions.map(q => q.id));
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

  const getCognitiveColor = (cognitive) => {
    const colors = {
      'recall': 'bg-purple-100 text-purple-800',
      'understanding': 'bg-blue-100 text-blue-800',
      'application': 'bg-green-100 text-green-800'
    };
    return colors[cognitive] || 'bg-gray-100 text-gray-800';
  };

  const getSubdomainsByDomain = (domainCode) => {
    return subdomains.filter(s => s.domain?.code === domainCode);
  };

  const renderStatisticsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 border border-gray-200"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Questions</p>
            <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-lg">
            <Database className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm text-gray-600">
          <TrendingUp className="w-4 h-4 mr-1" />
          Across {domains.length} domains
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl p-6 border border-gray-200"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">High Importance</p>
            <p className="text-2xl font-bold text-gray-900">
              {questions.filter(q => q.importance_points >= 4).length}
            </p>
          </div>
          <div className="bg-yellow-100 p-3 rounded-lg">
            <Star className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm text-gray-600">
          <Award className="w-4 h-4 mr-1" />
          Priority questions
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl p-6 border border-gray-200"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Most Tested</p>
            <p className="text-2xl font-bold text-gray-900">
              {questions.filter(q => q.analytics?.[0]?.total_attempts > 0).length}
            </p>
          </div>
          <div className="bg-green-100 p-3 rounded-lg">
            <Users className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm text-gray-600">
          <BarChart3 className="w-4 h-4 mr-1" />
          Have attempt data
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl p-6 border border-gray-200"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Avg Accuracy</p>
            <p className="text-2xl font-bold text-gray-900">
              {questions.length > 0 
                ? Math.round(
                    questions
                      .filter(q => q.analytics?.[0]?.overall_accuracy)
                      .reduce((sum, q) => sum + (q.analytics[0].overall_accuracy || 0), 0) /
                    questions.filter(q => q.analytics?.[0]?.overall_accuracy).length
                  ) + '%'
                : '0%'
              }
            </p>
          </div>
          <div className="bg-purple-100 p-3 rounded-lg">
            <Target className="w-6 h-6 text-purple-600" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm text-gray-600">
          <CheckCircle className="w-4 h-4 mr-1" />
          Overall performance
        </div>
      </motion.div>
    </div>
  );

  const renderFilters = () => (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: showFilters ? 1 : 0, height: showFilters ? 'auto' : 0 }}
      className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden"
    >
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5" />
          Advanced Filters
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Domain Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="all">All Domains</option>
              {domains.map(domain => (
                <option key={domain.id} value={domain.code}>{domain.name}</option>
              ))}
            </select>
          </div>

          {/* Subdomain Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subdomain</label>
            <select
              value={selectedSubdomain}
              onChange={(e) => setSelectedSubdomain(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              disabled={selectedDomain === 'all'}
            >
              <option value="all">All Subdomains</option>
              {getSubdomainsByDomain(selectedDomain).map(subdomain => (
                <option key={subdomain.id} value={subdomain.code}>{subdomain.name}</option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="all">All Difficulties</option>
              <option value="very_easy">Very Easy</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="very_hard">Very Hard</option>
            </select>
          </div>

          {/* Cognitive Level Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cognitive Level</label>
            <select
              value={selectedCognitive}
              onChange={(e) => setSelectedCognitive(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="all">All Levels</option>
              <option value="recall">Recall</option>
              <option value="understanding">Understanding</option>
              <option value="application">Application</option>
            </select>
          </div>

          {/* Importance Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Importance</label>
            <select
              value={selectedImportance}
              onChange={(e) => setSelectedImportance(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="all">All Importance</option>
              <option value="high">High (4-10)</option>
              <option value="medium">Medium (2-3)</option>
              <option value="low">Low (1)</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="created_at">Created Date</option>
              <option value="text">Question Text</option>
              <option value="difficulty">Difficulty</option>
              <option value="importance">Importance</option>
              <option value="attempts">Attempts</option>
              <option value="accuracy">Accuracy</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDomain('all');
                setSelectedSubdomain('all');
                setSelectedDifficulty('all');
                setSelectedCognitive('all');
                setSelectedImportance('all');
                setSortBy('created_at');
                setSortOrder('desc');
              }}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderQuestionCard = (question) => (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow ml-8"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selectedQuestions.includes(question.id)}
            onChange={() => toggleQuestionSelection(question.id)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs font-medium rounded ${getDifficultyColor(question.difficulty_level)}`}>
              {question.difficulty_level}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded ${getCognitiveColor(question.cognitive_level)}`}>
              {question.cognitive_level}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="w-4 h-4" />
            <span className="text-sm font-medium">{question.importance_points}</span>
          </div>
          
          <div className="relative">
            <button className="p-1 hover:bg-gray-100 rounded">
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <h4 className="font-medium text-gray-900 mb-2 line-clamp-2 text-sm">{question.text}</h4>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {question.question_image_url && (
            <div className="flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              <span>Image</span>
            </div>
          )}
          
          {question.analytics?.[0] && (
            <>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{question.analytics[0].total_attempts}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                <span>{Math.round(question.analytics[0].overall_accuracy || 0)}%</span>
              </div>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleEdit(question.id)}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <Edit className="w-3 h-3" />
          </button>
          
          <button
            onClick={() => handleDuplicate(question)}
            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
          >
            <Copy className="w-3 h-3" />
          </button>
          
          <button
            onClick={() => {
              setQuestionToDelete(question);
              setShowDeleteModal(true);
            }}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderGroupedQuestions = () => {
    const groupedData = groupQuestionsByDomainAndSubdomain();
    
    if (Object.keys(groupedData).length === 0) {
      return (
        <div className="text-center py-12">
          <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No questions found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search criteria or create new questions.</p>
          <button
            onClick={() => router.push('/admin/questions/create')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Questions
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {Object.entries(groupedData).map(([domainCode, domainData]) => {
          const isDomainExpanded = expandedDomains.has(domainCode);
          
          return (
            <motion.div
              key={domainCode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              {/* Domain Header */}
              <div
                className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleDomainExpansion(domainCode)}
              >
                <div className="flex items-center gap-3">
                  {isDomainExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                  
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: domainData.domain.color_code }}
                  />
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {domainData.domain.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {domainData.totalQuestions} questions across {Object.keys(domainData.subdomains).length} subdomains
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">
                    {domainData.totalQuestions} questions
                  </span>
                  <FolderOpen className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Domain Content */}
              <AnimatePresence>
                {isDomainExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 space-y-3"
                  >
                    {Object.entries(domainData.subdomains).map(([subdomainCode, subdomainData]) => {
                      const subdomainKey = `${domainCode}-${subdomainCode}`;
                      const isSubdomainExpanded = expandedSubdomains.has(subdomainKey);
                      
                      return (
                        <div key={subdomainCode} className="border border-gray-200 rounded-lg overflow-hidden">
                          {/* Subdomain Header */}
                          <div
                            className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => toggleSubdomainExpansion(subdomainKey)}
                          >
                            <div className="flex items-center gap-3">
                              {isSubdomainExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              )}
                              
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {subdomainData.subdomain?.name || 'Uncategorized'}
                                </h4>
                                <p className="text-xs text-gray-600">
                                  {subdomainData.questions.length} questions
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-600">
                                {subdomainData.questions.length}
                              </span>
                              <Folder className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>

                          {/* Subdomain Questions */}
                          <AnimatePresence>
                            {isSubdomainExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-3 space-y-3 bg-white"
                              >
                                {subdomainData.questions.map(question => renderQuestionCard(question))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <ProtectedRoute requireAdmin={true}>
        <div className="min-h-screen bg-gray-50">
          <AdminNavbar />
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading question bank...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar />
        
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Question Bank Management</h1>
              <p className="text-gray-600">Manage your MBBS curriculum question banks by domain and subdomain</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/admin/questions/create')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Questions
              </button>
              
              <button
                onClick={fetchData}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          {renderStatisticsCards()}

          {/* Search and Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search questions, explanations, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 text-gray-900"
                  />
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 ${
                    showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </button>
                
                <button
                  onClick={() => {
                    // Expand all domains and subdomains
                    const allDomains = new Set(Object.keys(groupQuestionsByDomainAndSubdomain()));
                    const allSubdomains = new Set();
                    Object.entries(groupQuestionsByDomainAndSubdomain()).forEach(([domainCode, domainData]) => {
                      Object.keys(domainData.subdomains).forEach(subdomainCode => {
                        allSubdomains.add(`${domainCode}-${subdomainCode}`);
                      });
                    });
                    setExpandedDomains(allDomains);
                    setExpandedSubdomains(allSubdomains);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <FolderOpen className="w-4 h-4" />
                  Expand All
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {renderFilters()}

          {/* Bulk Actions */}
          {selectedQuestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center justify-between">
                <span className="text-blue-700 font-medium">
                  {selectedQuestions.length} questions selected
                </span>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkAction('high_importance')}
                    className="px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm"
                  >
                    Mark High Importance
                  </button>
                  
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                  >
                    Delete Selected
                  </button>
                  
                  <button
                    onClick={() => setSelectedQuestions([])}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Grouped Questions */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Questions by Domain & Subdomain ({filteredQuestions.length})
                </h2>
                
                <button
                  onClick={toggleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {selectedQuestions.length === filteredQuestions.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {renderGroupedQuestions()}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl max-w-md w-full p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Question</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this question? This action cannot be undone.
                </p>
                
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
} 