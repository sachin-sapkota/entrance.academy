'use client';

import Link from 'next/link';

export default function SitemapPage() {
  const siteStructure = {
    main: [
      { title: 'Home', url: '/', description: 'Main landing page with featured tests and announcements' },
      { title: 'Dashboard', url: '/dashboard', description: 'Personalized user dashboard with test history and analytics' },
      { title: 'Profile', url: '/profile', description: 'User profile management and settings' },
    ],
    exams: [
      { title: 'All Exams', url: '/exams', description: 'Browse all available examination categories' },
      { title: 'Live Tests', url: '/live-tests', description: 'Currently active and ongoing test sessions' },
      { title: 'Upcoming Tests', url: '/upcoming-tests', description: 'Scheduled tests and exam announcements' },
      { title: 'Test Session', url: '/test-session', description: 'Active test-taking interface' },
      { title: 'Quiz Center', url: '/quiz', description: 'Quick practice quizzes and flashcards' },
      { title: 'Test Lobby', url: '/lobby', description: 'Pre-test preparation and instructions' },
      { title: 'Solutions', url: '/solution', description: 'Detailed solutions and explanations' },
      { title: 'Results', url: '/results', description: 'Test results and performance analytics' },
    ],
    blog: [
      { title: 'Blog Home', url: '/blog', description: 'Latest articles and exam preparation guides' },
      { title: 'MECEE-BL 2025 Guide', url: '/blog/mecee-bl-2025-complete-guide-nepal-medical-entrance-examination', description: 'Complete guide to Nepal Medical Entrance Examination' },
      { title: 'BSc Entrance Exam Guide', url: '/blog/bsc-entrance-exam-2024-tribhuvan-university-complete-guide', description: 'Tribhuvan University BSc entrance exam preparation' },
      { title: 'BPH Entrance Guide', url: '/blog/bph-bachelor-public-health-entrance-exam-nepal-guide', description: 'Bachelor in Public Health entrance exam guide' },
      { title: 'BNS Entrance Guide', url: '/blog/bns-bachelor-nursing-science-entrance-nepal-guide', description: 'Bachelor in Nursing Science entrance preparation' },
      { title: 'BAMS & Allied Health', url: '/blog/bams-allied-health-sciences-entrance-exam-nepal', description: 'BAMS and Allied Health Sciences entrance guide' },
      { title: 'Mental Agility Test', url: '/blog/mental-agility-test-preparation-nepal-entrance-exams', description: 'Mental Agility Test preparation strategies' },
    ],
    community: [
      { title: 'Discussion Forum', url: '/forum', description: 'Community discussions and study groups' },
      { title: 'Create Discussion', url: '/forum/create', description: 'Start a new discussion topic' },
      { title: 'Feedback Center', url: '/feedback', description: 'Share your feedback and suggestions' },
    ],
    support: [
      { title: 'Help Center', url: '/help', description: 'Comprehensive help and documentation' },
      { title: 'FAQ', url: '/faq', description: 'Frequently asked questions and answers' },
      { title: 'Contact Us', url: '/contact', description: 'Get in touch with our support team' },
      { title: 'Report Issue', url: '/report-issue', description: 'Report technical issues or problems' },
    ],
    authentication: [
      { title: 'Sign In', url: '/login', description: 'Log into your existing account' },
      { title: 'Sign Up', url: '/signup', description: 'Create a new student account' },
      { title: 'Phone Verification', url: '/phone-verify', description: 'Verify your phone number' },
    ],
    admin: [
      { title: 'Admin Dashboard', url: '/admin', description: 'Administrative control panel' },
      { title: 'Analytics', url: '/admin/analytics', description: 'Platform usage and performance analytics' },
      { title: 'Student Management', url: '/admin/students', description: 'Manage student accounts and data' },
      { title: 'Question Sets', url: '/admin/question-sets', description: 'Manage question banks and content' },
      { title: 'Practice Sets', url: '/admin/practice-sets', description: 'Create and manage practice test collections' },
      { title: 'Test Management', url: '/admin/upcoming-tests', description: 'Schedule and manage upcoming tests' },
      { title: 'System Settings', url: '/admin/settings', description: 'Platform configuration and settings' },
      { title: 'Test Upload', url: '/test-upload', description: 'Upload new test content and questions' },
    ],
  };

  const SectionCard = ({ title, items, icon, bgColor = "bg-white" }) => (
    <div className={`${bgColor} rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300`}>
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-3">{icon}</span>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="border-l-2 border-blue-100 pl-4 hover:border-blue-300 transition-colors duration-200">
            <Link 
              href={item.url}
              className="block group"
            >
              <h3 className="font-semibold text-blue-600 hover:text-blue-800 group-hover:underline transition-colors duration-200">
                {item.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {item.description}
              </p>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Complete Website Sitemap
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Navigate through all sections of our comprehensive MCQ Test Platform. 
            Find exactly what you're looking for with our organized site structure.
          </p>
          <div className="mt-6 flex justify-center">
            <Link 
              href="/" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Site Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6 text-center border border-gray-200">
            <div className="text-3xl font-bold text-blue-600 mb-2">6</div>
            <div className="text-sm text-gray-600">Main Sections</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center border border-gray-200">
            <div className="text-3xl font-bold text-green-600 mb-2">28+</div>
            <div className="text-sm text-gray-600">Total Pages</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center border border-gray-200">
            <div className="text-3xl font-bold text-purple-600 mb-2">6</div>
            <div className="text-sm text-gray-600">Blog Articles</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center border border-gray-200">
            <div className="text-3xl font-bold text-orange-600 mb-2">7</div>
            <div className="text-sm text-gray-600">Admin Tools</div>
          </div>
        </div>

        {/* Main Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SectionCard 
            title="Main Pages" 
            items={siteStructure.main}
            icon="🏠"
            bgColor="bg-gradient-to-br from-blue-50 to-blue-100"
          />
          
          <SectionCard 
            title="Tests & Exams" 
            items={siteStructure.exams}
            icon="📝"
            bgColor="bg-gradient-to-br from-green-50 to-green-100"
          />
          
          <SectionCard 
            title="Blog & Articles" 
            items={siteStructure.blog}
            icon="📚"
            bgColor="bg-gradient-to-br from-purple-50 to-purple-100"
          />
          
          <SectionCard 
            title="Community" 
            items={siteStructure.community}
            icon="👥"
            bgColor="bg-gradient-to-br from-yellow-50 to-yellow-100"
          />
          
          <SectionCard 
            title="Support & Help" 
            items={siteStructure.support}
            icon="🛟"
            bgColor="bg-gradient-to-br from-orange-50 to-orange-100"
          />
          
          <SectionCard 
            title="Account & Authentication" 
            items={siteStructure.authentication}
            icon="🔐"
            bgColor="bg-gradient-to-br from-indigo-50 to-indigo-100"
          />
        </div>

        {/* Admin Section - Full Width */}
        <div className="mt-8">
          <SectionCard 
            title="Administration (Admin Access Required)" 
            items={siteStructure.admin}
            icon="⚙️"
            bgColor="bg-gradient-to-br from-red-50 to-red-100"
          />
        </div>

        {/* SEO and Technical Information */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">🔍</span>
            SEO & Technical Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Search Engine Optimization</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• XML Sitemap available at <code className="bg-gray-100 px-2 py-1 rounded text-sm">/sitemap.xml</code></li>
                <li>• All pages optimized with meta titles and descriptions</li>
                <li>• Blog posts use SEO-friendly slugs for better rankings</li>
                <li>• Structured data markup for enhanced search results</li>
                <li>• Mobile-responsive design for all devices</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Dynamic Content</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Forum topics: <code className="bg-gray-100 px-2 py-1 rounded text-sm">/forum/[topicId]</code></li>
                <li>• Individual blog posts: <code className="bg-gray-100 px-2 py-1 rounded text-sm">/blog/[slug]</code></li>
                <li>• Test sessions with unique IDs</li>
                <li>• User-generated content in forums</li>
                <li>• Real-time test environments</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 text-center">
          <div className="bg-gray-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Navigation</h3>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200">
                Home
              </Link>
              <Link href="/dashboard" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200">
                Dashboard
              </Link>
              <Link href="/exams" className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200">
                Exams
              </Link>
              <Link href="/blog" className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors duration-200">
                Blog
              </Link>
              <Link href="/forum" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200">
                Forum
              </Link>
              <Link href="/help" className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200">
                Help
              </Link>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-8 text-center text-sm text-gray-500">
          Last updated: January 15, 2024 | Total pages: 28+ | Coverage: Complete website structure
        </div>
      </div>
    </div>
  );
} 