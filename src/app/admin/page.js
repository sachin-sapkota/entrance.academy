'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  Users,
  BookOpen,
  BarChart3,
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Database,
  Activity,
  LogOut,
  User
} from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminNavbar from '../components/AdminNavbar';
import { signOutUser } from '../../store/slices/authSlice';

export default function AdminDashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, profile } = useSelector((state) => state.auth);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalPracticeSets: 0,
    totalQuestions: 0,
    activeTests: 0,
    todayAttempts: 0,
    avgScore: 0
  });
  const [recentPracticeSets, setRecentPracticeSets] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard statistics
      const [studentsRes, practiceSetsRes, questionsRes] = await Promise.all([
        fetch('/api/admin/students'),
        fetch('/api/admin/practice-sets'),
        fetch('/api/admin/questions')
      ]);

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStats(prev => ({ ...prev, totalStudents: studentsData.students?.length || 0 }));
        setRecentStudents(studentsData.students?.slice(0, 5) || []);
      }

      if (practiceSetsRes.ok) {
        const practiceSetsData = await practiceSetsRes.json();
        setStats(prev => ({ ...prev, totalPracticeSets: practiceSetsData.practiceSets?.length || 0 }));
        setRecentPracticeSets(practiceSetsData.practiceSets?.slice(0, 5) || []);
      }

      if (questionsRes.ok) {
        const questionsData = await questionsRes.json();
        setStats(prev => ({ ...prev, totalQuestions: questionsData.questions?.length || 0 }));
      }

      // Mock additional stats for now
      setStats(prev => ({
        ...prev,
        activeTests: 3,
        todayAttempts: 24,
        avgScore: 78.5
      }));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(signOutUser());
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading admin dashboard...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const statCards = [
    {
      title: "Total Students",
      value: stats.totalStudents,
      icon: Users,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      change: "+12%"
    },
    {
      title: "Practice Sets",
      value: stats.totalPracticeSets,
      icon: BookOpen,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      change: "+8%"
    },
    {
      title: "Total Questions",
      value: stats.totalQuestions,
      icon: FileText,
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
      change: "+15%"
    },
    {
      title: "Active Tests",
      value: stats.activeTests,
      icon: Activity,
      color: "bg-orange-500",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
      change: "+5%"
    },
    {
      title: "Today's Attempts",
      value: stats.todayAttempts,
      icon: TrendingUp,
      color: "bg-red-500",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
      change: "+25%"
    },
    {
      title: "Average Score",
      value: `${stats.avgScore}%`,
      icon: BarChart3,
      color: "bg-indigo-500",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600",
      change: "+3%"
    }
  ];

  const quickActions = [
    {
      title: "Subdomain Management",
      description: "Manage questions by subdomain and importance points",
      icon: BookOpen,
      color: "bg-emerald-600",
      action: () => router.push('/admin/subdomains')
    },
    {
      title: "Create Questions",
      description: "Add individual questions or bulk import question banks by subdomain",
      icon: Plus,
      color: "bg-blue-600",
      action: () => router.push('/admin/questions/create')
    },
    {
      title: "Question Bank Management",
      description: "Manage question banks organized by domain and subdomain",
      icon: Database,
      color: "bg-emerald-600",
      action: () => router.push('/admin/questions')
    },
    {
      title: "Create Practice Set",
      description: "Add new questions and create a practice set",
      icon: FileText,
      color: "bg-cyan-600",
      action: () => router.push('/admin/practice-sets/create')
    },
    {
      title: "Schedule Tests",
      description: "Create upcoming tests to notify students",
      icon: Clock,
      color: "bg-orange-600",
      action: () => router.push('/admin/upcoming-tests')
    },
    {
      title: "Test Configurations",
      description: "Create and manage MBBS test templates for practice set generation",
      icon: Settings,
      color: "bg-purple-600",
      action: () => router.push('/admin/test-configurations')
    },
    {
      title: "Manage Students",
      description: "View and manage registered students",
      icon: Users,
      color: "bg-green-600",
      action: () => router.push('/admin/students')
    },
    {
      title: "View Analytics",
      description: "Check performance and usage statistics",
      icon: BarChart3,
      color: "bg-purple-600",
      action: () => router.push('/admin/analytics')
    },
    {
      title: "System Settings",
      description: "Configure platform settings",
      icon: Settings,
      color: "bg-gray-600",
      action: () => router.push('/admin/settings')
    }
  ];

  return (
    <ProtectedRoute adminOnly={true}>
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar />
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`${stat.bgColor} rounded-xl p-6 border border-gray-200`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-sm font-medium ${stat.textColor}`}>{stat.change}</span>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.title}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                onClick={action.action}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 text-left"
              >
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-gray-600 text-sm">{action.description}</p>
              </motion.button>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Practice Sets */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="bg-white rounded-xl p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Practice Sets</h3>
                <button
                  onClick={() => router.push('/admin/practice-sets')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {recentPracticeSets.length > 0 ? recentPracticeSets.map((set, index) => (
                  <div key={set.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{set.title}</div>
                        <div className="text-sm text-gray-600">{set.questionsCount || 0} questions</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => router.push(`/admin/practice-sets/preview/${set.id}`)}
                        className="p-2 text-gray-400 hover:text-blue-600"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/admin/practice-sets/edit/${set.id}`)}
                        className="p-2 text-gray-400 hover:text-green-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No practice sets created yet</p>
                    <button
                      onClick={() => router.push('/admin/practice-sets/create')}
                      className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Create your first practice set
                    </button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Recent Students */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1.1 }}
              className="bg-white rounded-xl p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Students</h3>
                <button
                  onClick={() => router.push('/admin/students')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {recentStudents.length > 0 ? recentStudents.map((student, index) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{student.email}</div>
                        <div className="text-sm text-gray-600">
                          Joined {new Date(student.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      student.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {student.role}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No students registered yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}