#!/usr/bin/env node

/**
 * Admin Account Creation Script
 * 
 * This script creates the initial admin account for the MCQ Test Platform.
 * Run this script once after setting up the database.
 * 
 * Usage: node scripts/create-admin.js
 */

const https = require('https');

const createAdmin = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  console.log('🔧 Creating admin account...');
  console.log(`📍 Target URL: ${baseUrl}/api/admin/create-admin`);
  
  try {
    const response = await fetch(`${baseUrl}/api/admin/create-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Admin account created successfully!');
      console.log('📧 Email: admin@entrance.academy');
      console.log('🔑 Password: Admin123!@#');
      console.log('⚠️  Please change these credentials after first login!');
      console.log('\n🎯 Admin can now login at: /login');
    } else {
      console.log('❌ Failed to create admin account:', data.message);
      
      if (data.message.includes('already exists')) {
        console.log('ℹ️  Admin account already exists. You can login with:');
        console.log('📧 Email: admin@entrance.academy');
        console.log('🔑 Password: Admin123!@#');
      }
    }
  } catch (error) {
    console.error('❌ Error creating admin account:', error.message);
    console.log('\n🔧 Make sure the application is running and try again.');
    console.log('💡 Run: npm run dev');
  }
};

// Check if we're running in Node.js environment
if (typeof window === 'undefined') {
  createAdmin();
} else {
  console.error('This script should be run in Node.js environment, not in the browser.');
}

module.exports = { createAdmin }; 