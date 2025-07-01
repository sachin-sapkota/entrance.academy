'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  HelpCircle, 
  BookOpen, 
  MessageSquare, 
  FileText, 
  Video, 
  ChevronDown, 
  ChevronRight,
  ExternalLink,
  ArrowLeft,
  Star,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Info,
  Mail,
  Phone,
  GraduationCap,
  Shield,
  FileText as FileTextIcon
} from 'lucide-react';
import Footer from '../components/Footer';

export default function HelpCenterPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [openFAQs, setOpenFAQs] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Topics', icon: BookOpen, color: 'blue' },
    { id: 'getting-started', name: 'Getting Started', icon: GraduationCap, color: 'green' },
    { id: 'tests', name: 'Tests & Exams', icon: FileText, color: 'purple' },
    { id: 'account', name: 'Account Settings', icon: Users, color: 'orange' },
    { id: 'technical', name: 'Technical Issues', icon: AlertCircle, color: 'red' }
  ];

  const faqs = [
    {
      id: 1,
      category: 'getting-started',
      question: 'How do I create an account?',
      answer: 'To create an account, click on the "Sign Up" button on the homepage. Fill in your email, password, and basic information. You\'ll receive a verification email to activate your account.',
      popularity: 95
    },
    {
      id: 2,
      category: 'getting-started',
      question: 'What types of tests are available?',
      answer: 'We offer various types of tests including practice tests, mock exams, and timed assessments across multiple subjects like Mathematics, Physics, Chemistry, Biology, and more.',
      popularity: 88
    },
    {
      id: 3,
      category: 'tests',
      question: 'How do I start a test?',
      answer: 'Navigate to the "Available Tests" section on your dashboard, select a test, review the instructions, and click "Start Test". Make sure you have a stable internet connection.',
      popularity: 92
    },
    {
      id: 4,
      category: 'tests',
      question: 'Can I pause a test and resume later?',
      answer: 'Yes, most practice tests allow you to pause and resume. However, timed mock exams and official tests must be completed in one session. Check the test instructions for specific rules.',
      popularity: 85
    },
    {
      id: 5,
      category: 'tests',
      question: 'How is my score calculated?',
      answer: 'Scores are calculated based on correct answers, with negative marking for incorrect answers in some tests. Your final score is displayed as a percentage and percentile ranking.',
      popularity: 79
    },
    {
      id: 6,
      category: 'account',
      question: 'How do I update my profile information?',
      answer: 'Go to your Profile page from the user menu, click "Edit Profile", make your changes, and save. Some changes may require email verification.',
      popularity: 73
    },
    {
      id: 7,
      category: 'account',
      question: 'I forgot my password. How do I reset it?',
      answer: 'Click "Forgot Password" on the login page, enter your email address, and follow the instructions in the reset email. The link expires after 24 hours.',
      popularity: 90
    },
    {
      id: 8,
      category: 'technical',
      question: 'The test is not loading. What should I do?',
      answer: 'First, check your internet connection and refresh the page. Clear your browser cache, disable browser extensions, or try a different browser. Contact support if the issue persists.',
      popularity: 67
    },
    {
      id: 9,
      category: 'technical',
      question: 'Can I use the platform on mobile devices?',
      answer: 'Yes, our platform is fully responsive and works on tablets and smartphones. However, we recommend using a desktop or laptop for the best test-taking experience.',
      popularity: 81
    }
  ];

  const resources = [
    {
      title: 'Quick Start Guide',
      description: 'Everything you need to know to get started',
      icon: GraduationCap,
      type: 'guide',
      duration: '5 min read',
      color: 'blue'
    },
    {
      title: 'Test Taking Tips',
      description: 'Best practices for optimal performance',
      icon: Star,
      type: 'article',
      duration: '8 min read',
      color: 'yellow'
    },
    {
      title: 'Video Tutorials',
      description: 'Step-by-step video guides',
      icon: Video,
      type: 'video',
      duration: '15 min watch',
      color: 'purple'
    },
    {
      title: 'Platform Features',
      description: 'Detailed overview of all features',
      icon: BookOpen,
      type: 'documentation',
      duration: '12 min read',
      color: 'green'
    }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFAQ = (faqId) => {
    setOpenFAQs(prev => ({
      ...prev,
      [faqId]: !prev[faqId]
    }));
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
      purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
      orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
      red: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
      yellow: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Back</span>
            </motion.button>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">Help Center</h1>
                <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">Find answers and get support</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/contact')}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
              >
                <span className="hidden sm:inline">Contact </span>Support
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            How can we help you?
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Search our knowledge base or browse by category to find the answers you need
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>
        </motion.section>

        {/* Categories */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h3 className="text-2xl font-bold text-slate-900 mb-6">Browse by Category</h3>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-6 rounded-2xl border transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-blue-50 border-blue-200 shadow-md'
                    : 'bg-white border-slate-200 hover:shadow-md hover:border-slate-300'
                }`}
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${getColorClasses(category.color)} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                  <category.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-slate-900 text-sm">{category.name}</h4>
              </motion.button>
            ))}
          </div>
        </motion.section>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* FAQs */}
          <div className="lg:col-span-2">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h3>
                <span className="text-sm text-slate-500">{filteredFAQs.length} questions</span>
              </div>

              <div className="space-y-4">
                {filteredFAQs.map((faq, index) => (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-200"
                  >
                    <button
                      onClick={() => toggleFAQ(faq.id)}
                      className="w-full p-6 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-1">{faq.question}</h4>
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <span className="flex items-center">
                            <Star className="w-4 h-4 mr-1" />
                            {faq.popularity}% helpful
                          </span>
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${openFAQs[faq.id] ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {openFAQs[faq.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-slate-200"
                        >
                          <div className="p-6 bg-slate-50">
                            <p className="text-slate-700 leading-relaxed">{faq.answer}</p>
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                              <span className="text-sm text-slate-500">Was this helpful?</span>
                              <div className="flex items-center space-x-2">
                                <button className="text-green-600 hover:text-green-700 text-sm font-medium">Yes</button>
                                <button className="text-red-600 hover:text-red-700 text-sm font-medium">No</button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>

              {filteredFAQs.length === 0 && (
                <div className="text-center py-12">
                  <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">No questions found</h4>
                  <p className="text-slate-600">Try adjusting your search or category filter</p>
                </div>
              )}
            </motion.section>
          </div>

          {/* Resources Sidebar */}
          <div>
            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-xl font-bold text-slate-900 mb-6">Resources</h3>
              <div className="space-y-4">
                {resources.map((resource, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-10 h-10 bg-gradient-to-br ${getColorClasses(resource.color)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <resource.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-1">{resource.title}</h4>
                        <p className="text-sm text-slate-600 mb-2">{resource.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {resource.duration}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Quick Contact */}
              <div className="mt-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
                <h4 className="font-bold mb-2">Still need help?</h4>
                <p className="text-blue-100 text-sm mb-4">Our support team is here to assist you</p>
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/contact')}
                    className="w-full bg-white/20 hover:bg-white/30 rounded-lg p-3 flex items-center space-x-3 transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    <span className="font-medium">Contact Support</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/feedback')}
                    className="w-full bg-white/20 hover:bg-white/30 rounded-lg p-3 flex items-center space-x-3 transition-colors"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span className="font-medium">Send Feedback</span>
                  </motion.button>
                </div>
              </div>
            </motion.section>
          </div>
        </div>

        {/* Legal Sections */}
        <motion.section
          id="privacy"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 bg-white rounded-2xl p-8 border border-slate-200"
        >
          <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
            <Shield className="w-6 h-6 mr-3 text-blue-500" />
            Privacy Policy
          </h3>
          <div className="prose max-w-none text-slate-700">
            <p className="mb-4">
              Your privacy is important to us. This privacy policy explains how we collect, use, and protect your personal information when you use our platform.
            </p>
            <h4 className="text-lg font-semibold text-slate-900 mb-3">Information We Collect</h4>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Account information (name, email, educational details)</li>
              <li>Test performance and analytics data</li>
              <li>Usage patterns and platform interaction data</li>
              <li>Technical information (IP address, browser type, device info)</li>
            </ul>
            <h4 className="text-lg font-semibold text-slate-900 mb-3">How We Use Your Information</h4>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Provide and improve our educational services</li>
              <li>Generate personalized learning analytics</li>
              <li>Communicate important updates and support</li>
              <li>Ensure platform security and prevent fraud</li>
            </ul>
            <h4 className="text-lg font-semibold text-slate-900 mb-3">Data Protection</h4>
            <p className="mb-4">
              We implement industry-standard security measures to protect your data, including encryption, secure servers, and regular security audits. Your personal information is never sold to third parties.
            </p>
            <h4 className="text-lg font-semibold text-slate-900 mb-3">Your Rights</h4>
            <p>
              You have the right to access, update, or delete your personal information. Contact our support team for any privacy-related requests.
            </p>
          </div>
        </motion.section>

        <motion.section
          id="terms"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-white rounded-2xl p-8 border border-slate-200"
        >
          <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
            <FileTextIcon className="w-6 h-6 mr-3 text-green-500" />
            Terms of Service
          </h3>
          <div className="prose max-w-none text-slate-700">
            <p className="mb-4">
              By using our platform, you agree to these terms of service. Please read them carefully.
            </p>
            <h4 className="text-lg font-semibold text-slate-900 mb-3">Platform Usage</h4>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>You must be at least 13 years old to use this platform</li>
              <li>You are responsible for maintaining account security</li>
              <li>One account per person; sharing accounts is prohibited</li>
              <li>Use the platform only for educational purposes</li>
            </ul>
            <h4 className="text-lg font-semibold text-slate-900 mb-3">Test Taking Rules</h4>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Complete tests honestly without external assistance</li>
              <li>Do not share test content or answers with others</li>
              <li>Follow all test instructions and time limits</li>
              <li>Report any technical issues immediately</li>
            </ul>
            <h4 className="text-lg font-semibold text-slate-900 mb-3">Prohibited Activities</h4>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Attempting to hack or compromise platform security</li>
              <li>Creating multiple accounts to circumvent limitations</li>
              <li>Sharing copyrighted content without permission</li>
              <li>Using automated tools or bots</li>
            </ul>
            <h4 className="text-lg font-semibold text-slate-900 mb-3">Account Termination</h4>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms. Users will be notified of violations and given opportunity to correct issues when possible.
            </p>
          </div>
        </motion.section>

        <motion.section
          id="guidelines"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-white rounded-2xl p-8 border border-slate-200"
        >
          <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
            <Users className="w-6 h-6 mr-3 text-purple-500" />
            Community Guidelines
          </h3>
          <div className="prose max-w-none text-slate-700">
            <p className="mb-4">
              Our community guidelines ensure a positive, respectful, and productive learning environment for all users.
            </p>
            <h4 className="text-lg font-semibold text-slate-900 mb-3">Respectful Communication</h4>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Treat all community members with respect and courtesy</li>
              <li>Use appropriate language and avoid offensive content</li>
              <li>Be constructive in your feedback and discussions</li>
              <li>Respect diverse backgrounds and learning styles</li>
            </ul>
            <h4 className="text-lg font-semibold text-slate-900 mb-3">Forum Participation</h4>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Search existing topics before creating new ones</li>
              <li>Use clear, descriptive titles for your posts</li>
              <li>Stay on topic and provide helpful content</li>
              <li>Credit sources when sharing external content</li>
            </ul>
            <h4 className="text-lg font-semibold text-slate-900 mb-3">Prohibited Content</h4>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Spam, advertisements, or self-promotion</li>
              <li>Harassment, bullying, or discriminatory content</li>
              <li>Sharing of test answers or cheating materials</li>
              <li>Personal information of other users</li>
            </ul>
            <h4 className="text-lg font-semibold text-slate-900 mb-3">Reporting Issues</h4>
            <p className="mb-4">
              If you encounter inappropriate content or behavior, please report it using our reporting tools or contact support directly.
            </p>
            <h4 className="text-lg font-semibold text-slate-900 mb-3">Consequences</h4>
            <p>
              Violations may result in content removal, temporary suspension, or permanent account termination depending on severity and frequency.
            </p>
          </div>
        </motion.section>
      </main>
      <Footer />
    </div>
  );
} 