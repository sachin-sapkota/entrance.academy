import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    console.log('🔍 Checking test_sessions table structure...');

    // Check if test_sessions table exists and get its structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('test_sessions')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Error checking table:', tableError);
      return NextResponse.json({
        success: false,
        error: tableError.message,
        tableExists: false
      });
    }

    // Try to get column information by describing the table
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'test_sessions' })
      .catch(() => null);

    // Try a simple query to see what columns exist
    const { data: sampleData, error: sampleError } = await supabase
      .from('test_sessions')
      .select('*')
      .limit(1);

    let availableColumns = [];
    if (sampleData && sampleData.length > 0) {
      availableColumns = Object.keys(sampleData[0]);
    } else {
      // Try to infer columns from an insert attempt
      const { error: insertError } = await supabase
        .from('test_sessions')
        .insert({
          test_id: 'test-check',
          user_id: 'test-check',
          session_token: 'test-check-token'
        });
      
      if (insertError) {
        console.log('Insert error (expected):', insertError.message);
        // Parse error message to understand required columns
      }
    }

    // Check if required columns exist
    const requiredColumns = ['session_key', 'session_data', 'expires_at'];
    const missingColumns = requiredColumns.filter(col => !availableColumns.includes(col));

    return NextResponse.json({
      success: true,
      tableExists: true,
      availableColumns,
      missingColumns,
      hasRequiredColumns: missingColumns.length === 0,
      sampleData: sampleData?.[0] || null,
      recommendations: missingColumns.length > 0 ? [
        'The test_sessions table is missing required columns for session persistence',
        'Consider running the migration to add: ' + missingColumns.join(', ')
      ] : ['Table structure is compatible with session manager']
    });

  } catch (error) {
    console.error('💥 Error checking table structure:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 