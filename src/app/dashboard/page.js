'use client';

import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOutUser, refreshUserProfile } from '../../store/slices/authSlice';
import { fetchDomains } from '../../store/slices/questionsSlice';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Trophy, 
  BookOpen, 
  User, 
  Settings, 
  HelpCircle, 
  LogOut, 
  ChevronDown,
  Play,
  FileText,
  Award,
  TrendingUp,
  Calendar,
  Star,
  Zap,
  Target,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle,
  PlusCircle,
  RefreshCw,
  Activity,
  Users,
  Shield,
  ChevronRight,
  Timer,
  AlertCircle,
  GraduationCap,
  Percent,
  MessageSquare,
  Bell
} from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import Footer from '../components/Footer';
import { supabase } from '../../lib/supabase';
import AIChatBot from '../components/AIChatBot';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, profile } = useSelector((state) => state.auth);
  const { domains } = useSelector((state) => state.questions);
  
  // State management
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [recentTests, setRecentTests] = useState([]);
  const [livePracticeSets, setLivePracticeSets] = useState([]);
  const [upcomingTests, setUpcomingTests] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  
  // Loading states
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingPracticeSets, setLoadingPracticeSets] = useState(true);
  const [loadingUpcomingTests, setLoadingUpcomingTests] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Redirect admin users to admin dashboard
    if (profile?.role === 'admin') {
      router.push('/admin');
      return;
    }
    
    dispatch(fetchDomains());
  }, [dispatch, profile, router]);

  useEffect(() => {
    if (user?.id) {
      loadUserStats();
      loadLivePracticeSets();
      loadUpcomingTests();
      loadActiveSessions();
      
      // Refresh active sessions every 60 seconds
      const sessionsInterval = setInterval(loadActiveSessions, 60000);
      
      return () => clearInterval(sessionsInterval);
    }
  }, [user?.id]); 

  const loadUserStats = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingStats(true);
      
      // Get current session token
      let { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshedSession?.access_token) {
          session = refreshedSession;
        } else {
          console.error('Failed to get valid session for stats');
          return;
        }
      }

      const response = await fetch(`/api/users/${user.id}/stats`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUserStats(data.stats);
          setRecentTests(data.stats.recentTests || []);
        }
      }
    } catch (error) {
      console.error('💥 Error loading user stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadActiveSessions = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingSessions(true);
      
      // Get current session token
      let { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
        if (refreshedSession?.access_token) {
          session = refreshedSession;
        } else {
          return;
        }
      }

      const response = await fetch(`/api/users/${user.id}/sessions`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.sessions) {
          setActiveSessions(data.sessions);
        }
      }
    } catch (error) {
      console.error('💥 Error loading sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadLivePracticeSets = async () => {
    try {
      setLoadingPracticeSets(true);
      
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add auth header if session exists
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/practice-sets', { headers });
      const data = await response.json();
      
      if (data.success) {
        setLivePracticeSets(data.practiceSets || []);
      } else {
        console.error('API Error:', data.error);
      }
    } catch (error) {
      console.error('Error loading practice sets:', error);
    } finally {
      setLoadingPracticeSets(false);
    }
  };

  const loadUpcomingTests = async () => {
    try {
      setLoadingUpcomingTests(true);
      
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add auth header if session exists
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/admin/upcoming-tests', { headers });
      const data = await response.json();
      
      if (data.upcomingTests) {
        const now = new Date();
        const openTests = data.upcomingTests.filter(test => {
          const registrationDeadline = new Date(test.registration_deadline);
          const testDate = new Date(test.available_from);
          return now < registrationDeadline && now < testDate && test.is_public;
        });
        setUpcomingTests(openTests);
      } else {
        console.error('API Error:', data.error);
      }
    } catch (error) {
      console.error('Error loading upcoming tests:', error);
    } finally {
      setLoadingUpcomingTests(false);
    }
  };

  const handleSignOut = () => {
    dispatch(signOutUser());
  };

  const handleStartPracticeSet = (practiceSet) => {
    router.push(`/lobby/${practiceSet.id}`);
  };

  const handleResumeSession = (session) => {
    router.push(`/quiz?testId=${session.testId}`);
  };

  const getUserInitials = (name) => {
    const displayName = name || user?.email || 'U';
    return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getDomainColor = (domains) => {
    const domainColors = {
      'Mathematics': 'from-blue-400 to-blue-600',
      'Physics': 'from-green-400 to-green-600', 
      'Chemistry': 'from-yellow-400 to-yellow-600',
      'Botany': 'from-emerald-400 to-emerald-600',
      'Zoology': 'from-red-400 to-red-600',
      'Computer Science': 'from-purple-400 to-purple-600',
      'English': 'from-pink-400 to-pink-600',
      'Mental Agility Test': 'from-gray-400 to-gray-600'
    };
    
    if (domains && domains.length > 0) {
      return domainColors[domains[0]] || 'from-indigo-400 to-indigo-600';
    }
    return 'from-indigo-400 to-indigo-600';
  };

  const getPracticeSetIcon = (domains) => {
    const domainIcons = {
      'Mathematics': Target,
      'Physics': Zap,
      'Chemistry': Brain,
      'Botany': BookOpen,
      'Zoology': Award,
      'Computer Science': Trophy,
      'English': FileText,
      'Mental Agility Test': Star
    };
    
    if (domains && domains.length > 0) {
      return domainIcons[domains[0]] || BookOpen;
    }
    return BookOpen;
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

  if (loadingStats) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const statCards = [
    { label: 'Total Tests', value: userStats?.totalTests || 0, icon: FileText, color: 'from-blue-500 to-blue-600' },
    { label: 'Completed', value: userStats?.completedTests || 0, icon: Trophy, color: 'from-green-500 to-green-600' },
    { label: 'Average Score', value: userStats?.averageScore ? `${userStats.averageScore}%` : '0%', icon: Target, color: 'from-purple-500 to-purple-600' },
    { label: 'Study Streak', value: `${userStats?.studyStreak || 0} ${userStats?.studyStreak === 1 ? 'day' : 'days'}`, icon: TrendingUp, color: 'from-orange-500 to-orange-600' },
    { label: 'Study Time', value: `${Math.round(userStats?.totalTimeSpent / 60)}h`, icon: Clock, color: 'from-indigo-500 to-indigo-600' },
    { label: 'Rank', value: `#${userStats?.rank || 0}`, icon: Award, color: 'from-yellow-500 to-yellow-600' }
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/95 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50 shadow-sm safe-area-inset-top"
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-4">
            <div className="flex items-center justify-between">
              {/* Logo and Brand */}
              <div className="flex items-center space-x-3 sm:space-x-6">
                <Link 
                  href="/"
                  className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity"
                  title="Go to homepage"
                >
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg"
                  >
                    <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </motion.div>
                  <div className="hidden md:block">
                    <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Entrance Academy
                    </h1>
                  </div>
                  <div className="md:hidden">
                    <h1 className="text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      EA
                    </h1>
                  </div>
                </Link>
                
                {/* Dashboard Title - Desktop */}
                <div className="hidden md:block w-px h-8 bg-slate-200"></div>
                <div className="hidden sm:flex flex-col">
                  <h2 className="text-base sm:text-lg font-semibold text-slate-800">Dashboard</h2>
                  <p className="text-xs sm:text-sm text-slate-500 hidden md:block">Welcome back, {profile?.fullName || user?.email?.split('@')[0]}</p>
                </div>

                {/* Dashboard Title - Mobile */}
                <div className="sm:hidden">
                  <h2 className="text-base font-semibold text-slate-800">Dashboard</h2>
                </div>
              </div>
              
              {/* User Avatar with Dropdown */}
              <motion.div 
                className="relative"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 sm:space-x-3 p-1 sm:p-2 rounded-lg sm:rounded-xl bg-white/70 hover:bg-white/90 transition-all duration-200 shadow-sm border border-slate-200/50 group"
                  aria-label="User menu"
                  aria-expanded={showUserDropdown}
                >
                  <div className="relative">
                    {profile?.profile_image_url ? (
                      <img 
                        src={profile.profile_image_url}
                        alt={profile?.fullName || 'User avatar'}
                        className="w-7 h-7 sm:w-10 sm:h-10 rounded-md sm:rounded-lg object-cover shadow-md ring-2 ring-slate-200/50 group-hover:ring-slate-300/50 transition-all duration-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-7 h-7 sm:w-10 sm:h-10 bg-gradient-to-br from-violet-500 via-purple-500 to-blue-500 rounded-md sm:rounded-lg flex items-center justify-center text-white font-bold shadow-md ring-2 ring-slate-200/50 group-hover:ring-slate-300/50 transition-all duration-200 ${profile?.profile_image_url ? 'hidden' : ''}`}
                    >
                      <span className="text-xs sm:text-sm">{getUserInitials(profile?.fullName)}</span>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-white shadow-sm">
                      <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  
                  {/* User info - hidden on mobile and tablet, shown on desktop */}
                  <div className="text-left hidden xl:block">
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-slate-900 transition-colors">
                      {profile?.fullName || user?.email?.split('@')[0] || 'User'}
                    </p>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs text-slate-500 capitalize">{profile?.role || 'Student'}</p>
                      <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                      <p className="text-xs text-green-600 font-medium">Online</p>
                    </div>
                  </div>
                  
                  {/* Dropdown chevron - smaller on mobile */}
                  <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-slate-500 transition-transform group-hover:text-slate-700 ${showUserDropdown ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showUserDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowUserDropdown(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-1 sm:mt-2 w-52 sm:w-64 bg-white/98 backdrop-blur-md rounded-lg sm:rounded-xl shadow-xl border border-slate-200/50 py-2 z-50"
                      >
                        <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-100">
                          <p className="font-semibold text-slate-800 truncate text-sm sm:text-base">{profile?.fullName || user?.email}</p>
                          <p className="text-xs sm:text-sm text-slate-500 truncate">{user?.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-green-600 font-medium">Online</span>
                          </div>
                        </div>
                        
                        <div className="py-1 sm:py-2">
                          <button 
                            onClick={() => {
                              setShowUserDropdown(false);
                              router.push('/profile');
                            }}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-2.5 text-left flex items-center space-x-3 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                          >
                            <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            <span className="text-slate-700 font-medium text-sm sm:text-base">My Profile</span>
                          </button>
                          
                          <button 
                            onClick={() => {
                              setShowUserDropdown(false);
                              router.push('/exams');
                            }}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-2.5 text-left flex items-center space-x-3 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                          >
                            <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            <span className="text-slate-700 font-medium text-sm sm:text-base">My Exams</span>
                          </button>
                          
                          <button 
                            onClick={() => {
                              setShowUserDropdown(false);
                              router.push('/results');
                            }}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-2.5 text-left flex items-center space-x-3 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                          >
                            <Trophy className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            <span className="text-slate-700 font-medium text-sm sm:text-base">My Results</span>
                          </button>
                          
                          <button 
                            onClick={() => {
                              setShowUserDropdown(false);
                              router.push('/help');
                            }}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-2.5 text-left flex items-center space-x-3 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                          >
                            <HelpCircle className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            <span className="text-slate-700 font-medium text-sm sm:text-base">Help & Support</span>
                          </button>
                        </div>
                        
                        <div className="border-t border-slate-100 pt-1 sm:pt-2">
                          <button
                            onClick={() => {
                              setShowUserDropdown(false);
                              handleSignOut();
                            }}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-2.5 text-left flex items-center space-x-3 hover:bg-red-50 active:bg-red-100 transition-colors text-red-600"
                          >
                            <LogOut className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium text-sm sm:text-base">Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Quick Actions & Active Sessions */}
            <motion.section variants={itemVariants} className="mb-12">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="lg:col-span-2">
                  <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                    Quick Actions
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push('/live-tests')}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 text-left group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Play className="w-8 h-8" />
                        <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
                      </div>
                      <h3 className="font-semibold text-lg mb-1">Start New Test</h3>
                      <p className="text-sm text-blue-100">Begin a practice test or mock exam</p>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        // Scroll to practice sets section
                        const element = document.getElementById('practice-sets-section');
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 text-left group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <BookOpen className="w-8 h-8" />
                        <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
                      </div>
                      <h3 className="font-semibold text-lg mb-1">Practice Sets</h3>
                      <p className="text-sm text-purple-100">Study with topic-wise questions</p>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push('/exams')}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 text-left group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <BarChart3 className="w-8 h-8" />
                        <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
                      </div>
                      <h3 className="font-semibold text-lg mb-1">View Results</h3>
                      <p className="text-sm text-emerald-100">Check your test performance</p>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={async () => {
                        setIsRefreshing(true);
                        // Refresh all data
                        await Promise.all([
                          loadUserStats(),
                          loadActiveSessions(),
                          loadLivePracticeSets(),
                          loadUpcomingTests()
                        ]);
                        setIsRefreshing(false);
                      }}
                      disabled={isRefreshing}
                      className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 text-left group disabled:opacity-70"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <RefreshCw className={`w-8 h-8 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
                      </div>
                      <h3 className="font-semibold text-lg mb-1">{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</h3>
                      <p className="text-sm text-amber-100">{isRefreshing ? 'Please wait' : 'Update your dashboard'}</p>
                    </motion.button>
                  </div>
                </div>

                {/* Active Sessions */}
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-green-500" />
                    Active Sessions
                  </h2>
                  <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-white/20">
                    {loadingSessions ? (
                      <div className="space-y-3">
                        {[1, 2].map(i => (
                          <div key={i} className="animate-pulse">
                            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : activeSessions.length > 0 ? (
                      <div className="space-y-3">
                        {activeSessions.map((session, index) => (
                          <motion.div
                            key={session.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-3 bg-green-50 rounded-lg border border-green-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-slate-800 text-sm">Test in Progress</p>
                                <div className="flex items-center space-x-3 text-xs text-slate-600 mt-1">
                                  <span>{Math.floor(session.timeLeft / 60)} min left</span>
                                  {session.answeredQuestions > 0 && (
                                    <>
                                      <span>•</span>
                                      <span>{session.answeredQuestions} answered</span>
                                    </>
                                  )}
                                  {session.flaggedQuestions > 0 && (
                                    <>
                                      <span>•</span>
                                      <span>{session.flaggedQuestions} flagged</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => handleResumeSession(session)}
                                className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                              >
                                Resume
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Timer className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p className="text-slate-500 text-sm">No active sessions</p>
                        <p className="text-xs text-slate-400 mt-1">Start a new test to begin</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Performance Overview */}
            <motion.section variants={itemVariants} className="mb-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                <TrendingUp className="w-6 h-6 mr-2 text-blue-500" />
                Performance Overview
              </h2>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {loadingStats ? (
                  // Loading skeleton
                  [1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 animate-pulse">
                      <div className="w-12 h-12 bg-slate-200 rounded-xl mb-4"></div>
                      <div className="h-6 bg-slate-200 rounded mb-2"></div>
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    </div>
                  ))
                ) : (
                  [
                    { 
                      label: 'Tests Taken', 
                      value: userStats?.totalTests || 0, 
                      icon: FileText, 
                      color: 'from-blue-500 to-blue-600',
                      subtext: userStats?.completedTests ? `${userStats.completedTests} completed` : null
                    },
                    { 
                      label: 'Average Score', 
                      value: userStats?.averageScore ? `${userStats.averageScore}%` : '0%', 
                      icon: Percent, 
                      color: 'from-green-500 to-green-600',
                      subtext: userStats?.accuracy ? `${userStats.accuracy}% accuracy` : null
                    },
                    { 
                      label: 'Best Score', 
                      value: userStats?.bestScore ? `${userStats.bestScore}%` : '0%', 
                      icon: Trophy, 
                      color: 'from-amber-500 to-amber-600',
                      subtext: 'Personal best'
                    },
                    { 
                      label: 'Study Streak', 
                      value: `${userStats?.studyStreak || 0} ${userStats?.studyStreak === 1 ? 'day' : 'days'}`, 
                      icon: Zap, 
                      color: 'from-purple-500 to-purple-600',
                      subtext: userStats?.totalTimeSpent ? `${formatTime(userStats.totalTimeSpent)} total` : null
                    }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20 hover:shadow-md transition-all duration-200"
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                    <p className="text-slate-600 text-sm">{stat.label}</p>
                      {stat.subtext && (
                        <p className="text-xs text-slate-500 mt-1">{stat.subtext}</p>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </motion.section>

            {/* Recent Activity */}
            <motion.section variants={itemVariants} className="mb-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                <Clock className="w-6 h-6 mr-2 text-indigo-500" />
                Recent Activity
              </h2>
              
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Tests */}
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/30 overflow-hidden h-full flex flex-col max-h-[580px]">
                  {/* Modern Header */}
                  <div className="relative p-5 bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-md">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20"></div>
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg">Recent Tests</h3>
                          <p className="text-blue-200 text-sm">Your latest performance</p>
                        </div>
                      </div>
                      {recentTests.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                            <span className="text-white text-xs font-semibold">{recentTests.length}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Content Area */}
                  <div className="flex-1 flex flex-col min-h-0">
                  {loadingStats ? (
                      <div className="p-4 space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-16 bg-gradient-to-r from-slate-200/60 via-slate-100/60 to-slate-200/60 rounded-xl"></div>
                          </div>
                        ))}
                    </div>
                  ) : recentTests.length > 0 ? (
                      <>
                        {/* Tests List - Compact & Scrollable */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar max-h-[400px]">
                      {recentTests.map((test, index) => (
                        <motion.div
                          key={test.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                              className="group relative bg-gradient-to-r from-white/90 via-blue-50/50 to-indigo-50/30 border border-slate-200/50 rounded-xl p-4 hover:shadow-lg hover:border-blue-300/50 transition-all duration-300 hover:scale-[1.02]"
                            >
                              {/* Modern Test Header */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                                    <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-blue-900 transition-colors">
                                {test.name}
                              </h4>
                            </div>
                                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                                    <Calendar className="w-3 h-3" />
                                    <span>{formatDate(test.date)}</span>
                                  </div>
                                </div>
                                <div className="ml-3">
                                  <div className={`inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-bold shadow-sm ${
                                    test.score >= 80 ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200' : 
                                    test.score >= 60 ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border border-yellow-200' : 
                                    'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200'
                              }`}>
                                {test.score}%
                              </div>
                            </div>
                          </div>
                          
                              {/* Compact Metrics */}
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-1">
                                  <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <span className="text-xs font-bold text-blue-700">{test.questions}</span>
                            </div>
                                  <span className="text-xs text-slate-500">Q</span>
                            </div>
                                <div className="flex items-center space-x-1">
                                  <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                                    <span className="text-xs font-bold text-green-700">{test.correct}</span>
                            </div>
                                  <span className="text-xs text-slate-500">✓</span>
                          </div>
                                <div className="flex items-center space-x-1">
                                  <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <Clock className="w-3 h-3 text-indigo-700" />
                                  </div>
                                  <span className="text-xs text-slate-500">{formatTime(test.timeSpent || 0)}</span>
                                </div>
                                <div className="flex-1">
                                  <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${test.score}%` }}
                                      transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                                      className={`absolute h-full rounded-full shadow-sm ${
                                        test.score >= 80 ? 'bg-gradient-to-r from-green-400 via-emerald-400 to-green-500' :
                                        test.score >= 60 ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500' :
                                        'bg-gradient-to-r from-red-400 via-rose-400 to-red-500'
                                    }`}
                                  />
                                  </div>
                                </div>
                              </div>
                              
                              {/* Glossy Hover Effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-blue-500/5 to-indigo-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </motion.div>
                      ))}
                        </div>
                      
                        {/* Modern Action Footer */}
                        <div className="p-4 bg-gradient-to-r from-slate-50/80 to-blue-50/80 backdrop-blur-sm border-t border-slate-200/50">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/exams')}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold text-sm rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl group"
                      >
                            <span>View All Tests</span>
                            <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                      </motion.button>
                    </div>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-6">
                        <motion.div
                          initial={{ scale: 0, rotate: -10 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.6, type: "spring" }}
                          className="relative mb-4"
                        >
                          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-lg">
                            <FileText className="w-10 h-10 text-blue-500" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                            <span className="text-xs">✨</span>
                          </div>
                        </motion.div>
                        <h4 className="font-bold text-slate-800 mb-2 text-lg">Ready to Start?</h4>
                        <p className="text-slate-500 text-sm mb-6 text-center max-w-sm leading-relaxed">
                          Take your first test to unlock detailed analytics and track your progress
                        </p>
                      <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/upcoming-tests')}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
                      >
                          <span>Start Your First Test</span>
                          <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    </div>
                  )}
                  </div>
                </div>

              {/* Enhanced Custom Scrollbar Styles */}
              <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: rgba(241, 245, 249, 0.3);
                  border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: linear-gradient(to bottom, #3b82f6, #6366f1);
                  border-radius: 3px;
                  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.3);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: linear-gradient(to bottom, #2563eb, #4f46e5);
                }
              `}</style>

                {/* Weekly Progress */}
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/30 overflow-hidden h-full flex flex-col max-h-[580px]">
                  {/* Modern Header */}
                  <div className="relative p-5 bg-gradient-to-br from-emerald-900/95 via-green-900/95 to-teal-900/95 backdrop-blur-md">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 via-emerald-600/20 to-teal-600/20"></div>
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg">Weekly Progress</h3>
                          <p className="text-green-200 text-sm">Performance trends</p>
                        </div>
                      </div>
                      {userStats?.weeklyProgress && userStats.weeklyProgress.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                            <span className="text-white text-xs font-semibold">{userStats.weeklyProgress.length}w</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Content Area */}
                  <div className="flex-1 flex flex-col min-h-0">
                  {loadingStats ? (
                      <div className="p-4 space-y-3">
                        <div className="h-32 bg-gradient-to-r from-slate-200/60 via-slate-100/60 to-slate-200/60 rounded-xl animate-pulse"></div>
                        {[1, 2].map((i) => (
                          <div key={i} className="h-20 bg-gradient-to-r from-slate-200/60 via-slate-100/60 to-slate-200/60 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                  ) : userStats?.weeklyProgress && userStats.weeklyProgress.length > 0 ? (
                      <>
                        {/* Modern Bar Chart */}
                        <div className="p-4">
                          <div className="relative h-36 bg-gradient-to-br from-emerald-50/80 to-green-50/80 rounded-xl border border-emerald-200/50 overflow-hidden mb-4 shadow-inner">
                            {/* Enhanced Background Grid */}
                            <div className="absolute inset-0 p-3 pl-8">
                              <svg className="w-full h-full opacity-30">
                             <defs>
                                  <pattern id="weeklyGrid" width="20" height="16" patternUnits="userSpaceOnUse">
                                    <path d="M 20 0 L 0 0 0 16" fill="none" stroke="#059669" strokeWidth="0.5"/>
                               </pattern>
                             </defs>
                                <rect width="100%" height="100%" fill="url(#weeklyGrid)" />
                           </svg>
                         </div>
                         
                         {/* Y-axis labels */}
                            <div className="absolute left-1 top-2 bottom-2 flex flex-col justify-between text-xs text-emerald-600 font-semibold">
                           <span>100%</span>
                           <span>75%</span>
                           <span>50%</span>
                           <span>25%</span>
                           <span>0%</span>
                         </div>
                         
                            {/* Modern Bar Chart */}
                            <div className="absolute inset-3 left-8 flex items-end space-x-2">
                              {userStats.weeklyProgress.map((week, index) => {
                                const barHeight = Math.max(4, (week.averageScore / 100) * 100);
                                const isLatest = index === userStats.weeklyProgress.length - 1;
                                
                                return (
                                  <div
                                    key={index}
                                    className="flex-1 flex flex-col items-center group relative"
                                  >
                                    {/* Bar */}
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: `${barHeight}%`, opacity: 1 }}
                                      transition={{ 
                                        duration: 0.8, 
                                        delay: 0.2 + index * 0.1,
                                        ease: "easeOut"
                                      }}
                                      className={`w-full rounded-t-lg relative overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300 ${
                                        week.averageScore >= 80 
                                          ? 'bg-gradient-to-t from-emerald-500 via-green-400 to-emerald-300' 
                                          : week.averageScore >= 60 
                                          ? 'bg-gradient-to-t from-amber-500 via-yellow-400 to-amber-300'
                                          : 'bg-gradient-to-t from-rose-500 via-red-400 to-rose-300'
                                      } ${isLatest ? 'ring-2 ring-emerald-300 ring-opacity-50' : ''}`}
                                      style={{ minHeight: '8px' }}
                                    >
                                      {/* Glossy effect */}
                                      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-white/40 rounded-t-lg"></div>
                                      
                                      {/* Shimmer effect on hover */}
                                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out"></div>
                                    </motion.div>
                                    
                                    {/* Score Label */}
                                    <motion.div
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: 0.5 + index * 0.1 }}
                                      className="mt-1 text-xs font-bold text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                    >
                                      {week.averageScore}%
                                    </motion.div>
                                    
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                      Week {index + 1}: {week.averageScore}%
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-slate-900"></div>
                                    </div>
                                  </div>
                                     );
                                   })}
                              
                              {/* Add some visual interest with floating particles */}
                              <div className="absolute inset-0 pointer-events-none">
                                {[...Array(3)].map((_, i) => (
                                  <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ 
                                      opacity: [0, 0.6, 0],
                                      scale: [0, 1, 0],
                                      y: [0, -20, -40]
                                    }}
                                    transition={{
                                      duration: 2,
                                      delay: 1 + i * 0.3,
                                      repeat: Infinity,
                                      repeatDelay: 3
                                    }}
                                    className="absolute w-1 h-1 bg-emerald-400 rounded-full"
                                    style={{
                                      left: `${20 + i * 30}%`,
                                      bottom: '10%'
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                         </div>
                       </div>
                      
                        {/* Compact Weekly Details */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-2 custom-scrollbar max-h-[320px]">
                        {userStats.weeklyProgress.map((week, index) => {
                          const weekDate = new Date(week.week);
                          const isLatest = index === userStats.weeklyProgress.length - 1;
                          
                          return (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
                                className={`group relative p-3 rounded-xl border transition-all duration-300 hover:shadow-md hover:scale-[1.01] ${
                                isLatest 
                                    ? 'bg-gradient-to-r from-emerald-50/80 to-green-50/80 border-emerald-200 shadow-sm' 
                                    : 'bg-gradient-to-r from-white/90 to-slate-50/80 border-slate-200 hover:border-emerald-300'
                                }`}
                              >
                                {/* Compact Week Header */}
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <div className={`w-2 h-6 rounded-full ${
                                      week.averageScore >= 80 ? 'bg-gradient-to-b from-emerald-400 to-green-500' :
                                      week.averageScore >= 60 ? 'bg-gradient-to-b from-yellow-400 to-amber-500' :
                                      'bg-gradient-to-b from-red-400 to-rose-500'
                                  }`}></div>
                                  
                                  <div>
                                      <p className="font-bold text-slate-800 text-sm flex items-center">
                                        {weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      {isLatest && (
                                          <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                                          Latest
                            </span>
                                      )}
                                    </p>
                                      <p className="text-xs text-slate-500">
                                        {weekDate.toLocaleDateString('en-US', { year: 'numeric' })}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="text-right">
                                    <div className={`inline-flex items-center px-2 py-1 rounded-lg text-sm font-bold shadow-sm ${
                                      week.averageScore >= 80 ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-200' :
                                      week.averageScore >= 60 ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border border-yellow-200' :
                                      'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200'
                                  }`}>
                                    {week.averageScore}%
                                  </div>
                                </div>
                              </div>
                              
                                {/* Compact Metrics */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="flex items-center space-x-1">
                                      <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
                                        <span className="text-xs font-bold text-emerald-700">{week.tests}</span>
                                      </div>
                                      <span className="text-xs text-slate-500">tests</span>
                                </div>
                                
                                    <div className="flex items-center space-x-1">
                                      <div className="text-sm font-bold text-emerald-600">{week.averageScore}%</div>
                                      <span className="text-xs text-slate-500">avg</span>
                                </div>
                                
                                    {index > 0 && (
                                      <div className="flex items-center space-x-1">
                                        <span className={`text-sm font-bold ${
                                        week.averageScore > userStats.weeklyProgress[index - 1].averageScore 
                                            ? 'text-emerald-600' : week.averageScore < userStats.weeklyProgress[index - 1].averageScore 
                                          ? 'text-red-600' : 'text-slate-600'
                                      }`}>
                                        {week.averageScore > userStats.weeklyProgress[index - 1].averageScore ? '↗' :
                                         week.averageScore < userStats.weeklyProgress[index - 1].averageScore ? '↘' : '→'}
                                        {Math.abs(week.averageScore - userStats.weeklyProgress[index - 1].averageScore)}%
                            </span>
                                        <span className="text-xs text-slate-500">change</span>
                          </div>
                                    )}
                              </div>
                              
                                  <div className="flex-1 max-w-24 ml-3">
                                    <div className="relative h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${week.averageScore}%` }}
                                    transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                                        className={`absolute h-full rounded-full shadow-sm ${
                                          week.averageScore >= 80 ? 'bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500' :
                                          week.averageScore >= 60 ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500' :
                                          'bg-gradient-to-r from-red-400 via-rose-400 to-red-500'
                              }`}
                            />
                          </div>
                        </div>
                              </div>
                              
                                {/* Subtle Hover Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-green-500/5 to-teal-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            </motion.div>
                          );
                        })}
                      </div>
                      
                      {/* Modern Action Footer */}
                      <div className="p-4 bg-gradient-to-r from-emerald-50/80 to-green-50/80 backdrop-blur-sm border-t border-emerald-200/50">
                      <motion.div
                          initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                          className="grid grid-cols-2 gap-3 text-center"
                      >
                          <div>
                            <div className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                              {userStats.weeklyProgress.length > 1 && userStats.weeklyProgress[userStats.weeklyProgress.length - 1].averageScore > userStats.weeklyProgress[0].averageScore ? '📈' : 
                               userStats.weeklyProgress.length > 1 && userStats.weeklyProgress[userStats.weeklyProgress.length - 1].averageScore < userStats.weeklyProgress[0].averageScore ? '📉' : '📊'}
                            </div>
                            <div className="text-xs font-medium text-slate-700">Trend</div>
                            <div className="text-xs text-slate-500">
                              {userStats.weeklyProgress.length > 1 ? (
                                userStats.weeklyProgress[userStats.weeklyProgress.length - 1].averageScore > userStats.weeklyProgress[0].averageScore ? 'Improving' :
                                userStats.weeklyProgress[userStats.weeklyProgress.length - 1].averageScore < userStats.weeklyProgress[0].averageScore ? 'Declining' :
                                'Stable'
                              ) : 'Not enough data'}
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-lg font-bold text-emerald-600">
                              {Math.round(userStats.weeklyProgress.reduce((sum, week) => sum + week.averageScore, 0) / userStats.weeklyProgress.length)}%
                            </div>
                            <div className="text-xs font-medium text-slate-700">Average</div>
                            <div className="text-xs text-slate-500">
                              {userStats.weeklyProgress.length} weeks
                          </div>
                        </div>
                      </motion.div>
                    </div>
                      </>
                  ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-6">
                      <motion.div
                          initial={{ scale: 0, rotate: -10 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.6, type: "spring" }}
                          className="relative mb-4"
                        >
                          <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 via-green-100 to-teal-100 rounded-2xl flex items-center justify-center shadow-lg">
                            <BarChart3 className="w-10 h-10 text-emerald-500" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
                            <span className="text-xs">📊</span>
                          </div>
                      </motion.div>
                        <h4 className="font-bold text-slate-800 mb-2 text-lg">Track Your Progress</h4>
                        <p className="text-slate-500 text-sm mb-6 text-center max-w-sm leading-relaxed">
                          Complete tests to unlock detailed weekly progress analytics and performance insights
                        </p>
                      <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/upcoming-tests')}
                          className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold text-sm rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
                      >
                          <span>Start Your First Test</span>
                          <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Practice Sets */}
            <motion.section id="practice-sets-section" variants={itemVariants} className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center">
                  <BookOpen className="w-6 h-6 mr-2 text-purple-500" />
                  Practice Sets
                </h2>
                {livePracticeSets.length > 0 && (
                  <span className="text-sm text-slate-500 bg-white/50 px-3 py-1 rounded-full">
                    {livePracticeSets.length} available
                  </span>
                )}
              </div>
              
              {loadingPracticeSets ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 animate-pulse">
                      <div className="w-12 h-12 bg-slate-200 rounded-xl mb-4"></div>
                      <div className="h-5 bg-slate-200 rounded mb-2"></div>
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : livePracticeSets.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {livePracticeSets.slice(0, 8).map((practiceSet, index) => {
                    const IconComponent = getPracticeSetIcon(practiceSet.domains);
                    const colorClass = getDomainColor(practiceSet.domains);
                    
                    return (
                      <motion.div
                        key={practiceSet.id}
                        variants={itemVariants}
                        whileHover={{ y: -4, scale: 1.02 }}
                        className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20 hover:shadow-lg transition-all duration-300 group cursor-pointer"
                        onClick={() => handleStartPracticeSet(practiceSet)}
                      >
                        <div className={`w-12 h-12 bg-gradient-to-br ${colorClass} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        
                        <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2" title={practiceSet.title}>
                          {practiceSet.title}
                        </h3>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-slate-600">
                            <Clock className="w-4 h-4 mr-1 text-slate-400" />
                            <span>{practiceSet.estimatedTime} mins</span>
                          </div>
                          
                          <div className="flex items-center text-sm text-slate-600">
                            <FileText className="w-4 h-4 mr-1 text-slate-400" />
                            <span>{practiceSet.questionsCount} questions</span>
                          </div>
                          
                          {practiceSet.domains && practiceSet.domains.length > 0 && (
                            <div className="flex items-center text-sm text-blue-600">
                              <BookOpen className="w-4 h-4 mr-1" />
                              <span className="truncate">{practiceSet.domains.join(', ')}</span>
                            </div>
                          )}
                        </div>
                        
                        {practiceSet.stats.attemptCount > 0 && (
                          <div className="flex items-center text-xs text-slate-500 mb-2">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            <span>{practiceSet.stats.attemptCount} attempts</span>
                            {practiceSet.stats.averageScore > 0 && (
                              <span className="ml-2">• Avg: {Math.round(practiceSet.stats.averageScore)}%</span>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            practiceSet.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                            practiceSet.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            practiceSet.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {practiceSet.difficulty || 'Mixed'}
                          </span>
                          
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all duration-200" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <motion.div
                  variants={itemVariants}
                  className="text-center py-12 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/20"
                >
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500 mb-2">No practice sets available</p>
                  <p className="text-sm text-slate-400">Practice sets created by instructors will appear here</p>
                </motion.div>
              )}
            </motion.section>

            {/* Upcoming Tests */}
            <motion.section variants={itemVariants}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center">
                  <Calendar className="w-6 h-6 mr-2 text-orange-500" />
                  Upcoming Tests
                </h2>
                {upcomingTests.length > 0 && (
                  <span className="text-sm text-slate-500 bg-white/50 px-3 py-1 rounded-full">
                    {upcomingTests.length} scheduled
                  </span>
                )}
              </div>
              
              {loadingUpcomingTests ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 animate-pulse">
                      <div className="w-12 h-12 bg-slate-200 rounded-xl mb-4"></div>
                      <div className="h-5 bg-slate-200 rounded mb-2"></div>
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : upcomingTests.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingTests.slice(0, 6).map((test) => (
                    <motion.div
                      key={test.id}
                      variants={itemVariants}
                      whileHover={{ y: -2, scale: 1.01 }}
                      className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">
                          {test.is_free ? 'Free' : `$${test.price}`}
                        </span>
                      </div>
                      
                      <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">
                        {test.name}
                      </h3>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-slate-600">
                          <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                          <span>
                            {new Date(test.available_from).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-sm text-slate-600">
                          <Clock className="w-4 h-4 mr-2 text-slate-400" />
                          <span>{test.duration_minutes} minutes</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-slate-600">
                          <FileText className="w-4 h-4 mr-2 text-slate-400" />
                          <span>{test.total_questions} questions</span>
                        </div>
                      </div>
                      
                      <button className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg text-sm font-medium hover:from-orange-600 hover:to-amber-700 transition-all duration-200 shadow-sm hover:shadow-md">
                          Register Now
                        </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  variants={itemVariants}
                  className="text-center py-12 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/20"
                >
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500 mb-2">No upcoming tests scheduled</p>
                  <p className="text-sm text-slate-400">Check back later for new test announcements</p>
                </motion.div>
              )}
            </motion.section>
          </motion.div>
        </main>

        <Footer />
        <AIChatBot />
      </div>
    </ProtectedRoute>
  );
} 