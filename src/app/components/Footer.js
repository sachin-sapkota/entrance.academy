'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  Youtube,
  BookOpen,
  HelpCircle,
  MessageSquare,
  FileText,
  Shield,
  Lock,
  Heart,
  ExternalLink
} from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Available Tests', href: '/live-tests' },
      { name: 'My Exams', href: '/exams' },
      { name: 'Upcoming Tests', href: '/upcoming-tests' },
    ],
    support: [
      { name: 'Help Center', href: '/help' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Contact Us', href: '/contact' },
      { name: 'Report Issue', href: '/report-issue' },
    ],
    community: [
      { name: 'Discussion Forum', href: '/forum' },
      { name: 'Share Feedback', href: '/feedback' },
      { name: 'Study Resources', href: '/help' },
      { name: 'Join Community', href: '/forum/create' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/help#privacy' },
      { name: 'Terms of Service', href: '/help#terms' },
      { name: 'Help & Support', href: '/help' },
      { name: 'Community Guidelines', href: '/help#guidelines' },
    ]
  };

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: 'https://facebook.com/entrance.academy', color: 'hover:text-blue-600' },
    { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/entrance_academy', color: 'hover:text-blue-400' },
    { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/entrance.academy', color: 'hover:text-pink-600' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com/company/entrance-academy', color: 'hover:text-blue-700' },
    { name: 'YouTube', icon: Youtube, href: 'https://youtube.com/entrance.academy', color: 'hover:text-red-600' },
  ];

  return (
    <footer className="bg-slate-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 lg:gap-8">
          {/* Brand Section */}
          <div className="sm:col-span-2 lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="text-xl sm:text-2xl font-bold">Entrance.academy</span>
              </div>
              <p className="text-slate-300 leading-relaxed mb-6 text-sm sm:text-base">
                Empowering students with comprehensive online testing and assessment tools. 
                Practice, learn, and excel with our advanced MCQ platform designed for academic success.
              </p>
              
              {/* Contact Info */}
              <div className="space-y-3 text-sm text-slate-400">
                <div className="flex items-start space-x-3">
                  <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="break-all">info@entrance.academy</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>+977 9826277914</span>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Bharatpur Chitwan</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Platform Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="col-span-1"
          >
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center">
              <BookOpen className="w-4 h-4 mr-2" />
              Platform
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-slate-300 hover:text-white transition-colors text-sm block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Support Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="col-span-1"
          >
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center">
              <HelpCircle className="w-4 h-4 mr-2" />
              Support
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-slate-300 hover:text-white transition-colors text-sm block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Community Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="col-span-1"
          >
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              Community
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.community.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-slate-300 hover:text-white transition-colors text-sm block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="col-span-1"
          >
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Legal
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-slate-300 hover:text-white transition-colors text-sm block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Newsletter Signup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-slate-800"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start lg:items-center">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Stay Updated</h3>
              <p className="text-slate-300 text-sm sm:text-base">
                Get the latest updates about new features, study tips, and platform improvements.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 text-sm sm:text-base whitespace-nowrap"
              >
                Subscribe
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
            {/* Copyright */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-xs sm:text-sm text-slate-400 text-center sm:text-left"
            >
              <span>© {currentYear} Entrance.academy. All rights reserved.</span>
              <div className="flex items-center justify-center sm:justify-start space-x-1">
                <span>Made with</span>
                <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 fill-current" />
                <span>for students worldwide</span>
              </div>
            </motion.div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4"
            >
              <span className="text-xs sm:text-sm text-slate-400">Follow us:</span>
              <div className="flex space-x-3">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.name}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 text-slate-400 ${social.color} transition-colors rounded-lg hover:bg-slate-800`}
                    aria-label={social.name}
                  >
                    <social.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Security Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center lg:justify-start space-x-2 text-xs sm:text-sm text-slate-400"
            >
              <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Secured & Encrypted</span>
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  );
} 