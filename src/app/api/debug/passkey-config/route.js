import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const requestUrl = new URL(request.url);
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return NextResponse.json({
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        isDevelopment,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
      },
      request: {
        url: request.url,
        hostname: requestUrl.hostname,
        origin: requestUrl.origin,
        port: requestUrl.port,
        protocol: requestUrl.protocol
      },
      passkeyConfig: {
        rpID: isDevelopment ? 'localhost' : requestUrl.hostname,
        shouldUseLocalhost: isDevelopment && requestUrl.hostname.includes('localhost'),
        currentOriginForDev: isDevelopment && requestUrl.origin.includes('localhost') ? requestUrl.origin : 'http://localhost:3000',
        expectedOrigin: isDevelopment ? 
          (requestUrl.origin.includes('localhost') ? requestUrl.origin : 'http://localhost:3000') : 
          requestUrl.origin,
        isLocalhost: requestUrl.hostname === 'localhost' || requestUrl.hostname === '127.0.0.1'
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
} 