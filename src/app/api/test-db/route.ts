import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      DATABASE_URL_LENGTH: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0,
      SUPABASE_DATABASE_URL_EXISTS: !!process.env.SUPABASE_DATABASE_URL,
      POSTGRES_URL_NON_POOLING_EXISTS: !!process.env.POSTGRES_URL_NON_POOLING,
      POSTGRES_URL_EXISTS: !!process.env.POSTGRES_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'not set (defaults to localhost:3000)',
      STRAVA_CLIENT_ID_EXISTS: !!process.env.STRAVA_CLIENT_ID,
      STRAVA_CLIENT_ID_VALUE: process.env.STRAVA_CLIENT_ID ? `${process.env.STRAVA_CLIENT_ID.substring(0, 3)}...` : 'not set',
      STRAVA_CLIENT_SECRET_EXISTS: !!process.env.STRAVA_CLIENT_SECRET,
      GEMINI_API_KEY_EXISTS: !!process.env.GEMINI_API_KEY,
    },
    database: {
      status: 'unknown',
      error: null,
      users: [],
    }
  };

  try {
    const db = await getDb();
    diagnostics.database.status = 'connected';
    
    // Test a simple query
    const userCount = await db.get('SELECT COUNT(*) as count FROM users');
    diagnostics.database.userCount = userCount ? userCount.count : 0;
    
    // Retrieve users list to inspect their Strava states
    const users = await db.all('SELECT id, name, level, strava_connected, strava_access_token IS NOT NULL as has_access_token, strava_refresh_token IS NOT NULL as has_refresh_token, strava_token_expires FROM users');
    diagnostics.database.users = users;

  } catch (err: any) {
    diagnostics.database.status = 'failed';
    diagnostics.database.error = err.message || String(err);
  }

  return NextResponse.json(diagnostics);
}
