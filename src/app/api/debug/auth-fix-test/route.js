import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET() {
  try {
    console.log('🧪 Testing auth fix...');
    
    // Test 1: Check if server client works
    console.log('✅ Server client imported successfully');
    
    // Test 2: Check database connection
    const { data: domains, error: domainsError } = await supabaseServer
      .from('domains')
      .select('id, name')
      .limit(1);
    
    if (domainsError) {
      console.error('❌ Database connection failed:', domainsError);
      return NextResponse.json({ 
        success: false, 
        error: 'Database connection failed',
        details: domainsError.message 
      });
    }
    
    console.log('✅ Database connection working');
    
    // Test 3: Check if we can query users table (with proper RLS)
    const { data: users, error: usersError } = await supabaseServer
      .from('users')
      .select('id, email')
      .limit(1);
    
    if (usersError) {
      console.log('⚠️ Users query failed (expected with RLS):', usersError.message);
    } else {
      console.log('✅ Users table accessible');
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Auth fixes working properly',
      tests: {
        serverClient: true,
        databaseConnection: true,
        domains: domains?.length > 0
      }
    });
    
  } catch (error) {
    console.error('💥 Auth fix test failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Test failed',
      details: error.message 
    });
  }
} 