'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  HelpCircle, 
  ChevronDown,
  ArrowLeft,
  Star,
  CheckCircle,
  AlertCircle,
  BookOpen,
  MessageSquare,
  Users,
  GraduationCap
} from 'lucide-react';
import Footer from '../components/Footer';

export default function FAQPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [openFAQs, setOpenFAQs] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Questions', icon: BookOpen, color: 'blue', count: 15 },
    { id: 'getting-started', name: 'Getting Started', icon: GraduationCap, color: 'green', count: 5 },
    { id: 'tests', name: 'Tests & Exams', icon: HelpCircle, color: 'purple', count: 5 },
    { id: 'account', name: 'Account Settings', icon: Users, color: 'orange', count: 3 },
    { id: 'technical', name: 'Technical Issues', icon: AlertCircle, color: 'red', count: 2 }
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
      answer: 'Yes, most practice tests allow you to pause and resume. However, timed mock exams and official tests must be completed in one session.',
      popularity: 85
    },
    {
      id: 5,
      category: 'account',
      question: 'How do I update my profile information?',
      answer: 'Go to your Profile page from the user menu, click "Edit Profile", make your changes, and save. Some changes may require email verification.',
      popularity: 73
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
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">FAQ</h1>
                <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">Find quick answers</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/help')}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Help Center
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-slate-600 mb-6">
            Get instant answers to the most common questions
          </p>

          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <category.icon className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-600">{category.name}</span>
                <span className="text-xs text-slate-500">({category.count})</span>
              </motion.button>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="space-y-4">
            {filteredFAQs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">{faq.question}</h4>
                    <div className="flex items-center space-x-2 text-sm text-slate-500">
                      <Star className="w-4 h-4 fill-current text-yellow-400" />
                      <span>{faq.popularity}% helpful</span>
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

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white text-center"
        >
          <MessageSquare className="w-8 h-8 mx-auto mb-3" />
          <h3 className="text-lg font-bold mb-2">Still have questions?</h3>
          <p className="text-blue-100 mb-4">
            Can't find what you're looking for? Contact our support team.
          </p>
          <div className="flex gap-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/contact')}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
            >
              Contact Support
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/forum')}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
            >
              Discussion Forum
            </motion.button>
          </div>
        </motion.section>
      </main>
      <Footer />
    </div>
  );
} 