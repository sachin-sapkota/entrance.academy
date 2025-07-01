'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Clock, 
  FileText, 
  Users, 
  Star,
  Target,
  Zap,
  BookOpen,
  Brain,
  Award,
  Trophy,
  Search,
  Filter,
  ArrowRight,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  Calendar,
  Coffee,
  Layers
} from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import Footer from '../components/Footer';

export default function LiveTestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Test type definitions matching the user's requirements
  const testTypes = [
    { value: 'practice', label: 'Practice Set', description: 'Standard practice question set', icon: BookOpen, color: 'from-blue-500 to-blue-600' },
    { value: 'full_syllabus', label: 'Full Syllabus Test', description: 'Comprehensive test covering all topics', icon: GraduationCap, color: 'from-purple-500 to-purple-600' },
    { value: 'domain_specific', label: 'Domain Specific', description: 'Focus on specific subject areas', icon: Target, color: 'from-green-500 to-green-600' },
    { value: 'weekly_domain', label: 'Weekly Domain Test', description: 'Weekly test for specific domains', icon: Calendar, color: 'from-orange-500 to-orange-600' },
    { value: 'weekly_full', label: 'Weekly Full Test', description: 'Weekly comprehensive test', icon: Trophy, color: 'from-red-500 to-red-600' },
    { value: 'daily_quiz', label: 'Daily Quiz', description: 'Short daily practice quiz', icon: Coffee, color: 'from-yellow-500 to-yellow-600' },
    { value: 'mini_quiz', label: 'Mini Quiz', description: 'Quick assessment with few questions', icon: Zap, color: 'from-pink-500 to-pink-600' }
  ];

  useEffect(() => {
    loadLiveTests();
    loadDomains();
  }, []);

  const loadLiveTests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/live-tests');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setTests(data.tests || []);
      } else {
        console.error('Failed to load live tests:', data.error);
        setTests([]);
      }
    } catch (error) {
      console.error('Error loading live tests:', error);
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDomains = async () => {
    try {
      const response = await fetch('/api/domains');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setDomains(data.domains || []);
      } else {
        console.error('Failed to load domains:', data.error);
        setDomains([]);
      }
    } catch (error) {
      console.error('Error loading domains:', error);
      setDomains([]);
    }
  };

  const getTestTypeInfo = (testType) => {
    return testTypes.find(type => type.value === testType) || {
      value: testType,
      label: testType,
      description: 'Test',
      icon: FileText,
      color: 'from-gray-500 to-gray-600'
    };
  };

  const getDomainIcon = (domain) => {
    const icons = {
      'Mathematics': Target,
      'Physics': Zap,
      'Chemistry': Brain,
      'Computer Science': Trophy,
      'English': BookOpen,
      'Mixed': Star,
      'Botany': BookOpen,
      'Zoology': Award
    };
    return icons[domain] || FileText;
  };

  const getDomainColor = (domain) => {
    const colors = {
      'Mathematics': 'from-blue-500 to-blue-600',
      'Physics': 'from-green-500 to-green-600',
      'Chemistry': 'from-yellow-500 to-yellow-600',
      'Computer Science': 'from-purple-500 to-purple-600',
      'English': 'from-pink-500 to-pink-600',
      'Mixed': 'from-indigo-500 to-indigo-600',
      'Botany': 'from-emerald-500 to-emerald-600',
      'Zoology': 'from-red-500 to-red-600'
    };
    return colors[domain] || 'from-gray-500 to-gray-600';
  };

  const getTypeColor = (type) => {
    const typeInfo = getTestTypeInfo(type);
    const colors = {
      'practice': 'bg-blue-100 text-blue-700',
      'full_syllabus': 'bg-purple-100 text-purple-700',
      'domain_specific': 'bg-green-100 text-green-700',
      'weekly_domain': 'bg-orange-100 text-orange-700',
      'weekly_full': 'bg-red-100 text-red-700',
      'daily_quiz': 'bg-yellow-100 text-yellow-700',
      'mini_quiz': 'bg-pink-100 text-pink-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'easy': 'bg-green-100 text-green-700',
      'medium': 'bg-yellow-100 text-yellow-700',
      'hard': 'bg-red-100 text-red-700'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-700';
  };

  const filteredTests = tests.filter(test => {
    const matchesDomain = selectedDomain === 'all' || test.domain === selectedDomain;
    const matchesType = selectedType === 'all' || test.type === selectedType || test.testType === selectedType;
    const matchesSearch = test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         test.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDomain && matchesType && matchesSearch;
  });

  // Group tests by test type instead of domain
  const groupedTests = filteredTests.reduce((groups, test) => {
    const testType = test.type || test.testType || 'practice';
    if (!groups[testType]) {
      groups[testType] = [];
    }
    groups[testType].push(test);
    return groups;
  }, {});

  const handleStartTest = (test) => {
    // Navigate to test lobby with the test configuration ID
    if (test.config?.id) {
      router.push(`/lobby/${test.config.id}`);
    } else {
      router.push(`/lobby/${test.id}`);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex items-center justify-between">
              <motion.div 
                className="flex items-center space-x-4"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <button
                  onClick={() => router.back()}
                  className="w-10 h-10 bg-white/60 hover:bg-white/80 rounded-xl flex items-center justify-center transition-colors border border-white/20"
                >
                  <ChevronRight className="w-5 h-5 rotate-180 text-slate-600" />
                </button>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Live Tests
                  </h1>
                  <p className="text-slate-600">Choose from different test types and start practicing</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center space-x-3"
              >
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-slate-700">
                      {filteredTests.length} Live Tests
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.header>

        {/* Search and Filters */}
        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 py-8"
        >
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20 mb-8">
            <div className="grid lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tests by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/60 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-500"
                />
              </div>

              {/* Domain Filter */}
              <div>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="w-full px-4 py-3 bg-white/60 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                >
                  <option value="all">All Domains</option>
                  {domains.map(domain => (
                    <option key={domain.id} value={domain.name}>{domain.name}</option>
                  ))}
                  <option value="Mixed">Mixed Subjects</option>
                </select>
              </div>

              {/* Test Type Filter */}
              <div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-3 bg-white/60 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                >
                  <option value="all">All Test Types</option>
                  {testTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Tests Grid - Grouped by Test Type */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 animate-pulse">
                  <div className="w-12 h-12 bg-slate-200 rounded-xl mb-4"></div>
                  <div className="h-6 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : Object.keys(groupedTests).length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-12"
            >
              {/* Sort test types in the desired order */}
              {testTypes
                .filter(testType => groupedTests[testType.value])
                .map(testType => {
                  const typeTests = groupedTests[testType.value];
                  const IconComponent = testType.icon;
                  
                  return (
                    <motion.section key={testType.value} variants={itemVariants}>
                      <div className="flex items-center mb-6">
                        <div className={`w-10 h-10 bg-gradient-to-br ${testType.color} rounded-xl flex items-center justify-center mr-4`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-slate-900">{testType.label}</h2>
                          <p className="text-slate-600">{typeTests.length} tests available • {testType.description}</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {typeTests.map((test, index) => {
                          const DomainIconComponent = getDomainIcon(test.domain);
                          
                          return (
                            <motion.div
                              key={test.id}
                              variants={itemVariants}
                              whileHover={{ y: -4, scale: 1.02 }}
                              className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20 hover:shadow-lg transition-all duration-300 group cursor-pointer"
                              onClick={() => handleStartTest(test)}
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className={`w-12 h-12 bg-gradient-to-br ${getDomainColor(test.domain)} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                                  <DomainIconComponent className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex flex-col items-end space-y-1">
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeColor(test.type || test.testType)}`}>
                                    {getTestTypeInfo(test.type || test.testType).label}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(test.difficulty)}`}>
                                    {test.difficulty}
                                  </span>
                                </div>
                              </div>

                              <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                {test.name}
                              </h3>

                              <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                                {test.description}
                              </p>

                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="text-center">
                                  <div className="text-xs text-slate-500 mb-1">Duration</div>
                                  <div className="font-semibold text-slate-700 text-sm flex items-center justify-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {test.estimatedTime}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs text-slate-500 mb-1">Questions</div>
                                  <div className="font-semibold text-slate-700 text-sm flex items-center justify-center">
                                    <FileText className="w-3 h-3 mr-1" />
                                    {test.questions}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-center mb-4">
                                <div className="flex items-center text-xs text-slate-500">
                                  <Users className="w-3 h-3 mr-1" />
                                  {test.participants} {test.participants === 1 ? 'participant' : 'participants'}
                                </div>
                              </div>

                              <div className="flex items-center justify-between mb-4">
                                <span className="text-xs text-slate-500">
                                  {test.domain}
                                </span>
                                <div className="flex items-center space-x-1">
                                  {test.featured && <Star className="w-3 h-3 text-yellow-500" />}
                                </div>
                              </div>

                              <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center group-hover:scale-105">
                                Start Test
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                              </button>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.section>
                  );
                })}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/20"
            >
              <Search className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No tests found</h3>
              <p className="text-slate-600 mb-6">Try adjusting your filters or search terms</p>
              <button
                onClick={() => {
                  setSelectedDomain('all');
                  setSelectedType('all');
                  setSearchQuery('');
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
              >
                Clear Filters
              </button>
            </motion.div>
          )}
        </main>
      </div>
      <Footer />
    </ProtectedRoute>
  );
} 