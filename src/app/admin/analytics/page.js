'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  Clock,
  Target,
  DollarSign,
  Award,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';
import AdminNavbar from '../../components/AdminNavbar';

export default function AdminAnalytics() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(false);

  // Mock analytics data
  const [analyticsData] = useState({
    overview: {
      totalUsers: 1247,
      totalTests: 892,
      totalQuestions: 15648,
      totalRevenue: 18750,
      averageScore: 73.5,
      completionRate: 87.3,
      conversionRate: 12.8,
      activeUsers: 324
    },
    trends: {
      userGrowth: +15.3,
      testGrowth: +23.7,
      revenueGrowth: +31.2,
      scoreImprovement: +4.1
    },
    userActivity: [
      { date: '2024-01-01', users: 156, tests: 89, newUsers: 12 },
      { date: '2024-01-02', users: 178, tests: 102, newUsers: 18 },
      { date: '2024-01-03', users: 203, tests: 134, newUsers: 25 },
      { date: '2024-01-04', users: 189, tests: 118, newUsers: 14 },
      { date: '2024-01-05', users: 245, tests: 167, newUsers: 31 },
      { date: '2024-01-06', users: 267, tests: 189, newUsers: 22 },
      { date: '2024-01-07', users: 289, tests: 203, newUsers: 19 }
    ],
    domainPerformance: [
      { domain: 'Mathematics', tests: 245, avgScore: 78.2, participants: 156, improvement: +5.3 },
      { domain: 'Physics', tests: 189, avgScore: 71.8, participants: 134, improvement: +2.1 },
      { domain: 'Chemistry', tests: 167, avgScore: 69.4, participants: 112, improvement: -1.2 },
      { domain: 'Biology', tests: 134, avgScore: 75.6, participants: 98, improvement: +3.7 },
      { domain: 'English', tests: 123, avgScore: 82.1, participants: 87, improvement: +6.2 },
      { domain: 'History', tests: 89, avgScore: 67.3, participants: 65, improvement: +1.8 }
    ],
    testCompletion: {
      completed: 87.3,
      incomplete: 8.7,
      abandoned: 4.0
    },
    userTypes: {
      free: 73.2,
      pro: 26.8
    },
    popularTests: [
      { name: 'Mathematics Mock Test 1', attempts: 342, avgScore: 76.5, completion: 92.1 },
      { name: 'Physics Practice Set', attempts: 289, avgScore: 68.3, completion: 88.7 },
      { name: 'Chemistry Advanced', attempts: 234, avgScore: 71.2, completion: 85.4 },
      { name: 'Biology Basics', attempts: 198, avgScore: 79.8, completion: 94.3 },
      { name: 'English Grammar', attempts: 167, avgScore: 84.1, completion: 96.2 }
    ],
    revenueData: [
      { month: 'Aug', revenue: 12400, subscriptions: 89 },
      { month: 'Sep', revenue: 14200, subscriptions: 102 },
      { month: 'Oct', revenue: 15800, subscriptions: 118 },
      { month: 'Nov', revenue: 17300, subscriptions: 134 },
      { month: 'Dec', revenue: 19600, subscriptions: 156 },
      { month: 'Jan', revenue: 21400, subscriptions: 178 }
    ]
  });

  const timeRanges = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 3 months' },
    { value: '1y', label: 'Last year' }
  ];

  const handleExport = () => {
    setLoading(true);
    // Simulate export process
    setTimeout(() => {
      setLoading(false);
      alert('Analytics data exported successfully!');
    }, 2000);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <div className="w-4 h-4" />;
  };

  const renderMiniChart = (data, color = 'blue') => (
    <div className="flex items-end space-x-1 h-8">
      {data.slice(-7).map((point, index) => (
        <div
          key={index}
          className={`w-2 bg-${color}-500 rounded-t`}
          style={{ height: `${(point.users / Math.max(...data.map(d => d.users))) * 100}%` }}
        />
      ))}
    </div>
  );

  return (
    <ProtectedRoute>
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
                <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              </div>
              
              <div className="flex items-center space-x-3">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                >
                  {timeRanges.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={handleExport}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{loading ? 'Exporting...' : 'Export'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                {getTrendIcon(analyticsData.trends.userGrowth)}
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.overview.totalUsers)}</div>
                <div className="text-sm text-gray-600">Total Users</div>
                <div className="text-xs text-green-600">+{analyticsData.trends.userGrowth}% vs last period</div>
              </div>
              {renderMiniChart(analyticsData.userActivity, 'blue')}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
                {getTrendIcon(analyticsData.trends.testGrowth)}
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.overview.totalTests)}</div>
                <div className="text-sm text-gray-600">Tests Completed</div>
                <div className="text-xs text-green-600">+{analyticsData.trends.testGrowth}% vs last period</div>
              </div>
              {renderMiniChart(analyticsData.userActivity.map(d => ({ users: d.tests })), 'green')}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-yellow-600" />
                </div>
                {getTrendIcon(analyticsData.trends.scoreImprovement)}
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-gray-900">{analyticsData.overview.averageScore}%</div>
                <div className="text-sm text-gray-600">Average Score</div>
                <div className="text-xs text-green-600">+{analyticsData.trends.scoreImprovement}% improvement</div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${analyticsData.overview.averageScore}%` }}
                  ></div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                {getTrendIcon(analyticsData.trends.revenueGrowth)}
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-gray-900">${formatNumber(analyticsData.overview.totalRevenue)}</div>
                <div className="text-sm text-gray-600">Total Revenue</div>
                <div className="text-xs text-green-600">+{analyticsData.trends.revenueGrowth}% vs last period</div>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                {analyticsData.overview.conversionRate}% conversion rate
              </div>
            </motion.div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* User Activity Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">User Activity</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Active Users</span>
                  <div className="w-3 h-3 bg-green-500 rounded ml-4"></div>
                  <span>Tests Taken</span>
                </div>
              </div>
              
              <div className="h-64 flex items-end justify-between space-x-2">
                {analyticsData.userActivity.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center space-y-1">
                    <div className="flex flex-col items-end w-full space-y-1">
                      <div 
                        className="w-full bg-blue-500 rounded-t"
                        style={{ height: `${(day.users / 300) * 100}%` }}
                        title={`${day.users} users`}
                      ></div>
                      <div 
                        className="w-full bg-green-500 rounded-t"
                        style={{ height: `${(day.tests / 250) * 80}%` }}
                        title={`${day.tests} tests`}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Revenue Chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Revenue Growth</h3>
                <div className="text-sm text-green-600 font-medium">+{analyticsData.trends.revenueGrowth}%</div>
              </div>
              
              <div className="h-64 flex items-end justify-between space-x-3">
                {analyticsData.revenueData.map((month, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center space-y-2">
                    <div 
                      className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t"
                      style={{ height: `${(month.revenue / 25000) * 100}%` }}
                      title={`$${month.revenue}`}
                    ></div>
                    <div className="text-xs text-gray-500">{month.month}</div>
                    <div className="text-xs text-gray-700 font-medium">${formatNumber(month.revenue)}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Domain Performance & Test Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Domain Performance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Domain Performance</h3>
              
              <div className="space-y-4">
                {analyticsData.domainPerformance.map((domain, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{domain.domain}</div>
                        <div className="text-sm text-gray-600">{domain.participants} participants</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Tests</div>
                        <div className="font-semibold text-gray-900">{domain.tests}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Avg Score</div>
                        <div className={`font-semibold ${getScoreColor(domain.avgScore)}`}>
                          {domain.avgScore}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Trend</div>
                        <div className={`font-semibold text-sm ${domain.improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {domain.improvement > 0 ? '+' : ''}{domain.improvement}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-xl p-6 border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Stats</h3>
              
              <div className="space-y-6">
                {/* Test Completion */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Test Completion</span>
                    <span className="text-sm font-medium text-gray-900">{analyticsData.testCompletion.completed}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${analyticsData.testCompletion.completed}%` }}
                    ></div>
                  </div>
                </div>

                {/* User Types */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-900">User Distribution</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        <span className="text-sm text-gray-600">Free Users</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{analyticsData.userTypes.free}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Pro Users</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{analyticsData.userTypes.pro}%</span>
                    </div>
                  </div>
                </div>

                {/* Active Users */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Eye className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-900">{analyticsData.overview.activeUsers}</div>
                      <div className="text-sm text-blue-700">Active Users</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Popular Tests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-xl p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Popular Tests</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Test Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Attempts</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Avg Score</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Completion</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analyticsData.popularTests.map((test, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{test.name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-900">{test.attempts}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className={`font-medium ${getScoreColor(test.avgScore)}`}>
                          {test.avgScore}%
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${test.completion}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{test.completion}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {test.completion >= 90 ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : test.completion >= 80 ? (
                          <AlertCircle className="w-5 h-5 text-yellow-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 