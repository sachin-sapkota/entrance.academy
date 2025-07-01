import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';

export async function GET(request) {
  try {
    // Test authentication first
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        message: 'Authentication failed',
        authError: authError ? authError.message : 'No user found',
        headers: Object.fromEntries(request.headers.entries())
      });
    }

    // Check upload directories
    const fs = require('fs');
    const path = require('path');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const questionDir = path.join(uploadDir, 'question');
    const optionDir = path.join(uploadDir, 'option');

    const checkDir = (dir) => {
      try {
        const stats = fs.statSync(dir);
        return {
          exists: true,
          isDirectory: stats.isDirectory(),
          permissions: stats.mode.toString(8).slice(-3),
          writable: fs.accessSync(dir, fs.constants.W_OK) === undefined
        };
      } catch (e) {
        return {
          exists: false,
          error: e.message
        };
      }
    };

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      directories: {
        upload: checkDir(uploadDir),
        question: checkDir(questionDir),
        option: checkDir(optionDir)
      },
      testUploadUrl: '/api/upload',
      note: 'Use POST request with FormData containing "file" and "entityType" fields'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
} 