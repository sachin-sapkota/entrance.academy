'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Search,
  Plus,
  MessageSquare,
  MessageCircle,
  Clock,
  Eye,
  User,
  Pin,
  Star,
  Filter,
  TrendingUp,
  Users,
  Calendar,
  MoreVertical,
  HelpCircle,
  Lightbulb,
  GraduationCap,
  AlertTriangle
} from 'lucide-react';
import Footer from '../components/Footer';

export default function ForumPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [isLoading, setIsLoading] = useState(true);
  const [topics, setTopics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({});
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const sortOptions = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'replied', label: 'Most Replied' },
    { value: 'views', label: 'Most Viewed' }
  ];

  // Load forum statistics and categories
  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch('/api/forum/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
          setCategories(data.categories);
        }
      } catch (error) {
        console.error('Error loading forum stats:', error);
      }
    };

    loadStats();
  }, []);

  // Load topics
  const loadTopics = async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      const params = new URLSearchParams({
        category: selectedCategory,
        search: searchQuery,
        sortBy,
        limit: '20',
        offset: currentOffset.toString()
      });

      const response = await fetch(`/api/forum/topics?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (reset) {
          setTopics(data.topics);
          setOffset(20);
        } else {
          setTopics(prev => [...prev, ...data.topics]);
          setOffset(prev => prev + 20);
        }
        setHasMore(data.hasMore);
      } else {
        console.error('Failed to load topics');
        setTopics([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading topics:', error);
      setTopics([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  // Load topics when filters change
  useEffect(() => {
    setIsLoading(true);
    setOffset(0);
    const debounceTimer = setTimeout(() => {
      loadTopics(true);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [selectedCategory, searchQuery, sortBy]);

  // Load more topics
  const loadMoreTopics = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    loadTopics(false);
  };

  const getRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'help': return HelpCircle;
      case 'study': return GraduationCap;
      case 'suggestions': return Lightbulb;
      case 'technical': return AlertTriangle;
      default: return MessageSquare;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'help': return 'orange';
      case 'study': return 'purple';
      case 'suggestions': return 'yellow';
      case 'technical': return 'red';
      default: return 'blue';
    }
  };

  return (
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
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-slate-900">Community Forum</h1>
                <p className="text-sm text-slate-600">Connect, share, and learn together</p>
              </div>
              <div className="block sm:hidden">
                <h1 className="text-base font-bold text-slate-900">Forum</h1>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/forum/create')}
              className="flex items-center space-x-1 sm:space-x-2 px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg sm:rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Topic</span>
              <span className="sm:hidden text-sm">New</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Mobile Layout */}
      <div className="block lg:hidden">
        <main className="px-3 py-4">
          <div className="space-y-4">
            {/* Mobile Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg p-3 border border-slate-200"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search topics..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm"
                />
              </div>
            </motion.div>

            {/* Mobile Categories */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg p-3 border border-slate-200"
            >
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center text-sm">
                <Filter className="w-4 h-4 mr-2" />
                Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const Icon = getCategoryIcon(category.value);
                  return (
                    <motion.button
                      key={category.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCategory(category.value)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition-colors text-sm ${
                        selectedCategory === category.value
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'hover:bg-slate-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span className="text-xs font-medium">{category.label}</span>
                      <span className="text-xs bg-slate-100 px-1 py-0.5 rounded">
                        {category.count}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Mobile Sort */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg p-3 border border-slate-200 flex items-center justify-between"
            >
              <span className="text-sm text-slate-600">
                {topics.length} topics
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </motion.div>

            {/* Mobile Topics List */}
            <div className="space-y-3">
              <AnimatePresence>
                {isLoading ? (
                  // Loading skeleton
                  [...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white rounded-lg p-4 border border-slate-200"
                    >
                      <div className="animate-pulse">
                        <div className="h-3 bg-slate-200 rounded w-3/4 mb-2"></div>
                        <div className="h-2 bg-slate-200 rounded w-full mb-2"></div>
                        <div className="h-2 bg-slate-200 rounded w-2/3"></div>
                      </div>
                    </motion.div>
                  ))
                ) : topics.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg p-6 border border-slate-200 text-center"
                  >
                    <MessageCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-slate-900 mb-2">No topics found</h3>
                    <p className="text-slate-600 text-sm mb-4">
                      {searchQuery || selectedCategory !== 'all' 
                        ? 'Try adjusting your search or filters' 
                        : 'Be the first to start a discussion!'}
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push('/forum/create')}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 text-sm"
                    >
                      Create First Topic
                    </motion.button>
                  </motion.div>
                ) : (
                  topics.map((topic, index) => {
                    const CategoryIcon = getCategoryIcon(topic.category);
                    const categoryColor = getCategoryColor(topic.category);
                    
                    return (
                      <motion.div
                        key={topic.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -1 }}
                        className="bg-white rounded-lg p-4 border border-slate-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                        onClick={() => router.push(`/forum/${topic.id}`)}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2 flex-1">
                              {topic.is_pinned && (
                                <Pin className="w-3 h-3 text-green-600 flex-shrink-0" />
                              )}
                              <div className={`w-5 h-5 bg-gradient-to-br from-${categoryColor}-500 to-${categoryColor}-600 rounded flex items-center justify-center flex-shrink-0`}>
                                <CategoryIcon className="w-2.5 h-2.5 text-white" />
                              </div>
                              <span className={`px-2 py-1 bg-${categoryColor}-50 text-${categoryColor}-700 text-xs font-medium rounded-full`}>
                                {categories.find(cat => cat.value === topic.category)?.label || topic.category}
                              </span>
                              {topic.likes_count > 10 && (
                                <div className="flex items-center space-x-1 text-yellow-600">
                                  <Star className="w-3 h-3 fill-current" />
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">
                            {topic.title}
                          </h3>
                          
                          <p className="text-slate-600 text-xs line-clamp-2">
                            {topic.content}
                          </p>
                          
                          {topic.tags && topic.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {topic.tags.slice(0, 3).map(tag => (
                                <span 
                                  key={tag}
                                  className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full"
                                >
                                  #{tag}
                                </span>
                              ))}
                              {topic.tags.length > 3 && (
                                <span className="text-xs text-slate-500">+{topic.tags.length - 3}</span>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <div className="flex items-center space-x-1">
                              <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                <User className="w-2 h-2 text-white" />
                              </div>
                              <span className="font-medium text-slate-700">{topic.author?.full_name || 'Anonymous'}</span>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-1">
                                <MessageCircle className="w-3 h-3" />
                                <span>{topic.replies_count}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Eye className="w-3 h-3" />
                                <span>{topic.views}</span>
                              </div>
                              <span>{getRelativeTime(topic.updated_at)}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Load More */}
            {!isLoading && topics.length > 0 && hasMore && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center py-4"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={loadMoreTopics}
                  disabled={loadingMore}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto text-sm"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <span>Load More</span>
                  )}
                </motion.button>
              </motion.div>
            )}

            {/* Mobile Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-4 text-white"
            >
              <h3 className="font-semibold mb-3 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 mr-2" />
                Forum Stats
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="font-bold text-lg">{stats.total_topics || 0}</div>
                  <div className="text-indigo-100 text-xs">Topics</div>
                </div>
                <div>
                  <div className="font-bold text-lg">{stats.active_users || 0}</div>
                  <div className="text-indigo-100 text-xs">Users</div>
                </div>
                <div>
                  <div className="font-bold text-lg">{stats.todays_posts || 0}</div>
                  <div className="text-indigo-100 text-xs">Today</div>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Search */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl p-4 border border-slate-200"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search topics..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm"
                  />
                </div>
              </motion.div>

              {/* Categories */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-4 border border-slate-200"
              >
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  Categories
                </h3>
                <div className="space-y-2">
                  {categories.map((category) => {
                    const Icon = getCategoryIcon(category.value);
                    return (
                      <motion.button
                        key={category.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedCategory(category.value)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                          selectedCategory === category.value
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{category.label}</span>
                        </div>
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded-full">
                          {category.count}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white"
              >
                <h3 className="font-semibold mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Forum Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-indigo-100 text-sm">Total Topics</span>
                    <span className="font-bold">{stats.total_topics || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-indigo-100 text-sm">Active Users</span>
                    <span className="font-bold">{stats.active_users || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-indigo-100 text-sm">Today's Posts</span>
                    <span className="font-bold">{stats.todays_posts || 0}</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Controls */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-4 border border-slate-200 flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-slate-600">
                    {topics.length} topics found
                  </span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>

              {/* Topics List */}
              <div className="space-y-4">
                <AnimatePresence>
                  {isLoading ? (
                    // Loading skeleton
                    [...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white rounded-xl p-6 border border-slate-200"
                      >
                        <div className="animate-pulse">
                          <div className="h-4 bg-slate-200 rounded w-3/4 mb-3"></div>
                          <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                          <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                        </div>
                      </motion.div>
                    ))
                  ) : topics.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl p-8 border border-slate-200 text-center"
                    >
                      <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No topics found</h3>
                      <p className="text-slate-600 mb-4">
                        {searchQuery || selectedCategory !== 'all' 
                          ? 'Try adjusting your search or filters' 
                          : 'Be the first to start a discussion!'}
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/forum/create')}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                      >
                        Create First Topic
                      </motion.button>
                    </motion.div>
                  ) : (
                    topics.map((topic, index) => {
                      const CategoryIcon = getCategoryIcon(topic.category);
                      const categoryColor = getCategoryColor(topic.category);
                      
                      return (
                        <motion.div
                          key={topic.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ y: -2 }}
                          className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                          onClick={() => router.push(`/forum/${topic.id}`)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                {topic.is_pinned && (
                                  <Pin className="w-4 h-4 text-green-600" />
                                )}
                                <div className={`w-6 h-6 bg-gradient-to-br from-${categoryColor}-500 to-${categoryColor}-600 rounded-lg flex items-center justify-center`}>
                                  <CategoryIcon className="w-3 h-3 text-white" />
                                </div>
                                <span className={`px-2 py-1 bg-${categoryColor}-50 text-${categoryColor}-700 text-xs font-medium rounded-full`}>
                                  {categories.find(cat => cat.value === topic.category)?.label || topic.category}
                                </span>
                                {topic.likes_count > 10 && (
                                  <div className="flex items-center space-x-1 text-yellow-600">
                                    <Star className="w-3 h-3 fill-current" />
                                    <span className="text-xs font-medium">Popular</span>
                                  </div>
                                )}
                              </div>
                              
                              <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
                                {topic.title}
                              </h3>
                              
                              <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                                {topic.content}
                              </p>
                              
                              <div className="flex flex-wrap gap-2 mb-4">
                                {topic.tags && topic.tags.map(tag => (
                                  <span 
                                    key={tag}
                                    className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                      <User className="w-3 h-3 text-white" />
                                    </div>
                                    <div>
                                      <span className="text-sm font-medium text-slate-900">{topic.author?.full_name || 'Anonymous'}</span>
                                      <span className="text-xs text-slate-500 ml-2">{topic.author?.role || 'User'}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-4 text-sm text-slate-500">
                                  <div className="flex items-center space-x-1">
                                    <MessageCircle className="w-4 h-4" />
                                    <span>{topic.replies_count}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Eye className="w-4 h-4" />
                                    <span>{topic.views}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{getRelativeTime(topic.updated_at)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="text-slate-400 hover:text-slate-600 transition-colors ml-4"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle topic options menu
                              }}
                            >
                              <MoreVertical className="w-5 h-5" />
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>

              {/* Load More */}
              {!isLoading && topics.length > 0 && hasMore && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center py-6"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={loadMoreTopics}
                    disabled={loadingMore}
                    className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                  >
                    {loadingMore ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <span>Load More Topics</span>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
} 