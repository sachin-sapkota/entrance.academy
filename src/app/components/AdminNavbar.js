'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  Database,
  Users,
  FileText,
  BarChart3,
  Settings,
  Calendar,
  BookOpen,
  Target,
  Globe,
  ChevronDown,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const AdminNavbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: Home,
      description: 'Overview and analytics'
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      description: 'System configuration'
    }
  ];

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (href) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center">
            {/* Logo */}
            <div className="flex items-center">
              <div className="bg-blue-600 text-white p-2 rounded-lg mr-3">
                <Database className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-gray-900">MCQ Test</span>
                <span className="text-xs text-blue-600 font-medium">Admin Panel</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden xl:ml-8 xl:flex xl:items-center xl:space-x-1">
              {navigationItems.map((item) => {
                const isItemActive = isActive(item.href);
                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.href)}
                    className={`group relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isItemActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className={`w-4 h-4 ${isItemActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                      <span>{item.name}</span>
                    </div>
                    
                    {/* Tooltip */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                      {item.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile menu button and Profile */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="xl:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">A</span>
                </div>
                <span className="hidden sm:block text-sm font-medium">Admin</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                >
                  <button
                    onClick={() => router.push('/profile')}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Users className="w-4 h-4" />
                    Profile
                  </button>
                  <button
                    onClick={() => router.push('/admin/settings')}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="xl:hidden border-t border-gray-200 bg-white"
        >
          <div className="px-4 py-3 space-y-1">
            {navigationItems.map((item) => {
              const isItemActive = isActive(item.href);
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    router.push(item.href);
                    setIsMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isItemActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isItemActive ? 'text-blue-600' : 'text-gray-500'}`} />
                  <div className="flex flex-col items-start">
                    <span>{item.name}</span>
                    <span className="text-xs text-gray-500">{item.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default AdminNavbar; 