'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  User, 
  ArrowRight, 
  BookOpen, 
  Brain,
  Search,
  GraduationCap,
  Menu,
  X,
  Eye,
  Tag
} from 'lucide-react';
import Footer from '../components/Footer';
import blogPosts from './data/blogPosts';

// SEO metadata for the blog listing page will be handled in the Head component

// Blog posts imported from data file

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPosts, setFilteredPosts] = useState(blogPosts);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    if (searchTerm) {
      const filtered = blogPosts.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredPosts(filtered);
    } else {
      setFilteredPosts(blogPosts);
    }
  }, [searchTerm]);

  const featuredPosts = filteredPosts.filter(post => post.featured);
  const regularPosts = filteredPosts.filter(post => !post.featured);

  return (
    <>
      <Head>
        <title>Blog - Nepal Entrance Exam Preparation Articles | Entrance Academy</title>
        <meta name="description" content="Read comprehensive guides and articles about Nepal entrance exams including MECEE-BL, IOE, TU, KU entrance preparation. Expert tips, syllabus analysis, and study strategies for medical and engineering entrance exams." />
        <meta name="keywords" content="Nepal entrance exam blog, MECEE-BL articles, medical entrance preparation, engineering entrance Nepal, TU entrance exam guides, IOE entrance tips, Nepal student blog, entrance exam strategies, study guides Nepal, exam preparation articles" />
        
        {/* OpenGraph tags */}
        <meta property="og:title" content="Blog - Nepal Entrance Exam Preparation Articles | Entrance Academy" />
        <meta property="og:description" content="Read comprehensive guides and articles about Nepal entrance exams including MECEE-BL, IOE, TU, KU entrance preparation." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://entrance.academy/blog" />
        <meta property="og:image" content="https://entrance.academy/blog-og-image.jpg" />
        <meta property="og:site_name" content="Entrance Academy" />
        
        {/* Twitter tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Blog - Nepal Entrance Exam Preparation Articles | Entrance Academy" />
        <meta name="twitter:description" content="Read comprehensive guides and articles about Nepal entrance exams including MECEE-BL, IOE, TU, KU entrance preparation." />
        <meta name="twitter:image" content="https://entrance.academy/blog-twitter-image.jpg" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://entrance.academy/blog" />
        
        {/* Structured Data for Blog Section */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Blog",
              "name": "Entrance Academy Blog",
              "description": "Nepal entrance exam preparation articles and guides",
              "url": "https://entrance.academy/blog",
              "publisher": {
                "@type": "Organization",
                "name": "Entrance Academy",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://entrance.academy/logo.png"
                }
              },
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": "https://entrance.academy/blog"
              },
              "blogPost": blogPosts.map(post => ({
                "@type": "BlogPosting",
                "headline": post.title,
                "description": post.excerpt,
                "url": `https://entrance.academy/blog/${post.slug}`,
                "datePublished": post.publishedAt,
                "author": {
                  "@type": "Person",
                  "name": post.author
                }
              }))
            }),
          }}
        />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation - Same as landing page */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/90 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Clickable */}
            <Link href="/" className="flex items-center space-x-2">
              <motion.div 
                className="flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  <span className="hidden xs:inline">Entrance Academy</span>
                  <span className="xs:hidden">EA</span>
                </span>
              </motion.div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/#features" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                Features
              </Link>
              <Link href="/#subjects" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                Subjects
              </Link>
              <Link href="/blog" className="text-blue-600 font-medium">
                Blog
              </Link>
              <Link href="/forum" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                Community
              </Link>
            </div>
            
            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link 
                href="/login"
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Sign In
              </Link>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  href="/signup"
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Get Started
                </Link>
              </motion.div>
            </div>

            {/* Mobile Menu & Auth */}
            <div className="md:hidden flex items-center space-x-2">
              <Link 
                href="/login"
                className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors px-2 py-1"
              >
                Sign In
              </Link>
              <Link 
                href="/signup"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
              >
                Get Started
              </Link>
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Toggle mobile menu"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white border-t border-slate-200/50"
          >
            <div className="px-4 py-4 space-y-3">
              <Link 
                href="/#features" 
                onClick={() => setShowMobileMenu(false)}
                className="block text-slate-600 hover:text-slate-900 font-medium py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Features
              </Link>
              <Link 
                href="/#subjects" 
                onClick={() => setShowMobileMenu(false)}
                className="block text-slate-600 hover:text-slate-900 font-medium py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Subjects
              </Link>
              <Link 
                href="/blog" 
                onClick={() => setShowMobileMenu(false)}
                className="block text-blue-600 font-medium py-2 px-3 rounded-lg bg-blue-50"
              >
                Blog
              </Link>
              <Link 
                href="/forum" 
                onClick={() => setShowMobileMenu(false)}
                className="block text-slate-600 hover:text-slate-900 font-medium py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Community
              </Link>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* Header Section */}
      <section className="pt-12 pb-8 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-blue-600 font-medium text-sm uppercase tracking-wide"
            >
              Blog
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-slate-900 mt-2 mb-4"
            >
              Discover our latest news
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-slate-600 max-w-3xl mx-auto mb-8"
            >
              Discover the achievements that set us apart. From groundbreaking projects to industry accolades, we take pride in our accomplishments.
            </motion.p>
            
            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative max-w-md mx-auto"
            >
              <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-20 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
              />
              <button className="absolute right-2 top-2 bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                Find Now
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      {featuredPosts.length > 0 && (
        <section className="py-12 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Featured</h2>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8">
              {featuredPosts.slice(0, 3).map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-white opacity-80" />
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center space-x-3 text-sm text-slate-500 mb-3">
                      <span className="text-blue-600 font-medium">{new Date(post.publishedAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h3>
                    
                    <p className="text-slate-600 mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-500">
                        <span>{post.readTime}</span>
                      </div>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors group text-sm font-medium"
                      >
                        Read More
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Articles */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Latest</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularPosts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <div className="aspect-video bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center">
                  <Brain className="w-12 h-12 text-white opacity-80" />
                </div>
                
                <div className="p-6">
                  <div className="flex items-center space-x-3 text-sm text-slate-500 mb-3">
                    <span className="text-blue-600 font-medium">{new Date(post.publishedAt).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric' 
                    })}</span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  
                  <p className="text-slate-600 mb-4 line-clamp-3 text-sm">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                      <span>{post.readTime}</span>
                    </div>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors group text-sm font-medium"
                    >
                      Read More
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
    </>
  );
} 