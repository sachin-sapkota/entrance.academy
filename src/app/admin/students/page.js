'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  Search,
  Edit,
  Trash2,
  UserCheck,
  Calendar,
  Award,
  Activity,
  Crown,
  CreditCard,
  Check,
  X,
  DollarSign
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function StudentsManagement() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/admin/students');
      const data = await response.json();
      
      if (data.success) {
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (studentId, newStatus) => {
    setUpdating(studentId);
    try {
      const response = await fetch('/api/admin/students', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: studentId,
          paymentStatus: newStatus,
          adminEmail: 'admin@example.com' // In real app, get from auth context
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setStudents(prev => prev.map(student => 
          student.id === studentId 
            ? { ...student, ...data.student }
            : student
        ));
        alert(`Student payment status updated to ${newStatus.toUpperCase()}`);
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status');
    } finally {
      setUpdating(null);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (student.name && student.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === 'all' || student.role === filterRole;
    const matchesPayment = filterPayment === 'all' || student.paymentStatus === filterPayment;
    return matchesSearch && matchesRole && matchesPayment;
  });

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'student': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentColor = (status) => {
    switch (status) {
      case 'pro': return 'bg-yellow-100 text-yellow-800';
      case 'free': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading students...</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Students Management</h1>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-right text-sm">
                  <div className="font-medium text-gray-900">{filteredStudents.length} Students</div>
                  <div className="text-gray-500">
                    {students.filter(s => s.paymentStatus === 'pro').length} Pro • {students.filter(s => s.paymentStatus === 'free').length} Free
                  </div>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 mb-6 border border-gray-200"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 placeholder-gray-600"
                  />
                </div>
                
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="admin">Admins</option>
                </select>

                <select
                  value={filterPayment}
                  onChange={(e) => setFilterPayment(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                >
                  <option value="all">All Plans</option>
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
              
              <div className="text-sm text-gray-600">
                Showing {filteredStudents.length} of {students.length} students
              </div>
            </div>
          </motion.div>

          {/* Students List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            {filteredStudents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-4 px-6 font-medium text-gray-900">Student</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900">Role</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900">Plan</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900">Joined</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900">Performance</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredStudents.map((student, index) => (
                      <motion.tr
                        key={student.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              student.paymentStatus === 'pro' ? 'bg-yellow-100' : 'bg-blue-100'
                            }`}>
                              {student.paymentStatus === 'pro' ? (
                                <Crown className="w-5 h-5 text-yellow-600" />
                              ) : (
                                <Users className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {student.name || 'Unknown'}
                              </div>
                              <div className="text-sm text-gray-600">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(student.role)}`}>
                            {student.role}
                          </span>
                        </td>
                        
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentColor(student.paymentStatus)}`}>
                              {student.paymentStatus === 'pro' ? '👑 PRO' : '🆓 FREE'}
                            </span>
                            {student.payment_confirmed_at && (
                              <div className="text-xs text-gray-500">
                                Confirmed: {new Date(student.payment_confirmed_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(student.created_at).toLocaleDateString()}</span>
                          </div>
                        </td>
                        
                        <td className="py-4 px-6">
                          {student.role === 'student' ? (
                            <div className="text-sm">
                              <div className="flex items-center space-x-2 text-gray-900">
                                <Award className="w-4 h-4" />
                                <span>{student.tests_completed || 0} tests</span>
                              </div>
                              <div className="text-gray-600">
                                Avg: {student.avg_score || 0}%
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">N/A</span>
                          )}
                        </td>
                        
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            {student.role === 'student' && (
                              <>
                                {student.paymentStatus === 'free' ? (
                                  <button
                                    onClick={() => updatePaymentStatus(student.id, 'pro')}
                                    disabled={updating === student.id}
                                    className="flex items-center space-x-1 px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg text-xs font-medium disabled:opacity-50"
                                    title="Upgrade to Pro"
                                  >
                                    <Crown className="w-3 h-3" />
                                    <span>{updating === student.id ? 'Updating...' : 'Make Pro'}</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => updatePaymentStatus(student.id, 'free')}
                                    disabled={updating === student.id}
                                    className="flex items-center space-x-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium disabled:opacity-50"
                                    title="Downgrade to Free"
                                  >
                                    <X className="w-3 h-3" />
                                    <span>{updating === student.id ? 'Updating...' : 'Make Free'}</span>
                                  </button>
                                )}
                              </>
                            )}
                            
                            <button
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit student"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Delete student"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                <p className="text-gray-600">
                  {searchTerm || filterRole !== 'all' || filterPayment !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'No students have registered yet'
                  }
                </p>
              </div>
            )}
          </motion.div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {students.filter(s => s.role === 'student').length}
                  </div>
                  <div className="text-sm text-gray-600">Total Students</div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
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
                  <div className="text-2xl font-bold text-yellow-600">
                    {students.filter(s => s.paymentStatus === 'pro').length}
                  </div>
                  <div className="text-sm text-gray-600">Pro Users</div>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Crown className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-600">
                    {students.filter(s => s.paymentStatus === 'free').length}
                  </div>
                  <div className="text-sm text-gray-600">Free Users</div>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round((students.filter(s => s.paymentStatus === 'pro').length / students.filter(s => s.role === 'student').length) * 100) || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Conversion Rate</div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 