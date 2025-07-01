'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Globe,
  Users,
  Mail,
  Shield,
  Bell,
  CreditCard,
  BookOpen
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function AdminSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    // General Settings
    platformName: 'MCQ Platform',
    platformDescription: 'Advanced Multiple Choice Question Testing Platform',
    adminEmail: 'admin@mcqplatform.com',
    timeZone: 'UTC',
    defaultLanguage: 'en',
    
    // Test Configuration
    defaultTestDuration: 120,
    defaultQuestionsPerPage: 20,
    negativeMarkingEnabled: true,
    negativeMarkingRatio: 0.25,
    shuffleQuestions: true,
    shuffleOptions: true,
    showCorrectAnswers: true,
    allowRetakes: true,
    maxRetakeAttempts: 3,
    
    // User Management
    allowSelfRegistration: true,
    requireEmailVerification: true,
    defaultUserRole: 'student',
    autoApproveUsers: false,
    sessionTimeout: 60,
    
    // Payment Settings
    enablePayments: true,
    currency: 'USD',
    freeTestLimit: 3,
    proMonthlyPrice: 29.99,
    proYearlyPrice: 299.99,
    
    // Email Settings
    smtpEnabled: false,
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    fromEmail: 'noreply@mcqplatform.com',
    
    // Security Settings
    passwordMinLength: 8,
    requireSpecialChars: true,
    sessionSecure: true,
    twoFactorEnabled: false,
    loginAttemptLimit: 5,
    
    // Notification Settings
    emailNotifications: true,
    testCompletionEmails: true,
    weeklyReports: true,
    systemAlerts: true
  });

  const tabs = [
    { id: 'general', name: 'General', icon: Globe },
    { id: 'tests', name: 'Test Config', icon: BookOpen },
    { id: 'users', name: 'User Management', icon: Users },
    { id: 'payments', name: 'Payments', icon: CreditCard },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell }
  ];

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

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
                <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 border border-gray-200 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span className="font-medium">{tab.name}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl p-6 border border-gray-200"
              >
                {/* General Settings */}
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <Globe className="w-6 h-6 text-blue-600" />
                      <h2 className="text-xl font-semibold text-gray-900">General Settings</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Platform Name
                        </label>
                        <input
                          type="text"
                          value={settings.platformName}
                          onChange={(e) => handleInputChange('platformName', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Admin Email
                        </label>
                        <input
                          type="email"
                          value={settings.adminEmail}
                          onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Time Zone
                        </label>
                        <select
                          value={settings.timeZone}
                          onChange={(e) => handleInputChange('timeZone', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Default Language
                        </label>
                        <select
                          value={settings.defaultLanguage}
                          onChange={(e) => handleInputChange('defaultLanguage', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Platform Description
                      </label>
                      <textarea
                        value={settings.platformDescription}
                        onChange={(e) => handleInputChange('platformDescription', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {/* Test Configuration */}
                {activeTab === 'tests' && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <BookOpen className="w-6 h-6 text-green-600" />
                      <h2 className="text-xl font-semibold text-gray-900">Test Configuration</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Default Test Duration (minutes)
                        </label>
                        <input
                          type="number"
                          value={settings.defaultTestDuration}
                          onChange={(e) => handleInputChange('defaultTestDuration', parseInt(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Questions Per Page
                        </label>
                        <input
                          type="number"
                          value={settings.defaultQuestionsPerPage}
                          onChange={(e) => handleInputChange('defaultQuestionsPerPage', parseInt(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Negative Marking Ratio
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={settings.negativeMarkingRatio}
                          onChange={(e) => handleInputChange('negativeMarkingRatio', parseFloat(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Retake Attempts
                        </label>
                        <input
                          type="number"
                          value={settings.maxRetakeAttempts}
                          onChange={(e) => handleInputChange('maxRetakeAttempts', parseInt(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="negativeMarking"
                          checked={settings.negativeMarkingEnabled}
                          onChange={(e) => handleInputChange('negativeMarkingEnabled', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="negativeMarking" className="text-sm font-medium text-gray-700">
                          Enable Negative Marking
                        </label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="shuffleQuestions"
                          checked={settings.shuffleQuestions}
                          onChange={(e) => handleInputChange('shuffleQuestions', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="shuffleQuestions" className="text-sm font-medium text-gray-700">
                          Shuffle Questions
                        </label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="shuffleOptions"
                          checked={settings.shuffleOptions}
                          onChange={(e) => handleInputChange('shuffleOptions', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="shuffleOptions" className="text-sm font-medium text-gray-700">
                          Shuffle Answer Options
                        </label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="showCorrectAnswers"
                          checked={settings.showCorrectAnswers}
                          onChange={(e) => handleInputChange('showCorrectAnswers', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="showCorrectAnswers" className="text-sm font-medium text-gray-700">
                          Show Correct Answers After Test
                        </label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="allowRetakes"
                          checked={settings.allowRetakes}
                          onChange={(e) => handleInputChange('allowRetakes', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="allowRetakes" className="text-sm font-medium text-gray-700">
                          Allow Test Retakes
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* User Management */}
                {activeTab === 'users' && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <Users className="w-6 h-6 text-purple-600" />
                      <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Default User Role
                        </label>
                        <select
                          value={settings.defaultUserRole}
                          onChange={(e) => handleInputChange('defaultUserRole', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                        >
                          <option value="student">Student</option>
                          <option value="instructor">Instructor</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Session Timeout (minutes)
                        </label>
                        <input
                          type="number"
                          value={settings.sessionTimeout}
                          onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="allowSelfRegistration"
                          checked={settings.allowSelfRegistration}
                          onChange={(e) => handleInputChange('allowSelfRegistration', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="allowSelfRegistration" className="text-sm font-medium text-gray-700">
                          Allow Self Registration
                        </label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="requireEmailVerification"
                          checked={settings.requireEmailVerification}
                          onChange={(e) => handleInputChange('requireEmailVerification', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="requireEmailVerification" className="text-sm font-medium text-gray-700">
                          Require Email Verification
                        </label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="autoApproveUsers"
                          checked={settings.autoApproveUsers}
                          onChange={(e) => handleInputChange('autoApproveUsers', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="autoApproveUsers" className="text-sm font-medium text-gray-700">
                          Auto-approve New Users
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Settings */}
                {activeTab === 'payments' && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <CreditCard className="w-6 h-6 text-yellow-600" />
                      <h2 className="text-xl font-semibold text-gray-900">Payment Settings</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Currency
                        </label>
                        <select
                          value={settings.currency}
                          onChange={(e) => handleInputChange('currency', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="INR">INR (₹)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Free Test Limit
                        </label>
                        <input
                          type="number"
                          value={settings.freeTestLimit}
                          onChange={(e) => handleInputChange('freeTestLimit', parseInt(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pro Monthly Price
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={settings.proMonthlyPrice}
                          onChange={(e) => handleInputChange('proMonthlyPrice', parseFloat(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pro Yearly Price
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={settings.proYearlyPrice}
                          onChange={(e) => handleInputChange('proYearlyPrice', parseFloat(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="enablePayments"
                        checked={settings.enablePayments}
                        onChange={(e) => handleInputChange('enablePayments', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="enablePayments" className="text-sm font-medium text-gray-700">
                        Enable Payment System
                      </label>
                    </div>
                  </div>
                )}

                {/* Email Settings */}
                {activeTab === 'email' && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <Mail className="w-6 h-6 text-red-600" />
                      <h2 className="text-xl font-semibold text-gray-900">Email Settings</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Host
                        </label>
                        <input
                          type="text"
                          value={settings.smtpHost}
                          onChange={(e) => handleInputChange('smtpHost', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="smtp.gmail.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Port
                        </label>
                        <input
                          type="number"
                          value={settings.smtpPort}
                          onChange={(e) => handleInputChange('smtpPort', parseInt(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          From Email
                        </label>
                        <input
                          type="email"
                          value={settings.fromEmail}
                          onChange={(e) => handleInputChange('fromEmail', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="smtpEnabled"
                        checked={settings.smtpEnabled}
                        onChange={(e) => handleInputChange('smtpEnabled', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="smtpEnabled" className="text-sm font-medium text-gray-700">
                        Enable SMTP Email Sending
                      </label>
                    </div>
                  </div>
                )}

                {/* Security Settings */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <Shield className="w-6 h-6 text-indigo-600" />
                      <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minimum Password Length
                        </label>
                        <input
                          type="number"
                          value={settings.passwordMinLength}
                          onChange={(e) => handleInputChange('passwordMinLength', parseInt(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Login Attempt Limit
                        </label>
                        <input
                          type="number"
                          value={settings.loginAttemptLimit}
                          onChange={(e) => handleInputChange('loginAttemptLimit', parseInt(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="requireSpecialChars"
                          checked={settings.requireSpecialChars}
                          onChange={(e) => handleInputChange('requireSpecialChars', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="requireSpecialChars" className="text-sm font-medium text-gray-700">
                          Require Special Characters in Password
                        </label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="twoFactorEnabled"
                          checked={settings.twoFactorEnabled}
                          onChange={(e) => handleInputChange('twoFactorEnabled', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="twoFactorEnabled" className="text-sm font-medium text-gray-700">
                          Enable Two-Factor Authentication
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <Bell className="w-6 h-6 text-orange-600" />
                      <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="emailNotifications"
                          checked={settings.emailNotifications}
                          onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="emailNotifications" className="text-sm font-medium text-gray-700">
                          Enable Email Notifications
                        </label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="testCompletionEmails"
                          checked={settings.testCompletionEmails}
                          onChange={(e) => handleInputChange('testCompletionEmails', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="testCompletionEmails" className="text-sm font-medium text-gray-700">
                          Send Test Completion Emails
                        </label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="weeklyReports"
                          checked={settings.weeklyReports}
                          onChange={(e) => handleInputChange('weeklyReports', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="weeklyReports" className="text-sm font-medium text-gray-700">
                          Send Weekly Performance Reports
                        </label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="systemAlerts"
                          checked={settings.systemAlerts}
                          onChange={(e) => handleInputChange('systemAlerts', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="systemAlerts" className="text-sm font-medium text-gray-700">
                          Enable System Alert Notifications
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 